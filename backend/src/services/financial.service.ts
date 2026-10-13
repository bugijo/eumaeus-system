import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getCurrentClinicId, getCurrentUserId } from '../tenantContext';

export class FinancialService {
  static listCenters() { return prisma.resultCenter.findMany({ orderBy: { code: 'asc' } }); }
  static listExpenses() { return (prisma.expense as any).findMany({ include: { resultCenter: true }, orderBy: { incurredAt: 'desc' } }); }
  static createCenter(input: { code: string; name: string }) {
    if (!input.code?.trim() || !input.name?.trim()) throw new Error('Código e nome do centro são obrigatórios');
    return (prisma.resultCenter as any).create({ data: { code: input.code.trim().toUpperCase(), name: input.name.trim() } });
  }

  static async prepareAccountingExport(input: { from: string; to: string; resultCenterIds?: number[] }) {
    const clinicId = getCurrentClinicId();
    const actorUserId = getCurrentUserId();
    if (!clinicId || !actorUserId) throw new Error('Autoria autenticada obrigatória');
    const from = new Date(`${input.from}T00:00:00.000Z`);
    const to = new Date(`${input.to}T23:59:59.999Z`);
    if (!input.from || !input.to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
      throw new Error('Período inválido');
    }
    const centerIds = (input.resultCenterIds || []).filter(Number.isInteger);
    const centerFilter = centerIds.length ? { in: centerIds } : undefined;
    return prisma.$transaction(async (tx: any) => {
      const [invoices, expenses, centers] = await Promise.all([
        tx.invoice.findMany({
          where: { clinicId, createdAt: { gte: from, lte: to }, ...(centerFilter ? { resultCenterId: centerFilter } : {}) },
          include: { payments: true, discounts: true, items: true, resultCenter: true },
          orderBy: { createdAt: 'asc' },
        }),
        tx.expense.findMany({
          where: { clinicId, incurredAt: { gte: from, lte: to }, ...(centerFilter ? { resultCenterId: centerFilter } : {}) },
          include: { resultCenter: true },
          orderBy: { incurredAt: 'asc' },
        }),
        tx.resultCenter.findMany({ where: { clinicId, ...(centerIds.length ? { id: { in: centerIds } } : {}) }, orderBy: { code: 'asc' } }),
      ]);
      const zero = new Prisma.Decimal(0);
      const sum = (values: Array<Prisma.Decimal | null | undefined>): Prisma.Decimal => {
        let total = zero;
        for (const value of values) total = total.plus(value || zero) as Prisma.Decimal;
        return total;
      };
      const billed = sum(invoices.map((invoice: any) => invoice.totalAmount));
      const discounts = sum(invoices.flatMap((invoice: any) => invoice.discounts.map((discount: any) => discount.amount)));
      const received = sum(invoices.flatMap((invoice: any) => invoice.payments.filter((payment: any) => payment.status === 'POSTED').map((payment: any) => payment.amount)));
      const reversed = sum(invoices.flatMap((invoice: any) => invoice.payments.filter((payment: any) => payment.status === 'REVERSED').map((payment: any) => payment.amount)));
      const expensesTotal = sum(expenses.map((expense: any) => expense.amount));
      const pending = sum(invoices.filter((invoice: any) => invoice.status === 'PENDING').map((invoice: any) => invoice.totalAmount));
      const unclassifiedExpenses = expenses.filter((expense: any) => !expense.resultCenterId).length;
      const missingFiscalDocuments = invoices.filter((invoice: any) => !invoice.nfeId).length;
      const report = {
        generatedAt: new Date().toISOString(),
        period: { from: input.from, to: input.to },
        clinicId,
        resultCenters: centers.map((center: any) => ({ id: center.id, code: center.code, name: center.name })),
        totals: {
          billed: billed.toFixed(2), received: received.toFixed(2), reversed: reversed.toFixed(2),
          pending: pending.toFixed(2), discounts: discounts.toFixed(2), expenses: expensesTotal.toFixed(2),
        },
        counts: { invoices: invoices.length, payments: invoices.flatMap((invoice: any) => invoice.payments).length, expenses: expenses.length },
        pendencies: { unclassifiedExpenses, missingFiscalDocuments },
        invoices: invoices.map((invoice: any) => ({
          id: invoice.id, createdAt: invoice.createdAt, status: invoice.status, totalAmount: invoice.totalAmount.toFixed(2),
          discount: sum(invoice.discounts.map((discount: any) => discount.amount)).toFixed(2),
          received: sum(invoice.payments.filter((payment: any) => payment.status === 'POSTED').map((payment: any) => payment.amount)).toFixed(2),
          fiscalDocument: invoice.nfeId ? { id: invoice.nfeId, status: 'REGISTERED' } : null,
        })),
        expenses: expenses.map((expense: any) => ({ id: expense.id, incurredAt: expense.incurredAt, description: expense.description, amount: expense.amount.toFixed(2), reason: expense.reason, resultCenter: expense.resultCenter ? { code: expense.resultCenter.code, name: expense.resultCenter.name } : null })),
      };
      await tx.financialAuditEvent.create({ data: { clinicId, eventType: 'ACCOUNTING_EXPORT_GENERATED', actorUserId, metadata: { from: input.from, to: input.to, resultCenterIds: centerIds, invoiceCount: invoices.length, expenseCount: expenses.length } } });
      return report;
    });
  }

  static async createExpense(input: { description: string; amount: number; resultCenterId?: number; reason?: string }) {
    const reason = input.reason?.trim();
    if (!input.description?.trim() || !Number.isFinite(input.amount) || input.amount <= 0 || !reason) throw new Error('Descrição, valor positivo e justificativa são obrigatórios');
    const clinicId = getCurrentClinicId();
    const actorUserId = getCurrentUserId();
    if (!clinicId || !actorUserId) throw new Error('Autoria autenticada obrigatória');
    if (input.resultCenterId !== undefined) {
      const center = await (prisma.resultCenter as any).findFirst({ where: { id: input.resultCenterId, active: true } });
      if (!center) throw new Error('Centro de resultado não encontrado');
    }
    return prisma.$transaction(async (tx: any) => {
      const expense = await tx.expense.create({ data: { description: input.description.trim(), amount: new Prisma.Decimal(input.amount), resultCenterId: input.resultCenterId ?? null, reason, createdById: actorUserId } });
      await tx.financialAuditEvent.create({ data: { clinicId, eventType: 'EXPENSE_CREATED', expenseId: expense.id, actorUserId, metadata: { amount: expense.amount.toString(), resultCenterId: expense.resultCenterId } } });
      return expense;
    });
  }

  static async receive(invoiceId: number, amount: number, method: string, idempotencyKey: string) {
    if (!Number.isFinite(amount) || amount <= 0 || !method?.trim() || !idempotencyKey?.trim()) throw new Error('Valor, método e chave de idempotência são obrigatórios');
    const actorUserId = getCurrentUserId();
    if (!actorUserId) throw new Error('Autoria autenticada obrigatória');
    return prisma.$transaction(async (tx: any) => {
      await tx.$queryRaw`SELECT "id" FROM "Invoice" WHERE "id" = ${invoiceId} FOR UPDATE`;
      const invoice = await tx.invoice.findFirst({ where: { id: invoiceId }, include: { items: true, discounts: true, payments: true } });
      if (!invoice) throw new Error('Fatura não encontrada');
      if (invoice.status === 'CANCELLED') throw new Error('Fatura cancelada não recebe pagamento');
      const paymentAmount = new Prisma.Decimal(amount);
      const duplicate = await tx.payment.findFirst({ where: { idempotencyKey: idempotencyKey.trim() } });
      if (duplicate) {
        const sameOperation = duplicate.invoiceId === invoiceId && duplicate.method === method.trim() && duplicate.amount.equals(paymentAmount);
        if (!sameOperation) throw new Error('Chave de idempotência já usada em outra operação');
        return duplicate;
      }
      const received = invoice.payments.filter((payment: any) => payment.status === 'POSTED').reduce((sum: Prisma.Decimal, payment: any) => sum.plus(payment.amount), new Prisma.Decimal(0));
      if (received.plus(paymentAmount).greaterThan(invoice.totalAmount)) throw new Error('Recebimento maior que o saldo da fatura');
      const payment = await tx.payment.create({ data: { invoiceId, amount: paymentAmount, method: method.trim(), idempotencyKey: idempotencyKey.trim(), clinicId: invoice.clinicId, receivedByUserId: actorUserId } });
      await tx.financialAuditEvent.create({ data: { clinicId: invoice.clinicId, eventType: 'PAYMENT_RECEIVED', paymentId: payment.id, actorUserId, metadata: { amount: payment.amount.toString(), method: payment.method } } });
      const nextTotal = received.plus(paymentAmount);
      await tx.invoice.update({ where: { id: invoiceId }, data: { status: nextTotal.equals(invoice.totalAmount) ? 'PAID' : 'PENDING' } });
      return payment;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  static async reversePayment(paymentId: number, reason: string) {
    if (!reason?.trim()) throw new Error('Justificativa do estorno é obrigatória');
    const actorUserId = getCurrentUserId();
    if (!actorUserId) throw new Error('Autoria autenticada obrigatória');
    return prisma.$transaction(async (tx: any) => {
      const payment = await tx.payment.findFirst({ where: { id: paymentId } });
      if (!payment) throw new Error('Recebimento não encontrado');
      if (payment.status === 'REVERSED') return payment;
      const changed = await tx.payment.updateMany({
        where: { id: paymentId, status: 'POSTED' },
        data: { status: 'REVERSED', reversedAt: new Date(), reversalReason: reason.trim() },
      });
      if (changed.count !== 1) {
        const current = await tx.payment.findFirst({ where: { id: paymentId } });
        if (current?.status === 'REVERSED') return current;
        throw new Error('Recebimento não está disponível para estorno');
      }
      const reversed = await tx.payment.findFirst({ where: { id: paymentId } });
      await tx.financialAuditEvent.create({ data: { clinicId: payment.clinicId, eventType: 'PAYMENT_REVERSED', paymentId, actorUserId, metadata: { reason: reason.trim() } } });
      const invoice = await tx.invoice.findFirst({ where: { id: payment.invoiceId }, include: { payments: true } });
      const postedTotal = (invoice?.payments || []).filter((item: any) => item.status === 'POSTED').reduce((sum: Prisma.Decimal, item: any) => sum.plus(item.amount), new Prisma.Decimal(0));
      await tx.invoice.update({ where: { id: payment.invoiceId }, data: { status: invoice && postedTotal.equals(invoice.totalAmount) ? 'PAID' : 'PENDING' } });
      return reversed;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }
}
