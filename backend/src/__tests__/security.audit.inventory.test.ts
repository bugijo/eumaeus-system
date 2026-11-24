import { prisma } from '../lib/prisma';
import { runWithClinic } from '../tenantContext';
import { InventoryService, receiveWithin } from '../services/inventory.service';
import { parseNfe } from '../nfe/parseNfe';
import { buildNfeXml } from './fixtures/nfeFixture';

const db = prisma as any;

const makeTx = (existingLot: any) => ({
  stockMovement: { findFirst: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ id: 1 }) },
  product: { findFirst: jest.fn().mockResolvedValue({ id: 2 }), update: jest.fn().mockResolvedValue({}) },
  productLot: {
    findFirst: jest.fn().mockResolvedValue(existingLot),
    update: jest.fn().mockImplementation(async ({ data }: any) => ({ id: existingLot?.id, ...data })),
    create: jest.fn().mockResolvedValue({ id: 9 }),
  },
});

const input = (expiresAt?: string) => ({ productId: 2, lotCode: 'L1', quantity: 5, expiresAt, reason: 'entrada', idempotencyKey: `k-${Math.random()}` });

describe('Auditoria: entrada não sobrescreve a validade do lote', () => {
  it('recusa a mesma etiqueta de lote com outra validade', async () => {
    const tx = makeTx({ id: 4, lotCode: 'L1', expiresAt: new Date('2025-01-01T00:00:00.000Z') });
    await expect(receiveWithin(tx, input('2030-01-01T00:00:00.000Z'))).rejects.toThrow('outra validade');
    expect(tx.productLot.update).not.toHaveBeenCalled();
  });

  it('soma ao lote com a mesma validade e mantém a data', async () => {
    const expiry = new Date('2027-01-01T00:00:00.000Z');
    const tx = makeTx({ id: 4, lotCode: 'L1', expiresAt: expiry });
    await receiveWithin(tx, input('2027-01-01T00:00:00.000Z'));
    expect(tx.productLot.update.mock.calls[0][0].data.expiresAt).toBe(expiry);
  });

  it('completa a validade de lote que não tinha data', async () => {
    const tx = makeTx({ id: 4, lotCode: 'L1', expiresAt: null });
    await receiveWithin(tx, input('2027-01-01T00:00:00.000Z'));
    expect(tx.productLot.update.mock.calls[0][0].data.expiresAt.toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });
});

describe('Auditoria: devolução usa lote do mesmo produto', () => {
  it('não empresta o código de lote de outro produto', async () => {
    db.productLot.findFirst = jest.fn().mockResolvedValue(null);
    await expect(runWithClinic(1, () => InventoryService.change({ productId: 2, lotId: 77, quantity: 1, type: 'RETURN', reason: 'devolução', idempotencyKey: 'r-1' })))
      .rejects.toThrow('Lote não encontrado para este produto');
    expect(db.productLot.findFirst.mock.calls[0][0].where).toEqual({ id: 77, productId: 2 });
  });
});

describe('Auditoria: NF-e com desconto maior que o item', () => {
  it('recusa custo líquido negativo', () => {
    const xml = buildNfeXml({ items: [{ code: 'A1', name: 'Ração', qty: '1', total: '10.00', discount: '15.00' }] });
    expect(() => parseNfe(xml)).toThrow('Desconto maior que o valor do item 1');
  });
});
