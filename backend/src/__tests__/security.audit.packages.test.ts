import { prisma } from '../lib/prisma';
import { runWithClinic, runWithUser } from '../tenantContext';
import { PackageService } from '../services/package.service';
import { SaleService } from '../services/sale.service';
import { InvoiceService } from '../services/invoice.service';

const db = prisma as any;
const originals: Record<string, unknown> = {};
const asUser = <T>(fn: () => Promise<T>) => runWithClinic(1, () => runWithUser(7, fn));

beforeAll(() => { for (const model of ['stockMovement', 'sale', 'cashSession', 'servicePackage', 'packageContract', 'packageSession', 'tutor', 'pet']) originals[model] = db[model]; });
afterAll(() => { for (const [model, value] of Object.entries(originals)) db[model] = value; });

describe('Auditoria: compra de pacote entra no caixa', () => {
  beforeEach(() => {
    db.servicePackage = { findFirst: jest.fn().mockResolvedValue({ id: 3, name: 'Banho x4', price: 200, totalSessions: 4, validityDays: 90 }) };
    db.tutor = { ...(originals.tutor as object), findFirst: jest.fn().mockResolvedValue({ id: 8 }) };
    db.pet = { ...(originals.pet as object), findFirst: jest.fn().mockResolvedValue({ id: 9, tutorId: 8 }) };
    db.cashSession = { findFirst: jest.fn().mockResolvedValue({ id: 4 }) };
    db.sale = { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 55, number: 12 }) };
    db.packageContract = { findFirst: jest.fn(), create: jest.fn().mockResolvedValue({ id: 70, saleId: 55 }) };
  });

  const buy = (payments: any[], key = 'k1') => asUser(() => PackageService.purchase(3, 8, 9, payments, key));

  it('cria a venda com o valor do pacote e liga o contrato a ela', async () => {
    await expect(buy([{ method: 'PIX', amount: 200 }])).resolves.toMatchObject({ id: 70 });
    const sale = db.sale.create.mock.calls[0][0].data;
    expect(String(sale.total)).toBe('200.00');
    expect(sale.cashSessionId).toBe(4);
    expect(sale.idempotencyKey).toBe('package:k1');
    expect(sale.items.create[0]).toMatchObject({ productId: null, description: 'Pacote: Banho x4' });
    expect(db.packageContract.create.mock.calls[0][0].data).toMatchObject({ saleId: 55, remainingSessions: 4 });
  });

  it('recusa pagamento menor que o pacote, caixa fechado e chave ausente', async () => {
    await expect(buy([{ method: 'PIX', amount: 50 }])).rejects.toThrow('Pagamento insuficiente');
    await expect(buy([])).rejects.toThrow('Informe a forma de pagamento');
    db.cashSession.findFirst.mockResolvedValue(null);
    await expect(buy([{ method: 'PIX', amount: 200 }])).rejects.toThrow('Abra o caixa');
    await expect(buy([{ method: 'PIX', amount: 200 }], '')).rejects.toThrow('idempotência');
    expect(db.packageContract.create).not.toHaveBeenCalled();
  });

  it('repetir a mesma chave devolve o mesmo contrato sem nova venda', async () => {
    db.sale.findFirst.mockResolvedValueOnce({ id: 55 });
    db.packageContract.findFirst.mockResolvedValueOnce({ id: 70, saleId: 55 });
    await expect(buy([{ method: 'PIX', amount: 200 }])).resolves.toMatchObject({ id: 70 });
    expect(db.sale.create).not.toHaveBeenCalled();
  });
});

describe('Auditoria: cancelar a venda do pacote', () => {
  beforeEach(() => {
    db.sale = {
      findFirst: jest.fn().mockResolvedValue({ id: 55, number: 12, status: 'COMPLETED', items: [], cashSession: { status: 'OPEN' } }),
      update: jest.fn().mockResolvedValue({ id: 55, status: 'CANCELLED' }),
    };
    db.packageContract = { findFirst: jest.fn().mockResolvedValue({ id: 70, totalSessions: 4, status: 'ACTIVE' }), updateMany: jest.fn().mockResolvedValue({ count: 1 }) };
    db.packageSession = { ...(originals.packageSession as object), count: jest.fn().mockResolvedValue(0) };
    db.stockMovement = { ...(db.stockMovement || {}), findMany: jest.fn().mockResolvedValue([]) };
  });

  it('encerra o contrato sem uso, com condição de saldo cheio', async () => {
    await expect(asUser(() => SaleService.cancel(55, 'desistiu'))).resolves.toMatchObject({ status: 'CANCELLED' });
    expect(db.packageContract.updateMany).toHaveBeenCalledWith({ where: { id: 70, status: 'ACTIVE', remainingSessions: 4 }, data: { status: 'CANCELLED', remainingSessions: 0 } });
  });

  it('recusa quando há sessão usada ou consumo concorrente', async () => {
    db.packageSession.count.mockResolvedValueOnce(1);
    await expect(asUser(() => SaleService.cancel(55, 'desistiu'))).rejects.toThrow('sessões usadas');
    db.packageContract.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(asUser(() => SaleService.cancel(55, 'desistiu'))).rejects.toThrow('Pacote em uso');
    expect(db.sale.update).not.toHaveBeenCalled();
  });
});

describe('Auditoria: faturamento trava o atendimento', () => {
  it('primeira instrução da transação é a trava da linha do atendimento', async () => {
    db.$queryRaw.mockClear();
    (prisma.appointment.findUnique as jest.Mock).mockResolvedValueOnce(null);
    await expect(runWithClinic(1, () => new InvoiceService().createFromAppointment(31))).rejects.toThrow('Agendamento não encontrado');
    expect(db.$queryRaw.mock.calls[0][0].join('?')).toMatch(/FROM "Appointment" WHERE "id" = \? FOR UPDATE/);
    expect(db.$queryRaw.mock.calls[0][1]).toBe(31);
  });
});

describe('Auditoria: InvoiceDiscount no proxy de tenant', () => {
  it('desconto não grava clinicId vindo do código; o proxy injeta o da sessão', () => {
    const source = require('fs').readFileSync(require('path').join(__dirname, '../services/invoice.service.ts'), 'utf8');
    expect(source).toMatch(/invoiceDiscount\.create\(\{ data: \{ invoiceId, amount/);
    const proxySource = require('fs').readFileSync(require('path').join(__dirname, '../lib/prisma.ts'), 'utf8');
    expect(proxySource).toMatch(/'invoiceDiscount',/);
  });
});
