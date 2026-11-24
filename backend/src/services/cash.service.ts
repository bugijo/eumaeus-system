import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { getCurrentClinicId, getCurrentUserId } from '../tenantContext';

/** Namespace da trava por estabelecimento (pg_advisory_xact_lock(int, int)); vendas e caixa usam a mesma fila. */
export const SALE_LOCK_NAMESPACE = 41001;

/** Enfileira operações de caixa e venda do mesmo estabelecimento dentro da transação. */
export async function lockClinicCash(tx: any, clinicId: number) {
  await tx.$queryRaw`SELECT pg_advisory_xact_lock(${SALE_LOCK_NAMESPACE}::int, ${clinicId}::int) IS NULL AS "locked"`;
}

const cents = (value: unknown) => Math.round(Number(value ?? 0) * 100);
const reais = (value: number) => (value / 100).toFixed(2);
const decimal = (value: number) => new Prisma.Decimal(reais(value));

type SaleLike = { status: string; total: unknown; change: unknown; payments: Array<{ method: string; amount: unknown }> };
type MovementLike = { type: string; amount: unknown };

export interface CashSummary {
  salesCount: number;
  cancelledCount: number;
  salesTotal: string;
  byMethod: Record<string, string>;
  suprimentos: string;
  sangrias: string;
  opening: string;
  expectedCash: string;
}

/**
 * Dinheiro esperado na gaveta = troco inicial + dinheiro recebido nas vendas − troco devolvido
 * + suprimentos − sangrias. Vendas canceladas não contam (o dinheiro foi devolvido ao cliente).
 */
export function computeCashSummary(openingAmount: unknown, sales: SaleLike[], movements: MovementLike[]): CashSummary & { expectedCashCents: number } {
  const byMethod: Record<string, number> = {};
  let salesTotal = 0;
  let cashIn = 0;
  let completed = 0;
  for (const sale of sales) {
    if (sale.status !== 'COMPLETED') continue;
    completed += 1;
    salesTotal += cents(sale.total);
    for (const payment of sale.payments) {
      byMethod[payment.method] = (byMethod[payment.method] || 0) + cents(payment.amount);
      if (payment.method === 'DINHEIRO') cashIn += cents(payment.amount);
    }
    cashIn -= cents(sale.change);
    if (cents(sale.change)) byMethod.DINHEIRO = (byMethod.DINHEIRO || 0) - cents(sale.change);
  }
  const suprimentos = movements.filter((m) => m.type === 'SUPRIMENTO').reduce((sum, m) => sum + cents(m.amount), 0);
  const sangrias = movements.filter((m) => m.type === 'SANGRIA').reduce((sum, m) => sum + cents(m.amount), 0);
  const opening = cents(openingAmount);
  const expected = opening + cashIn + suprimentos - sangrias;
  return {
    salesCount: completed,
    cancelledCount: sales.length - completed,
    salesTotal: reais(salesTotal),
    byMethod: Object.fromEntries(Object.entries(byMethod).map(([method, value]) => [method, reais(value)])),
    suprimentos: reais(suprimentos),
    sangrias: reais(sangrias),
    opening: reais(opening),
    expectedCash: reais(expected),
    expectedCashCents: expected,
  };
}

export function parseMoney(value: unknown, label: string, { allowZero = false } = {}): number {
  const parsed = cents(value);
  if (!Number.isFinite(parsed) || parsed < 0 || (!allowZero && parsed === 0)) throw new Error(`${label} inválido`);
  if (parsed > 100_000_000) throw new Error(`${label} acima do permitido`);
  return parsed;
}

const sessionInclude = {
  movements: { orderBy: { createdAt: 'asc' } },
  sales: { select: { id: true, number: true, status: true, total: true, change: true, createdAt: true, payments: { select: { method: true, amount: true } } }, orderBy: { createdAt: 'asc' } },
} as const;

function authorship() {
  const clinicId = getCurrentClinicId();
  const userId = getCurrentUserId();
  if (!clinicId || !userId) throw new Error('Autoria autenticada obrigatória');
  return { clinicId, userId };
}

const money = (value: unknown) => (value === null || value === undefined ? null : reais(cents(value)));

async function withNames(session: any) {
  if (!session) return null;
  const ids = [session.openedById, session.closedById, ...session.movements.map((m: any) => m.createdById)].filter(Boolean);
  const users = await (prisma.user as any).findMany({ where: { id: { in: [...new Set(ids)] } }, select: { id: true, name: true } });
  const name = (id?: number | null) => users.find((u: any) => u.id === id)?.name ?? null;
  const { expectedCashCents, ...summary } = computeCashSummary(session.openingAmount, session.sales, session.movements);
  return {
    id: session.id,
    status: session.status,
    openedAt: session.openedAt,
    openedBy: name(session.openedById),
    closedAt: session.closedAt,
    closedBy: name(session.closedById),
    countedCash: money(session.countedCash),
    difference: money(session.difference),
    closingNote: session.closingNote,
    movements: session.movements.map((m: any) => ({ id: m.id, type: m.type, amount: money(m.amount), reason: m.reason, createdAt: m.createdAt, createdBy: name(m.createdById) })),
    summary: session.status === 'CLOSED' && session.summary ? session.summary : summary,
  };
}

export class CashService {
  static async current() {
    const session = await (prisma.cashSession as any).findFirst({ where: { status: 'OPEN' }, include: sessionInclude });
    return withNames(session);
  }

  static async history(limit = 30) {
    const sessions = await (prisma.cashSession as any).findMany({
      where: { status: 'CLOSED' }, include: sessionInclude, orderBy: { closedAt: 'desc' }, take: Math.min(Math.max(limit, 1), 100),
    });
    return Promise.all(sessions.map(withNames));
  }

  static async open(openingAmount: unknown) {
    const { clinicId, userId } = authorship();
    const amount = parseMoney(openingAmount, 'Troco inicial', { allowZero: true });
    try {
      const session = await prisma.$transaction(async (tx: any) => {
        await lockClinicCash(tx, clinicId);
        const open = await tx.cashSession.findFirst({ where: { status: 'OPEN' } });
        if (open) throw new Error('Já existe um caixa aberto. Feche-o antes de abrir outro.');
        return tx.cashSession.create({ data: { openedById: userId, openingAmount: decimal(amount) }, include: sessionInclude });
      });
      return withNames(session);
    } catch (error) {
      // Índice único parcial: segunda proteção caso duas aberturas escapem da fila.
      if ((error as { code?: string }).code === 'P2002') throw new Error('Já existe um caixa aberto. Feche-o antes de abrir outro.');
      throw error;
    }
  }

  static async addMovement(type: string, amountInput: unknown, reasonInput: unknown) {
    const { clinicId, userId } = authorship();
    if (type !== 'SANGRIA' && type !== 'SUPRIMENTO') throw new Error('Movimento inválido');
    const amount = parseMoney(amountInput, 'Valor');
    const reason = String(reasonInput ?? '').trim();
    if (!reason) throw new Error('Informe o motivo');
    const session = await prisma.$transaction(async (tx: any) => {
      await lockClinicCash(tx, clinicId);
      const open = await tx.cashSession.findFirst({ where: { status: 'OPEN' }, include: sessionInclude });
      if (!open) throw new Error('Nenhum caixa aberto');
      if (type === 'SANGRIA') {
        const { expectedCashCents } = computeCashSummary(open.openingAmount, open.sales, open.movements);
        if (amount > expectedCashCents) throw new Error(`Sangria maior que o dinheiro em caixa (R$ ${reais(expectedCashCents)})`);
      }
      await tx.cashMovement.create({ data: { clinicId, sessionId: open.id, type, amount: decimal(amount), reason: reason.slice(0, 300), createdById: userId } });
      return tx.cashSession.findFirst({ where: { id: open.id }, include: sessionInclude });
    });
    return withNames(session);
  }

  static async close(countedInput: unknown, noteInput: unknown) {
    const { clinicId, userId } = authorship();
    const counted = parseMoney(countedInput, 'Valor contado', { allowZero: true });
    const note = String(noteInput ?? '').trim().slice(0, 500);
    const session = await prisma.$transaction(async (tx: any) => {
      await lockClinicCash(tx, clinicId);
      const open = await tx.cashSession.findFirst({ where: { status: 'OPEN' }, include: sessionInclude });
      if (!open) throw new Error('Nenhum caixa aberto');
      const { expectedCashCents, ...summary } = computeCashSummary(open.openingAmount, open.sales, open.movements);
      const difference = counted - expectedCashCents;
      if (difference !== 0 && !note) throw new Error(`Diferença de R$ ${reais(difference)} no caixa: explique no campo de observação`);
      await tx.cashSession.update({
        where: { id: open.id },
        data: {
          status: 'CLOSED', closedAt: new Date(), closedById: userId,
          expectedCash: decimal(expectedCashCents), countedCash: decimal(counted),
          difference: new Prisma.Decimal(reais(difference)), closingNote: note || null, summary,
        },
      });
      return tx.cashSession.findFirst({ where: { id: open.id }, include: sessionInclude });
    });
    return withNames(session);
  }
}
