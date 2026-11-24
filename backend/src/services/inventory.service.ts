import { prisma } from '../lib/prisma';
import { getCurrentClinicId } from '../tenantContext';

export type ReceiveInput = { productId: number; lotCode: string; quantity: number; expiresAt?: string; reason: string; idempotencyKey: string; authorizedByUserId?: number; type?: 'RECEIPT' | 'RETURN' };

/** Entrada de estoque dentro de uma transação já aberta (usada também pela importação de NF-e). */
export async function receiveWithin(tx: any, input: ReceiveInput) {
  const duplicate = await tx.stockMovement.findFirst({ where: { idempotencyKey: input.idempotencyKey } });
  if (duplicate) return duplicate;
  const product = await tx.product.findFirst({ where: { id: input.productId } });
  if (!product) throw new Error('Produto não encontrado');
  const existingLot = await tx.productLot.findFirst({ where: { productId: input.productId, lotCode: input.lotCode.trim() } });
  const informedExpiry = input.expiresAt ? new Date(input.expiresAt) : null;
  if (informedExpiry && Number.isNaN(informedExpiry.getTime())) throw new Error('Validade inválida');
  // Um lote tem uma validade só. Antes, uma entrada nova sobrescrevia a validade do lote inteiro:
  // unidades vencidas voltavam a parecer válidas e o bloqueio de saída de lote vencido era contornado.
  if (existingLot?.expiresAt && informedExpiry && existingLot.expiresAt.getTime() !== informedExpiry.getTime()) {
    throw new Error(`Lote ${existingLot.lotCode} já cadastrado com outra validade; use outro código de lote`);
  }
  const lot = existingLot
    ? await tx.productLot.update({ where: { id: existingLot.id }, data: { quantity: { increment: input.quantity }, expiresAt: existingLot.expiresAt ?? informedExpiry } })
    : await tx.productLot.create({ data: { productId: input.productId, lotCode: input.lotCode.trim(), quantity: input.quantity, expiresAt: input.expiresAt ? new Date(input.expiresAt) : null } });
  await tx.product.update({ where: { id: input.productId }, data: { quantity: { increment: input.quantity } } });
  return tx.stockMovement.create({ data: { productId: input.productId, lotId: lot.id, type: input.type ?? 'RECEIPT', quantity: input.quantity, reason: input.reason.trim(), idempotencyKey: input.idempotencyKey.trim(), authorizedByUserId: input.authorizedByUserId } });
}

export class InventoryService {
  static async receive(input: ReceiveInput) {
    if (!input.lotCode?.trim() || !Number.isInteger(input.quantity) || input.quantity <= 0 || !input.reason?.trim() || !input.idempotencyKey?.trim()) throw new Error('Lote, quantidade, motivo e chave de idempotência são obrigatórios');
    return prisma.$transaction((tx: any) => receiveWithin(tx, input));
  }

  static async issue(input: { productId: number; lotId: number; quantity: number; reason: string; idempotencyKey: string; appointmentId?: number; authorizedByUserId?: number; type?: 'ISSUE' | 'ADJUSTMENT' | 'LOSS' }) {
    if (!Number.isInteger(input.quantity) || input.quantity <= 0 || !input.reason?.trim() || !input.idempotencyKey?.trim()) throw new Error('Quantidade, motivo e chave de idempotência são obrigatórios');
    return prisma.$transaction(async (tx: any) => {
      const duplicate = await tx.stockMovement.findFirst({ where: { idempotencyKey: input.idempotencyKey } });
      if (duplicate) return duplicate;
      const lot = await tx.productLot.findFirst({ where: { id: input.lotId, productId: input.productId } });
      if (!lot || (lot.expiresAt && lot.expiresAt < new Date())) throw new Error('Lote inexistente ou vencido');
      if (input.appointmentId) {
        const appointment = await tx.appointment.findFirst({ where: { id: input.appointmentId } });
        if (!appointment) throw new Error('Atendimento não pertence à clínica autenticada');
      }
      const changed = await tx.productLot.updateMany({ where: { id: lot.id, quantity: { gte: input.quantity } }, data: { quantity: { decrement: input.quantity } } });
      if (changed.count !== 1) throw new Error('Saldo do lote insuficiente');
      const productChanged = await tx.product.updateMany({ where: { id: input.productId, quantity: { gte: input.quantity } }, data: { quantity: { decrement: input.quantity } } });
      if (productChanged.count !== 1) throw new Error('Saldo consolidado do produto insuficiente');
      return tx.stockMovement.create({ data: { productId: input.productId, lotId: lot.id, type: input.type ?? 'ISSUE', quantity: input.quantity, reason: input.reason.trim(), idempotencyKey: input.idempotencyKey.trim(), appointmentId: input.appointmentId, authorizedByUserId: input.authorizedByUserId } });
    });
  }

  static async change(input: { productId: number; lotId: number; quantity: number; type: 'ADJUSTMENT' | 'LOSS' | 'RETURN'; reason: string; idempotencyKey: string; appointmentId?: number; authorizedByUserId?: number }) {
    if (!Number.isInteger(input.quantity) || input.quantity <= 0 || !input.reason?.trim() || !input.idempotencyKey?.trim()) throw new Error('Quantidade, motivo e chave de idempotência são obrigatórios');
    if (input.type === 'RETURN') return this.receive({ productId: input.productId, lotCode: (await this.getLotCode(input.lotId, input.productId)), quantity: input.quantity, reason: input.reason, idempotencyKey: input.idempotencyKey, authorizedByUserId: input.authorizedByUserId, type: 'RETURN' });
    return this.issue({ productId: input.productId, lotId: input.lotId, quantity: input.quantity, reason: input.reason, idempotencyKey: input.idempotencyKey, appointmentId: input.appointmentId, authorizedByUserId: input.authorizedByUserId, type: input.type });
  }

  // A devolução precisa ser do mesmo produto do lote; antes, qualquer lote emprestava o código a outro produto.
  private static async getLotCode(lotId: number, productId: number) {
    const lot = await prisma.productLot.findFirst({ where: { id: lotId, productId } });
    if (!lot) throw new Error('Lote não encontrado para este produto');
    return lot.lotCode;
  }

  static async list(productId?: number) {
    return prisma.stockMovement.findMany({ where: productId ? { productId } : {}, include: { lot: true }, orderBy: { createdAt: 'desc' } });
  }

  static async listLots(productId?: number) {
    return prisma.productLot.findMany({ where: productId ? { productId } : {}, orderBy: [{ expiresAt: 'asc' }, { lotCode: 'asc' }] });
  }
}
