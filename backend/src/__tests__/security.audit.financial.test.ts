import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { runWithClinic } from '../tenantContext';
import { InvoiceService } from '../services/invoice.service';

const db = prisma as any;
const D = (v: number) => new Prisma.Decimal(v);
const service = new InvoiceService();

const invoice = (overrides: Record<string, unknown> = {}) => ({
  id: 1, clinicId: 1, status: 'PENDING', totalAmount: D(100),
  items: [{ totalPrice: D(100) }], discounts: [], payments: [], ...overrides,
});

describe('Auditoria: desconto respeita o valor já recebido', () => {
  beforeEach(() => {
    db.invoiceDiscount = { create: jest.fn().mockResolvedValue({ id: 9 }) };
    db.invoice.update.mockImplementation(async ({ data }: any) => ({ id: 1, ...data }));
    db.$queryRaw.mockClear();
  });

  it('recusa desconto que deixa o total abaixo do recebido (100, recebido 80, desconto 50)', async () => {
    db.invoice.findUnique.mockResolvedValueOnce(invoice({ payments: [{ status: 'POSTED', amount: D(80) }] }));
    await expect(runWithClinic(1, () => service.applyDiscount(1, 50, 'teste', 7))).rejects.toThrow('abaixo do valor já recebido');
    expect(db.invoiceDiscount.create).not.toHaveBeenCalled();
    expect(db.$queryRaw).toHaveBeenCalled();
  });

  it('desconto que iguala o recebido quita a fatura', async () => {
    db.invoice.findUnique.mockResolvedValueOnce(invoice({ payments: [{ status: 'POSTED', amount: D(80) }] }));
    const result: any = await runWithClinic(1, () => service.applyDiscount(1, 20, 'teste', 7));
    expect(result.status).toBe('PAID');
    expect(result.totalAmount.equals(D(80))).toBe(true);
  });

  it('desconto sem recebimento mantém pendente', async () => {
    db.invoice.findUnique.mockResolvedValueOnce(invoice());
    const result: any = await runWithClinic(1, () => service.applyDiscount(1, 30, 'teste', 7));
    expect(result.status).toBe('PENDING');
  });
});

describe('Auditoria: status da fatura segue os recebimentos', () => {
  beforeEach(() => {
    db.invoice.update.mockImplementation(async ({ data }: any) => ({ id: 1, ...data }));
  });

  it('não reabre como pendente uma fatura quitada', async () => {
    db.invoice.findUnique.mockResolvedValueOnce(invoice({ status: 'PAID', payments: [{ status: 'POSTED', amount: D(100) }] }));
    await expect(runWithClinic(1, () => service.updateStatus(1, 'PENDING'))).rejects.toThrow('não pode voltar a pendente');
  });

  it('não cancela com recebimento e confere sob trava', async () => {
    db.$queryRaw.mockClear();
    db.invoice.findUnique.mockResolvedValueOnce(invoice({ payments: [{ status: 'POSTED', amount: D(10) }] }));
    await expect(runWithClinic(1, () => service.updateStatus(1, 'CANCELLED'))).rejects.toThrow('não pode ser cancelada');
    expect(db.$queryRaw).toHaveBeenCalled();
  });

  it('cancela fatura sem recebimento', async () => {
    db.invoice.findUnique.mockResolvedValueOnce(invoice());
    const result: any = await runWithClinic(1, () => service.updateStatus(1, 'CANCELLED'));
    expect(result.status).toBe('CANCELLED');
  });
});
