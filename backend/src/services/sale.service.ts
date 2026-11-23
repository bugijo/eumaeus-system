import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getCurrentClinicId, getCurrentUserId } from '../tenantContext';

export const SALE_PAYMENT_METHODS = ['DINHEIRO', 'PIX', 'DEBITO', 'CREDITO', 'OUTRO'] as const;
export type SalePaymentMethod = (typeof SALE_PAYMENT_METHODS)[number];

export interface SaleItemInput { productId: number; quantity: number; unitPrice?: number }
export interface SalePaymentInput { method: string; amount: number }
export interface CreateSaleInput {
  items: SaleItemInput[];
  payments: SalePaymentInput[];
  discount?: number;
  resultCenterId?: number;
  tutorId?: number;
  idempotencyKey: string;
}

const toCents = (value: number) => Math.round(Number(value) * 100);
const fromCents = (cents: number) => (cents / 100).toFixed(2);

/** Cálculo puro (em centavos) usado pela venda e pelos testes. */
export function computeSaleTotals(
  lines: Array<{ quantity: number; unitPrice: number }>,
  discount: number,
  payments: SalePaymentInput[],
) {
  if (!lines.length) throw new Error('Adicione ao menos um item à venda');
  const lineTotals = lines.map((line) => {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) throw new Error('Quantidade deve ser um número inteiro positivo');
    if (!Number.isFinite(line.unitPrice) || line.unitPrice < 0) throw new Error('Preço unitário inválido');
    return line.quantity * toCents(line.unitPrice);
  });
  const subtotal = lineTotals.reduce((a, b) => a + b, 0);
  const discountCents = toCents(discount || 0);
  if (discountCents < 0 || discountCents > subtotal) throw new Error('Desconto deve estar entre zero e o subtotal');
  const total = subtotal - discountCents;
  if (!payments.length && total > 0) throw new Error('Informe a forma de pagamento');
  let paid = 0;
  let cash = 0;
  for (const payment of payments) {
    const method = String(payment.method || '').toUpperCase();
    if (!SALE_PAYMENT_METHODS.includes(method as SalePaymentMethod)) throw new Error(`Forma de pagamento inválida: ${payment.method}`);
    const cents = toCents(payment.amount);
    if (!Number.isFinite(cents) || cents <= 0) throw new Error('Valor de pagamento deve ser positivo');
    paid += cents;
    if (method === 'DINHEIRO') cash += cents;
  }
  if (paid < total) throw new Error(`Pagamento insuficiente: faltam R$ ${fromCents(total - paid)}`);
  const change = paid - total;
  if (change > cash) throw new Error('Troco só é permitido para pagamento em dinheiro');
  return { lineTotals, subtotal, discount: discountCents, total, paid, change };
}

export class SaleService {
  static async findProductByBarcode(barcode: string) {
    const code = String(barcode || '').trim();
    if (!code) return null;
    return (prisma.product as any).findFirst({ where: { barcode: code } });
  }

  static async create(input: CreateSaleInput) {
    const clinicId = getCurrentClinicId();
    const userId = getCurrentUserId();
    if (!clinicId || !userId) throw new Error('Autoria autenticada obrigatória');
    const key = String(input.idempotencyKey || '').trim();
    if (!key) throw new Error('Chave de idempotência obrigatória');
    if (!Array.isArray(input.items) || !Array.isArray(input.payments)) throw new Error('Itens e pagamentos são obrigatórios');

    // Agrupa itens repetidos (o mesmo produto bipado várias vezes)
    const grouped = new Map<number, SaleItemInput>();
    for (const item of input.items) {
      const productId = Number(item.productId);
      if (!Number.isInteger(productId)) throw new Error('Produto inválido');
      const current = grouped.get(productId);
      grouped.set(productId, { productId, quantity: (current?.quantity || 0) + Number(item.quantity), unitPrice: item.unitPrice ?? current?.unitPrice });
    }

    return prisma.$transaction(async (tx: any) => {
      const duplicate = await tx.sale.findFirst({ where: { idempotencyKey: key }, include: { items: true, payments: true } });
      if (duplicate) return duplicate;

      const productIds = [...grouped.keys()];
      await tx.$queryRaw`SELECT "id" FROM "Product" WHERE "id" IN (${Prisma.join(productIds)}) AND "clinicId" = ${clinicId} FOR UPDATE`;
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      const byId = new Map<number, any>(products.map((product: any) => [product.id, product]));

      const lines = [...grouped.values()].map((item) => {
        const product = byId.get(item.productId);
        if (!product) throw new Error(`Produto ${item.productId} não encontrado`);
        if (product.quantity < item.quantity) throw new Error(`Estoque insuficiente de "${product.name}": disponível ${product.quantity}`);
        const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : Number(product.salePrice ?? product.price);
        return { product, quantity: item.quantity, unitPrice };
      });

      const totals = computeSaleTotals(lines, Number(input.discount || 0), input.payments);
      const resultCenterId = input.resultCenterId ?? lines[0].product.resultCenterId ?? null;
      const last = await tx.sale.findFirst({ orderBy: { number: 'desc' }, select: { number: true } });

      const sale = await tx.sale.create({
        data: {
          number: (last?.number || 0) + 1,
          subtotal: new Prisma.Decimal(fromCents(totals.subtotal)),
          discount: new Prisma.Decimal(fromCents(totals.discount)),
          total: new Prisma.Decimal(fromCents(totals.total)),
          change: new Prisma.Decimal(fromCents(totals.change)),
          resultCenterId,
          tutorId: input.tutorId ?? null,
          soldByUserId: userId,
          idempotencyKey: key,
          items: {
            create: lines.map((line, index) => ({
              clinicId,
              productId: line.product.id,
              description: line.product.name,
              barcode: line.product.barcode ?? null,
              quantity: line.quantity,
              unitPrice: new Prisma.Decimal(line.unitPrice.toFixed(2)),
              total: new Prisma.Decimal(fromCents(totals.lineTotals[index])),
            })),
          },
          payments: {
            create: input.payments.map((payment) => ({ clinicId, method: String(payment.method).toUpperCase(), amount: new Prisma.Decimal(Number(payment.amount).toFixed(2)) })),
          },
        },
        include: { items: true, payments: true },
      });

      for (const line of lines) {
        await SaleService.consumeStock(tx, line.product.id, line.quantity, `Venda PDV #${sale.number}`, `sale:${sale.id}:${line.product.id}`, userId);
      }
      return sale;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  /** Baixa o saldo do produto e, se houver lotes, consome pelo vencimento mais próximo (FEFO). */
  static async consumeStock(tx: any, productId: number, quantity: number, reason: string, keyPrefix: string, userId: number) {
    const changed = await tx.product.updateMany({ where: { id: productId, quantity: { gte: quantity } }, data: { quantity: { decrement: quantity } } });
    if (changed.count !== 1) throw new Error('Estoque insuficiente');
    const lots = await tx.productLot.findMany({ where: { productId, quantity: { gt: 0 } }, orderBy: [{ expiresAt: 'asc' }, { id: 'asc' }] });
    let remaining = quantity;
    for (const lot of lots) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, lot.quantity);
      await tx.productLot.update({ where: { id: lot.id }, data: { quantity: { decrement: take } } });
      await tx.stockMovement.create({ data: { productId, lotId: lot.id, type: 'SALE', quantity: take, reason, idempotencyKey: `${keyPrefix}:${lot.id}`, authorizedByUserId: userId } });
      remaining -= take;
    }
  }

  static async cancel(saleId: number, reason: string) {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('Autoria autenticada obrigatória');
    if (!reason?.trim()) throw new Error('Informe o motivo do cancelamento');
    return prisma.$transaction(async (tx: any) => {
      const sale = await tx.sale.findFirst({ where: { id: saleId }, include: { items: true } });
      if (!sale) throw new Error('Venda não encontrada');
      if (sale.status === 'CANCELLED') return sale;
      for (const item of sale.items) {
        if (item.productId) await tx.product.updateMany({ where: { id: item.productId }, data: { quantity: { increment: item.quantity } } });
      }
      const movements = await tx.stockMovement.findMany({ where: { type: 'SALE', idempotencyKey: { startsWith: `sale:${sale.id}:` } } });
      for (const movement of movements) {
        await tx.productLot.update({ where: { id: movement.lotId }, data: { quantity: { increment: movement.quantity } } });
        await tx.stockMovement.create({ data: { productId: movement.productId, lotId: movement.lotId, type: 'RETURN', quantity: movement.quantity, reason: `Cancelamento venda #${sale.number}: ${reason.trim()}`, idempotencyKey: `cancel:${movement.idempotencyKey}`, authorizedByUserId: userId } });
      }
      return tx.sale.update({ where: { id: saleId }, data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: reason.trim() }, include: { items: true, payments: true } });
    });
  }

  static list(params: { from?: string; to?: string } = {}) {
    const createdAt: Record<string, Date> = {};
    if (params.from) createdAt.gte = new Date(`${params.from}T00:00:00.000-03:00`);
    if (params.to) createdAt.lte = new Date(`${params.to}T23:59:59.999-03:00`);
    return (prisma.sale as any).findMany({
      where: Object.keys(createdAt).length ? { createdAt } : {},
      include: { items: true, payments: true, resultCenter: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  static getById(id: number) {
    return (prisma.sale as any).findFirst({ where: { id }, include: { items: true, payments: true, resultCenter: true } });
  }
}
