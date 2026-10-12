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
    });
  }

  static async reversePayment(paymentId: number, reason: string) {
    if (!reason?.trim()) throw new Error('Justificativa do estorno é obrigatória');
    const actorUserId = getCurrentUserId();
    if (!actorUserId) throw new Error('Autoria autenticada obrigatória');
    return prisma.$transaction(async (tx: any) => {
      const payment = await tx.payment.findFirst({ where: { id: paymentId } });
      if (!payment) throw new Error('Recebimento não encontrado');
      if (payment.status === 'REVERSED') return payment;
      const reversed = await tx.payment.update({ where: { id: paymentId }, data: { status: 'REVERSED', reversedAt: new Date(), reversalReason: reason.trim() } });
      await tx.financialAuditEvent.create({ data: { clinicId: payment.clinicId, eventType: 'PAYMENT_REVERSED', paymentId, actorUserId, metadata: { reason: reason.trim() } } });
      const invoice = await tx.invoice.findFirst({ where: { id: payment.invoiceId }, include: { payments: true } });
      const postedTotal = (invoice?.payments || []).filter((item: any) => item.status === 'POSTED').reduce((sum: Prisma.Decimal, item: any) => sum.plus(item.amount), new Prisma.Decimal(0));
      await tx.invoice.update({ where: { id: payment.invoiceId }, data: { status: invoice && postedTotal.equals(invoice.totalAmount) ? 'PAID' : 'PENDING' } });
      return reversed;
    });
  }
}
