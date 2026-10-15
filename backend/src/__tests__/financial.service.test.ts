import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getCurrentUserId, runWithClinic, runWithUser } from '../tenantContext';
import { FinancialService } from '../services/financial.service';

describe('financial expense authorship and audit', () => {
  const db = prisma as any;

  beforeEach(() => {
    db.resultCenter.findFirst.mockResolvedValue({ id: 1, clinicId: 4, active: true });
    db.expense.create.mockResolvedValue({ id: 9, amount: '10.00', resultCenterId: 1 });
    db.financialAuditEvent.create.mockResolvedValue({ id: 3 });
  });

  it('derives the actor from authenticated context and writes the audit event in the same transaction', async () => {
    await runWithClinic(4, () => runWithUser(12, () => FinancialService.createExpense({ description: 'Insumo', amount: 10, resultCenterId: 1, reason: 'Teste' })));

    expect(getCurrentUserId()).toBeUndefined();
    expect(db.expense.create).toHaveBeenCalledWith({ data: expect.objectContaining({ createdById: 12, reason: 'Teste' }) });
    expect(db.financialAuditEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({ actorUserId: 12, clinicId: 4, expenseId: 9, eventType: 'EXPENSE_CREATED' }) });
    expect(db.expense.create).toHaveBeenCalledTimes(1);
  });

  it('requires authenticated authorship and never accepts an actor from the input', async () => {
    await expect(runWithClinic(4, () => FinancialService.createExpense({ description: 'Insumo', amount: 10, reason: 'Teste' }))).rejects.toThrow('Autoria autenticada');
    expect(db.expense.create).not.toHaveBeenCalled();
  });

  it('rolls back the expense when audit creation fails', async () => {
    db.financialAuditEvent.create.mockRejectedValueOnce(new Error('audit unavailable'));
    await expect(runWithClinic(4, () => runWithUser(12, () => FinancialService.createExpense({ description: 'Insumo', amount: 10, reason: 'Teste' })))).rejects.toThrow('audit unavailable');
    expect(db.expense.create).toHaveBeenCalledTimes(1);
    expect(db.financialAuditEvent.create).toHaveBeenCalledTimes(1);
  });

  it('derives payment authorship and audit from the authenticated context', async () => {
    db.invoice.findFirst.mockResolvedValue({ id: 4, clinicId: 4, status: 'PENDING', totalAmount: new Prisma.Decimal('5.00'), items: [], discounts: [], payments: [] });
    db.payment.create.mockResolvedValue({ id: 11, amount: new Prisma.Decimal('5.00'), method: 'PIX' });
    db.payment.findFirst.mockResolvedValue(null);
    db.financialAuditEvent.create.mockResolvedValue({ id: 4 });
    await runWithClinic(4, () => runWithUser(12, () => FinancialService.receive(4, 5, 'PIX', 'payment-test-1')));
    expect(db.payment.create).toHaveBeenCalledWith({ data: expect.objectContaining({ receivedByUserId: 12, clinicId: 4 }) });
    expect(db.financialAuditEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({ eventType: 'PAYMENT_RECEIVED', paymentId: 11, actorUserId: 12, clinicId: 4 }) });
  });

  it('rejects payment creation without authenticated authorship', async () => {
    await expect(runWithClinic(4, () => FinancialService.receive(4, 5, 'PIX', 'payment-test-2'))).rejects.toThrow('Autoria autenticada');
  });

  it('rejects reusing an idempotency key for another invoice or amount', async () => {
    db.invoice.findFirst.mockResolvedValue({ id: 5, clinicId: 4, status: 'PENDING', totalAmount: new Prisma.Decimal('10.00'), items: [], discounts: [], payments: [] });
    db.payment.findFirst.mockResolvedValue({ id: 20, invoiceId: 4, amount: new Prisma.Decimal('5.00'), method: 'PIX' });
    await expect(runWithClinic(4, () => runWithUser(12, () => FinancialService.receive(5, 6, 'PIX', 'payment-reused-key')))).rejects.toThrow('Chave de idempotência já usada');
    expect(db.payment.create).not.toHaveBeenCalled();
  });

  it('rolls back a payment when PAYMENT_RECEIVED audit creation fails', async () => {
    db.invoice.findFirst.mockResolvedValue({ id: 4, clinicId: 4, status: 'PENDING', totalAmount: new Prisma.Decimal('5.00'), items: [], discounts: [], payments: [] });
    db.payment.findFirst.mockResolvedValue(null);
    db.payment.create.mockResolvedValue({ id: 12, amount: new Prisma.Decimal('5.00'), method: 'PIX' });
    db.financialAuditEvent.create.mockRejectedValueOnce(new Error('payment audit unavailable'));
    await expect(runWithClinic(4, () => runWithUser(12, () => FinancialService.receive(4, 5, 'PIX', 'payment-test-rollback')))).rejects.toThrow('payment audit unavailable');
    expect(db.payment.create).toHaveBeenCalledWith({ data: expect.objectContaining({ receivedByUserId: 12 }) });
    expect(db.invoice.update).not.toHaveBeenCalled();
  });

  it('keeps an invoice paid when reversing one of several posted payments', async () => {
    db.payment.findFirst.mockResolvedValue({ id: 13, invoiceId: 4, clinicId: 4, status: 'POSTED' });
    db.payment.updateMany.mockResolvedValue({ count: 1 });
    db.invoice.findFirst.mockResolvedValue({ id: 4, totalAmount: new Prisma.Decimal('10.00'), payments: [{ status: 'POSTED', amount: new Prisma.Decimal('10.00') }] });
    db.financialAuditEvent.create.mockResolvedValue({ id: 5 });
    await runWithClinic(4, () => runWithUser(12, () => FinancialService.reversePayment(13, 'Correção sintética')));
    expect(db.invoice.update).toHaveBeenCalledWith({ where: { id: 4 }, data: { status: 'PAID' } });
  });

  it('prepares a clinic-isolated accounting export with explicit fiscal and classification pendencies', async () => {
    db.invoice.findMany.mockResolvedValue([{ id: 7, clinicId: 4, createdAt: new Date('2026-10-01T03:00:00Z'), status: 'PENDING', totalAmount: new Prisma.Decimal('20.00'), nfeId: null, payments: [{ status: 'POSTED', amount: new Prisma.Decimal('5.00') }], discounts: [{ amount: new Prisma.Decimal('1.00') }], items: [], resultCenter: null }]);
    db.expense.findMany.mockResolvedValue([{ id: 8, clinicId: 4, incurredAt: new Date('2026-10-02T03:00:00Z'), description: 'Insumo', amount: new Prisma.Decimal('3.50'), reason: 'Teste', resultCenterId: null, resultCenter: null }]);
    db.resultCenter.findMany.mockResolvedValue([{ id: 1, clinicId: 4, code: 'CLINICA', name: 'Clínica', active: true }]);
    const report = await runWithClinic(4, () => runWithUser(12, () => FinancialService.prepareAccountingExport({ from: '2026-10-01', to: '2026-10-31' })));
    expect(report.clinicId).toBe(4);
    // The partial receipt is effective before the cutoff, so the historical
    // balance is the invoice total less that receipt.
    expect(report.totals).toMatchObject({ billed: '20.00', received: '5.00', pending: '15.00', discounts: '1.00', expenses: '3.50' });
    expect(report.pendencies).toEqual({ unclassifiedExpenses: 1, missingFiscalDocuments: 1 });
    expect(db.financialAuditEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({ eventType: 'ACCOUNTING_EXPORT_GENERATED', actorUserId: 12, clinicId: 4 }) });
  });

  it('assigns receipts and reversals to their event dates and reports the historical balance at period end', async () => {
    db.invoice.findMany.mockResolvedValue([{
      id: 8,
      clinicId: 4,
      createdAt: new Date('2026-09-30T12:00:00.000Z'),
      status: 'PAID',
      totalAmount: new Prisma.Decimal('100.00'),
      nfeId: 'nfe-8',
      payments: [
        { status: 'POSTED', amount: new Prisma.Decimal('40.00'), receivedAt: new Date('2026-10-01T03:00:00.000Z'), reversedAt: null },
        { status: 'POSTED', amount: new Prisma.Decimal('20.00'), receivedAt: new Date('2026-11-01T03:00:00.000Z'), reversedAt: null },
        { status: 'REVERSED', amount: new Prisma.Decimal('10.00'), receivedAt: new Date('2026-09-20T03:00:00.000Z'), reversedAt: new Date('2026-10-15T03:00:00.000Z') },
        { status: 'REVERSED', amount: new Prisma.Decimal('15.00'), receivedAt: new Date('2026-10-20T03:00:00.000Z'), reversedAt: new Date('2026-11-05T03:00:00.000Z') },
      ],
      discounts: [],
      items: [],
      resultCenterId: null,
      resultCenter: null,
    }]);
    db.expense.findMany.mockResolvedValue([]);
    db.resultCenter.findMany.mockResolvedValue([]);

    const report = await runWithClinic(4, () => runWithUser(12, () => FinancialService.prepareAccountingExport({ from: '2026-10-01', to: '2026-10-31' })));

    expect(report.totals).toMatchObject({ billed: '0.00', received: '55.00', reversed: '10.00', pending: '45.00' });
    expect(report.invoices).toEqual([]);
    expect(db.invoice.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ createdAt: { lte: new Date('2026-11-01T02:59:59.999Z') } }) }));
  });

  it('applies result-center selection to the historical pending balance', async () => {
    db.invoice.findMany.mockResolvedValue([
      { id: 21, clinicId: 4, createdAt: new Date('2026-10-02T03:00:00Z'), status: 'PENDING', totalAmount: new Prisma.Decimal('10.00'), nfeId: 'nfe-21', payments: [], discounts: [], items: [], resultCenterId: 1, resultCenter: { id: 1, code: 'A', name: 'Centro A' } },
      { id: 22, clinicId: 4, createdAt: new Date('2026-10-02T03:00:00Z'), status: 'PENDING', totalAmount: new Prisma.Decimal('20.00'), nfeId: 'nfe-22', payments: [], discounts: [], items: [], resultCenterId: 2, resultCenter: { id: 2, code: 'B', name: 'Centro B' } },
    ]);
    db.expense.findMany.mockResolvedValue([]);
    db.resultCenter.findMany.mockResolvedValue([{ id: 1, clinicId: 4, code: 'A', name: 'Centro A', active: true }]);
    const report = await runWithClinic(4, () => runWithUser(12, () => FinancialService.prepareAccountingExport({ from: '2026-10-01', to: '2026-10-31', resultCenterIds: [1] })));
    expect(report.totals).toMatchObject({ billed: '10.00', pending: '10.00' });
    expect(report.invoices.map((invoice: any) => invoice.id)).toEqual([21]);
  });
});
