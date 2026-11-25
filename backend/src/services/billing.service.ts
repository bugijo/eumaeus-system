import { prisma } from '../lib/prisma';
import {
  MercadoPagoAuthorizedPayment,
  MercadoPagoClient,
  MercadoPagoPreapproval,
  MercadoPagoSettings,
  createMercadoPagoClient,
  loadMercadoPagoSettings,
} from '../integrations/mercadopago/client';

/** Dias de tolerância com cobrança falhando antes de bloquear o acesso. */
export const PAST_DUE_GRACE_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Sobe para o preço cheio depois da 3ª cobrança (início + 2 meses) e antes da 4ª (início + 3 meses). */
export const priceRaiseDate = (startedAt: Date) => {
  const date = new Date(startedAt.getTime());
  date.setUTCMonth(date.getUTCMonth() + 2);
  return new Date(date.getTime() + 20 * DAY_MS);
};

type SubscriptionState = { status: string; pastDueSince: Date | null };

/** Bloqueia assinatura pausada, cancelada ou com cobrança falhando além da tolerância. */
export const isBlocked = (subscription: SubscriptionState | null | undefined, now: Date) => {
  if (!subscription) return false; // sem assinatura = contrato manual
  if (subscription.status === 'PAUSED' || subscription.status === 'CANCELLED') return true;
  if (subscription.status === 'PAST_DUE' && subscription.pastDueSince) {
    return now.getTime() - subscription.pastDueSince.getTime() > PAST_DUE_GRACE_DAYS * DAY_MS;
  }
  return false;
};

export type BillingServiceDeps = {
  settings?: () => MercadoPagoSettings;
  mercadoPago?: (settings: MercadoPagoSettings) => MercadoPagoClient;
  now?: () => Date;
};

export const createBillingService = (deps: BillingServiceDeps = {}) => {
  const settings = deps.settings ?? (() => loadMercadoPagoSettings());
  const mercadoPago = deps.mercadoPago ?? ((s: MercadoPagoSettings) => createMercadoPagoClient(s));
  const now = deps.now ?? (() => new Date());
  const db = prisma as any;
  const blockedCache = new Map<number, { blocked: boolean; at: number }>();

  const api = {
    /** Reflete o status da assinatura no Mercado Pago. Não reativa quem está em atraso. */
    async applyPreapproval(preapproval: MercadoPagoPreapproval) {
      const subscription = await db.subscription.findUnique({ where: { mpPreapprovalId: String(preapproval.id) } });
      if (!subscription) return 'no-subscription';
      const status =
        preapproval.status === 'paused' ? 'PAUSED'
          : preapproval.status === 'cancelled' ? 'CANCELLED'
            : preapproval.status === 'authorized' ? (subscription.status === 'PAST_DUE' ? 'PAST_DUE' : 'ACTIVE')
              : subscription.status;
      await db.subscription.update({ where: { id: subscription.id }, data: { status, mpStatus: preapproval.status } });
      blockedCache.delete(subscription.clinicId);
      return status;
    },

    /** Cada cobrança mensal: aprovada volta a ACTIVE; recusada marca atraso (a tolerância conta da 1ª falha). */
    async applyAuthorizedPayment(charge: MercadoPagoAuthorizedPayment) {
      if (!charge.preapproval_id) return 'ignored';
      const subscription = await db.subscription.findUnique({ where: { mpPreapprovalId: String(charge.preapproval_id) } });
      if (!subscription) return 'no-subscription';
      const paymentStatus = charge.payment?.status ?? '';
      const at = charge.date_created ? new Date(charge.date_created) : now();
      if (paymentStatus === 'approved') {
        await db.subscription.update({
          where: { id: subscription.id },
          data: {
            lastPaymentAt: at,
            lastPaymentStatus: 'approved',
            pastDueSince: null,
            status: subscription.status === 'PAST_DUE' ? 'ACTIVE' : subscription.status,
          },
        });
        blockedCache.delete(subscription.clinicId);
        return 'approved';
      }
      if (paymentStatus === 'rejected' || charge.status === 'recycling') {
        const keepStatus = subscription.status === 'PAUSED' || subscription.status === 'CANCELLED';
        await db.subscription.update({
          where: { id: subscription.id },
          data: {
            lastPaymentStatus: paymentStatus || charge.status,
            status: keepStatus ? subscription.status : 'PAST_DUE',
            pastDueSince: subscription.pastDueSince ?? at,
          },
        });
        blockedCache.delete(subscription.clinicId);
        return 'past-due';
      }
      return 'pending';
    },

    async handlePreapprovalNotification(preapprovalId: string) {
      return api.applyPreapproval(await mercadoPago(settings()).getPreapproval(preapprovalId));
    },

    async handleAuthorizedPaymentNotification(chargeId: string) {
      return api.applyAuthorizedPayment(await mercadoPago(settings()).getAuthorizedPayment(chargeId));
    },

    /** Tarefa diária: passa ao preço cheio as assinaturas que já tiveram as 3 cobranças promocionais. */
    async raiseDuePrices() {
      const due = await db.subscription.findMany({
        where: { priceRaisedAt: null, priceRaiseAt: { lte: now() }, status: { in: ['ACTIVE', 'PAST_DUE'] } },
        take: 100,
      });
      let raised = 0;
      for (const subscription of due) {
        try {
          await mercadoPago(settings()).updatePreapprovalAmount(subscription.mpPreapprovalId, subscription.fullCents);
          await db.subscription.update({ where: { id: subscription.id }, data: { priceRaisedAt: now() } });
          raised += 1;
        } catch {
          console.error(`Falha ao subir o preço da assinatura ${subscription.id}; tenta de novo amanhã.`);
        }
      }
      return { due: due.length, raised };
    },

    /** Usado a cada requisição autenticada; cache curto para não consultar o banco toda vez. */
    async isClinicBlocked(clinicId: number) {
      const cached = blockedCache.get(clinicId);
      if (cached && Date.now() - cached.at < 60_000) return cached.blocked;
      const findUnique = db.subscription?.findUnique;
      if (typeof findUnique !== 'function') return false;
      const subscription = await findUnique({ where: { clinicId }, select: { status: true, pastDueSince: true } });
      const blocked = isBlocked(subscription, now());
      blockedCache.set(clinicId, { blocked, at: Date.now() });
      return blocked;
    },

    clearCache() { blockedCache.clear(); },
  };
  return api;
};

export const billingService = createBillingService();
