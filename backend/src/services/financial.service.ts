import { withSerializableRetry } from '../lib/serializableRetry';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getCurrentClinicId, getCurrentUserId } from '../tenantContext';

const ACCOUNTING_UTC_OFFSET = '-03:00';

const accountingBoundary = (date: string, endOfDay: boolean) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return new Date(Number.NaN);
  return new Date(`${date}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}${ACCOUNTING_UTC_OFFSET}`);
};

const asDate = (value: unknown, fallback?: unknown) => {
  const date = value ? new Date(value as string | number | Date) : fallback ? new Date(fallback as string | number | Date) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

export type AllocationShare = { resultCenterId: number; percent: number };

/** Divide um valor (em centavos) por percentuais; a sobra de arredondamento vai para a maior fatia. */
export function splitAllocation(totalCents: number, shares: AllocationShare[]) {
  if (!Number.isInteger(totalCents) || totalCents <= 0) throw new Error('Valor do rateio deve ser positivo');
  if (!Array.isArray(shares) || shares.length < 2) throw new Error('O rateio precisa de pelo menos dois centros');
  const ids = new Set<number>();
  let percentSum = 0;
  for (const share of shares) {
    if (!Number.isInteger(share.resultCenterId)) throw new Error('Centro de resultado inválido no rateio');
    if (ids.has(share.resultCenterId)) throw new Error('Centro repetido no rateio');
    ids.add(share.resultCenterId);
    if (!Number.isFinite(share.percent) || share.percent <= 0 || share.percent > 100) throw new Error('Percentual deve estar entre 0 e 100');
    percentSum += Math.round(share.percent * 100);
  }
  if (percentSum !== 10000) throw new Error(`A soma dos percentuais deve ser 100% (atual: ${(percentSum / 100).toFixed(2)}%)`);
  const parts = shares.map((share) => ({ ...share, cents: Math.floor((totalCents * Math.round(share.percent * 100)) / 10000) }));
  const remainder = totalCents - parts.reduce((sum, part) => sum + part.cents, 0);
  const largest = parts.reduce((best, part, index) => (part.percent > parts[best].percent ? index : best), 0);
  parts[largest].cents += remainder;
  return parts;
}

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
    const from = accountingBoundary(input.from, false);
    const to = accountingBoundary(input.to, true);
    if (!input.from || !input.to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
      throw new Error('Período inválido');
    }
    const centerIds = (input.resultCenterIds || []).filter(Number.isInteger);
    const centerFilter = centerIds.length ? { in: centerIds } : undefined;
    return prisma.$transaction(async (tx: any) => {
      const [invoices, expenses, centers, salesRows] = await Promise.all([
        tx.invoice.findMany({
          where: { clinicId, createdAt: { lte: to }, ...(centerFilter ? { resultCenterId: centerFilter } : {}) },
          include: { payments: true, discounts: true, items: true, resultCenter: true },
          orderBy: { createdAt: 'asc' },
        }),
        tx.expense.findMany({
          where: { clinicId, incurredAt: { gte: from, lte: to }, ...(centerFilter ? { resultCenterId: centerFilter } : {}) },
          include: { resultCenter: true },
          orderBy: { incurredAt: 'asc' },
        }),
        tx.resultCenter.findMany({ where: { clinicId, ...(centerIds.length ? { id: { in: centerIds } } : {}) }, orderBy: { code: 'asc' } }),
        tx.sale ? tx.sale.findMany({
          where: { clinicId, createdAt: { gte: from, lte: to }, ...(centerFilter ? { resultCenterId: centerFilter } : {}) },
          include: { payments: true, resultCenter: true },
          orderBy: { createdAt: 'asc' },
        }) : Promise.resolve([]),
      ]);
      const sales = (salesRows || []) as any[];
      const completedSales = sales.filter((sale: any) => sale.status === 'COMPLETED');
      const accountingInvoices = centerFilter
        ? invoices.filter((invoice: any) => centerIds.includes(invoice.resultCenterId))
        : invoices;
      const zero = new Prisma.Decimal(0);
      const sum = (values: Array<Prisma.Decimal | null | undefined>): Prisma.Decimal => {
        let total = zero;
        for (const value of values) total = total.plus(value || zero) as Prisma.Decimal;
        return total;
      };
      const isBetween = (value: unknown, start: Date, end: Date) => {
        const date = asDate(value);
        return Boolean(date && date >= start && date <= end);
      };
      const isBeforeOrAt = (value: unknown, end: Date) => {
        const date = asDate(value);
        return Boolean(date && date <= end);
      };
      const billedInvoices = accountingInvoices.filter((invoice: any) => isBetween(invoice.createdAt, from, to));
      const historicalTotalAtEnd = (invoice: any) => {
        const discountsAfterCutoff = sum(invoice.discounts
          .filter((discount: any) => asDate(discount.createdAt) && !isBeforeOrAt(discount.createdAt, to))
          .map((discount: any) => discount.amount));
        return new Prisma.Decimal(invoice.totalAmount).plus(discountsAfterCutoff);
      };
      const billed = sum(billedInvoices.map(historicalTotalAtEnd));
      const discounts = sum(billedInvoices.flatMap((invoice: any) => invoice.discounts.map((discount: any) => discount.amount)));
      const periodPayments = accountingInvoices.flatMap((invoice: any) => invoice.payments.map((payment: any) => ({ invoice, payment })));
      const received = sum(periodPayments
        .filter(({ invoice, payment }: any) => isBetween(payment.receivedAt || invoice.createdAt, from, to))
        .map(({ payment }: any) => payment.amount));
      const reversed = sum(periodPayments
        .filter(({ payment }: any) => payment.status === 'REVERSED' && isBetween(payment.reversedAt, from, to))
        .map(({ payment }: any) => payment.amount));
      const expensesTotal = sum(expenses.map((expense: any) => expense.amount));
      const balanceAtEnd = (invoice: any) => {
        if (invoice.status === 'CANCELLED' && (!invoice.cancelledAt || isBeforeOrAt(invoice.cancelledAt, to))) return new Prisma.Decimal(0);
        const receivedAtEnd = sum(invoice.payments
          .filter((payment: any) => isBeforeOrAt(payment.receivedAt || invoice.createdAt, to) && !isBeforeOrAt(payment.reversedAt, to))
          .map((payment: any) => payment.amount));
        const balance = historicalTotalAtEnd(invoice).plus(new Prisma.Decimal(`-${receivedAtEnd.toString()}`));
        return balance.greaterThan(new Prisma.Decimal(0)) ? balance : new Prisma.Decimal(0);
      };
      const pending = sum(accountingInvoices.map(balanceAtEnd));
      const unclassifiedExpenses = expenses.filter((expense: any) => !expense.resultCenterId).length;
      const missingFiscalDocuments = billedInvoices.filter((invoice: any) => !invoice.nfeId).length;
      const salesTotal = sum(completedSales.map((sale: any) => sale.total));
      const salesByMethod: Record<string, string> = {};
      for (const sale of completedSales) {
        let changeLeft = Number(sale.change || 0);
        for (const payment of sale.payments || []) {
          let amount = Number(payment.amount);
          if (payment.method === 'DINHEIRO' && changeLeft > 0) { const used = Math.min(changeLeft, amount); amount -= used; changeLeft -= used; }
          salesByMethod[payment.method] = (Number(salesByMethod[payment.method] || 0) + amount).toFixed(2);
        }
      }
      const centerKey = (center: any) => (center ? center.code : 'SEM_CLASSIFICACAO');
      const byCenterMap = new Map<string, { code: string; name: string; billed: Prisma.Decimal; sales: Prisma.Decimal; expenses: Prisma.Decimal }>();
      const bucket = (center: any) => {
        const key = centerKey(center);
        if (!byCenterMap.has(key)) byCenterMap.set(key, { code: key, name: center?.name || 'Sem classificação', billed: zero, sales: zero, expenses: zero });
        return byCenterMap.get(key)!;
      };
      for (const center of centers) bucket(center);
      for (const invoice of billedInvoices) { const b = bucket(invoice.resultCenter); b.billed = b.billed.plus(historicalTotalAtEnd(invoice)) as Prisma.Decimal; }
      for (const sale of completedSales) { const b = bucket(sale.resultCenter); b.sales = b.sales.plus(sale.total) as Prisma.Decimal; }
      for (const expense of expenses) { const b = bucket(expense.resultCenter); b.expenses = b.expenses.plus(expense.amount) as Prisma.Decimal; }
      const byCenter = [...byCenterMap.values()].map((row) => ({
        code: row.code, name: row.name, billed: row.billed.toFixed(2), sales: row.sales.toFixed(2), expenses: row.expenses.toFixed(2),
        result: (Number(row.billed.toFixed(2)) + Number(row.sales.toFixed(2)) - Number(row.expenses.toFixed(2))).toFixed(2),
      }));
      let settings: any = null;
      try { settings = tx.clinicSettings?.findFirst ? await tx.clinicSettings.findFirst({ where: { clinicId } }) : null; } catch { settings = null; }
      const report = {
        generatedAt: new Date().toISOString(),
        clinicName: settings?.clinicName || null,
        period: { from: input.from, to: input.to },
        clinicId,
        resultCenters: centers.map((center: any) => ({ id: center.id, code: center.code, name: center.name })),
        totals: {
          billed: billed.toFixed(2), received: received.toFixed(2), reversed: reversed.toFixed(2),
          pending: pending.toFixed(2), discounts: discounts.toFixed(2), expenses: expensesTotal.toFixed(2),
          sales: salesTotal.toFixed(2),
        },
        salesByMethod,
        byCenter,
        counts: { sales: completedSales.length, invoices: billedInvoices.length, payments: periodPayments.filter(({ invoice, payment }: any) => isBetween(payment.receivedAt || invoice.createdAt, from, to) || isBetween(payment.reversedAt, from, to)).length, expenses: expenses.length },
        pendencies: { unclassifiedExpenses, missingFiscalDocuments },
        invoices: billedInvoices.map((invoice: any) => ({
          id: invoice.id, createdAt: invoice.createdAt, status: invoice.status, totalAmount: historicalTotalAtEnd(invoice).toFixed(2),
          discount: sum(invoice.discounts.map((discount: any) => discount.amount)).toFixed(2),
          received: sum(invoice.payments.filter((payment: any) => isBeforeOrAt(payment.receivedAt || invoice.createdAt, to) && !isBeforeOrAt(payment.reversedAt, to)).map((payment: any) => payment.amount)).toFixed(2),
          fiscalDocument: invoice.nfeId ? { id: invoice.nfeId, status: 'REGISTERED' } : null,
        })),
        sales: sales.map((sale: any) => ({ id: sale.id, number: sale.number, createdAt: sale.createdAt, status: sale.status, total: Number(sale.total).toFixed(2), discount: Number(sale.discount).toFixed(2), methods: (sale.payments || []).map((payment: any) => payment.method).join('+'), resultCenter: sale.resultCenter ? { code: sale.resultCenter.code, name: sale.resultCenter.name } : null, fiscalDocument: sale.fiscalDocumentId || null })),
        expenses: expenses.map((expense: any) => ({ id: expense.id, allocationGroup: expense.allocationGroup || null, allocationPercent: expense.allocationPercent ? Number(expense.allocationPercent).toFixed(2) : null, incurredAt: expense.incurredAt, description: expense.description, amount: expense.amount.toFixed(2), reason: expense.reason, resultCenter: expense.resultCenter ? { code: expense.resultCenter.code, name: expense.resultCenter.name } : null })),
      };
      await tx.financialAuditEvent.create({ data: { clinicId, eventType: 'ACCOUNTING_EXPORT_GENERATED', actorUserId, metadata: { from: input.from, to: input.to, resultCenterIds: centerIds, invoiceCount: accountingInvoices.length, expenseCount: expenses.length } } });
      return report;
    });
  }

  static listAllocationRules() { return (prisma as any).allocationRule.findMany({ where: { active: true }, orderBy: { name: 'asc' } }); }

  static async saveAllocationRule(input: { name: string; shares: AllocationShare[] }) {
    const name = input.name?.trim();
    if (!name) throw new Error('Nome da regra é obrigatório');
    const shares = (input.shares || []).map((share) => ({ resultCenterId: Number(share.resultCenterId), percent: Number(share.percent) }));
    splitAllocation(10000, shares);
    const centers = await (prisma.resultCenter as any).findMany({ where: { id: { in: shares.map((share) => share.resultCenterId) }, active: true } });
    if (centers.length !== shares.length) throw new Error('Centro de resultado não encontrado');
    const existing = await (prisma as any).allocationRule.findFirst({ where: { name } });
    if (existing) return (prisma as any).allocationRule.update({ where: { id: existing.id }, data: { shares, active: true } });
    return (prisma as any).allocationRule.create({ data: { name, shares } });
  }

  static async deleteAllocationRule(id: number) {
    const rule = await (prisma as any).allocationRule.findFirst({ where: { id } });
    if (!rule) throw new Error('Regra não encontrada');
    return (prisma as any).allocationRule.update({ where: { id }, data: { active: false } });
  }

  /** Lança uma conta compartilhada uma única vez, gerando uma despesa por centro conforme o rateio. */
  static async createAllocatedExpense(input: { description: string; amount: number; reason?: string; incurredAt?: string; ruleId?: number; shares?: AllocationShare[] }) {
    const description = input.description?.trim();
    const reason = input.reason?.trim() || 'Rateio de conta compartilhada';
    if (!description) throw new Error('Descrição é obrigatória');
    const clinicId = getCurrentClinicId();
    const actorUserId = getCurrentUserId();
    if (!clinicId || !actorUserId) throw new Error('Autoria autenticada obrigatória');
    let shares = input.shares;
    if (input.ruleId !== undefined) {
      const rule = await (prisma as any).allocationRule.findFirst({ where: { id: Number(input.ruleId), active: true } });
      if (!rule) throw new Error('Regra de rateio não encontrada');
      shares = rule.shares as AllocationShare[];
    }
    const parts = splitAllocation(Math.round(Number(input.amount) * 100), (shares || []).map((share) => ({ resultCenterId: Number(share.resultCenterId), percent: Number(share.percent) })));
    const centers = await (prisma.resultCenter as any).findMany({ where: { id: { in: parts.map((part) => part.resultCenterId) }, active: true } });
    if (centers.length !== parts.length) throw new Error('Centro de resultado não encontrado');
    const incurredAt = input.incurredAt ? new Date(`${input.incurredAt}T12:00:00.000-03:00`) : new Date();
    if (Number.isNaN(incurredAt.getTime())) throw new Error('Data inválida');
    const group = `rateio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const total = new Prisma.Decimal(Number(input.amount).toFixed(2));
    return prisma.$transaction(async (tx: any) => {
      const created = [];
      for (const part of parts) {
        const expense = await tx.expense.create({ data: { description: `${description} (${part.percent}%)`, amount: new Prisma.Decimal((part.cents / 100).toFixed(2)), resultCenterId: part.resultCenterId, reason, incurredAt, createdById: actorUserId, allocationGroup: group, allocationPercent: new Prisma.Decimal(part.percent.toFixed(2)), allocationTotal: total } });
        await tx.financialAuditEvent.create({ data: { clinicId, eventType: 'EXPENSE_CREATED', expenseId: expense.id, actorUserId, metadata: { amount: expense.amount.toString(), resultCenterId: part.resultCenterId, allocationGroup: group } } });
        created.push(expense);
      }
      return { allocationGroup: group, total: total.toString(), expenses: created };
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
    return withSerializableRetry(() => prisma.$transaction(async (tx: any) => {
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
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  }

  static async reversePayment(paymentId: number, reason: string) {
    if (!reason?.trim()) throw new Error('Justificativa do estorno é obrigatória');
    const actorUserId = getCurrentUserId();
    if (!actorUserId) throw new Error('Autoria autenticada obrigatória');
    return withSerializableRetry(() => prisma.$transaction(async (tx: any) => {
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
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }));
  }
}
