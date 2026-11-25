import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import express from 'express';
import request from 'supertest';
import { prisma } from '../lib/prisma';
import { billingService, createBillingService, isBlocked, priceRaiseDate } from '../services/billing.service';
import { createSignupService, hashSecret } from '../services/signup.service';
import { AuthenticatedRequest, requireRoles, ROLE } from '../middlewares/auth.middleware';
import { createMercadoPagoWebhookRouter } from '../routes/signup.routes';

const db = prisma as any;
const CHECKOUT_ID = '1b4e28ba-2fa1-41d2-883f-0016d3cca427';
const NOW = new Date('2026-12-01T12:00:00Z');
const settings = () => ({ accessToken: 'token-de-teste-local', webhookSecret: '', publicBaseUrl: 'https://eumaeus.example' });
const DAY = 24 * 60 * 60 * 1000;

const subscriptionRow = (extra: Record<string, unknown> = {}) => ({
  id: 3, clinicId: 42, plan: 'PETSHOP', mpPreapprovalId: 'preap0001abc', status: 'ACTIVE', pastDueSince: null,
  promoCents: 7900, fullCents: 9900, ...extra,
});

beforeEach(() => {
  db.subscription = { findUnique: jest.fn(), update: jest.fn().mockResolvedValue({}), findMany: jest.fn(), create: jest.fn() };
  db.signupCheckout = { findUnique: jest.fn(), updateMany: jest.fn().mockResolvedValue({ count: 1 }), update: jest.fn() };
  billingService.clearCache();
});

describe('Regras da assinatura', () => {
  it('sobe o preço 20 dias depois da 3ª cobrança, antes da 4ª', () => {
    const start = new Date('2026-01-10T15:00:00Z');
    const raise = priceRaiseDate(start);
    expect(raise.toISOString()).toBe('2026-03-30T15:00:00.000Z');
    expect(raise.getTime()).toBeLessThan(new Date('2026-04-10T15:00:00Z').getTime());
  });

  it('bloqueia pausada, cancelada ou em atraso além de 7 dias; contrato manual nunca', () => {
    expect(isBlocked(null, NOW)).toBe(false);
    expect(isBlocked({ status: 'ACTIVE', pastDueSince: null }, NOW)).toBe(false);
    expect(isBlocked({ status: 'PAUSED', pastDueSince: null }, NOW)).toBe(true);
    expect(isBlocked({ status: 'CANCELLED', pastDueSince: null }, NOW)).toBe(true);
    expect(isBlocked({ status: 'PAST_DUE', pastDueSince: new Date(NOW.getTime() - 3 * DAY) }, NOW)).toBe(false);
    expect(isBlocked({ status: 'PAST_DUE', pastDueSince: new Date(NOW.getTime() - 8 * DAY) }, NOW)).toBe(true);
  });
});

describe('Cobranças mensais', () => {
  const service = (mp: Record<string, jest.Mock> = {}) => createBillingService({ settings, mercadoPago: () => mp as any, now: () => NOW });

  it('cobrança recusada marca atraso desde a 1ª falha; aprovada volta a ACTIVE', async () => {
    db.subscription.findUnique.mockResolvedValueOnce(subscriptionRow());
    expect(await service().applyAuthorizedPayment({ id: 1, preapproval_id: 'preap0001abc', status: 'recycling', payment: { status: 'rejected' } }))
      .toBe('past-due');
    expect(db.subscription.update.mock.calls[0][0].data).toEqual(expect.objectContaining({ status: 'PAST_DUE', pastDueSince: NOW }));

    db.subscription.findUnique.mockResolvedValueOnce(subscriptionRow({ status: 'PAST_DUE', pastDueSince: NOW }));
    expect(await service().applyAuthorizedPayment({ id: 2, preapproval_id: 'preap0001abc', status: 'processed', payment: { status: 'approved' } }))
      .toBe('approved');
    expect(db.subscription.update.mock.calls[1][0].data).toEqual(expect.objectContaining({ status: 'ACTIVE', pastDueSince: null, lastPaymentStatus: 'approved' }));
  });

  it('pausa e cancelamento no Mercado Pago chegam ao estabelecimento', async () => {
    db.subscription.findUnique.mockResolvedValue(subscriptionRow());
    expect(await service().applyPreapproval({ id: 'preap0001abc', status: 'paused' })).toBe('PAUSED');
    expect(await service().applyPreapproval({ id: 'preap0001abc', status: 'cancelled' })).toBe('CANCELLED');
  });

  it('troca para o preço cheio só nas assinaturas vencidas, e uma falha não para as outras', async () => {
    db.subscription.findMany.mockResolvedValue([subscriptionRow({ id: 1 }), subscriptionRow({ id: 2, mpPreapprovalId: 'preap0002abc' })]);
    const updatePreapprovalAmount = jest.fn()
      .mockRejectedValueOnce(new Error('falhou'))
      .mockResolvedValueOnce({});
    const result = await service({ updatePreapprovalAmount }).raiseDuePrices();

    expect(db.subscription.findMany.mock.calls[0][0].where).toEqual({
      priceRaisedAt: null, priceRaiseAt: { lte: NOW }, status: { in: ['ACTIVE', 'PAST_DUE'] },
    });
    expect(updatePreapprovalAmount).toHaveBeenCalledWith('preap0002abc', 9900);
    expect(result).toEqual({ due: 2, raised: 1 });
    expect(db.subscription.update).toHaveBeenCalledTimes(1);
    expect(db.subscription.update.mock.calls[0][0]).toEqual({ where: { id: 2 }, data: { priceRaisedAt: NOW } });
  });
});

describe('Contratação por assinatura', () => {
  const pending = { id: CHECKOUT_ID, plan: 'PETSHOP', amountCents: 7900, contactEmail: 'dono@example.invalid', status: 'PENDING', mpPreapprovalId: 'preap0001abc' };
  const email = () => ({ isConfigured: jest.fn(() => false), sendSignupLink: jest.fn().mockResolvedValue(true), sendEmailVerification: jest.fn() });

  it('assinatura autorizada com o valor certo libera o cadastro; valor ou vínculo errado não', async () => {
    const mail = email();
    const signup = createSignupService({ settings, mercadoPago: () => ({}) as any, email: mail, now: () => NOW });
    db.signupCheckout.findUnique.mockResolvedValue(pending);

    const ok = { id: 'preap0001abc', status: 'authorized', external_reference: CHECKOUT_ID, auto_recurring: { transaction_amount: 79, currency_id: 'BRL' } };
    expect(await signup.applyPreapproval(ok)).toBe('paid');
    expect(db.signupCheckout.updateMany.mock.calls[0][0].data).toEqual(expect.objectContaining({ status: 'PAID', mpPreapprovalId: 'preap0001abc' }));
    expect(mail.sendSignupLink).toHaveBeenCalledTimes(1);

    expect(await signup.applyPreapproval({ ...ok, auto_recurring: { transaction_amount: 1, currency_id: 'BRL' } })).toBe('amount-mismatch');
    expect(await signup.applyPreapproval({ ...ok, id: 'outraassinatura1' })).toBe('ignored');
    expect(db.signupCheckout.updateMany).toHaveBeenCalledTimes(1);
  });

  it('o cadastro cria a assinatura do estabelecimento com a data da troca de preço', async () => {
    const BROWSER_TOKEN = 'segredo-do-navegador-0123456789abcdef';
    db.signupCheckout.findUnique.mockResolvedValue({ ...pending, status: 'PAID', paidAt: NOW, browserTokenHash: hashSecret(BROWSER_TOKEN) });
    db.clinic = { create: jest.fn().mockResolvedValue({ id: 42 }), delete: jest.fn() };
    db.clinicSettings.create = jest.fn().mockResolvedValue({});
    db.user.create = jest.fn().mockResolvedValue({ id: 5 });
    db.authProfile.create = jest.fn().mockResolvedValue({ id: 9 });
    db.authProfile.findUnique = jest.fn().mockResolvedValue(null);
    db.role.upsert = jest.fn().mockResolvedValue({});

    const signup = createSignupService({ settings, mercadoPago: () => ({}) as any, email: email(), now: () => NOW });
    await signup.completeSignup({
      checkoutId: CHECKOUT_ID, token: BROWSER_TOKEN, clinicName: 'Pet Teste', ownerName: 'Dona Teste',
      email: 'dono@example.invalid', password: 'Cadastro2026xyz',
    });

    expect(db.subscription.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      clinicId: 42, mpPreapprovalId: 'preap0001abc', promoCents: 7900, fullCents: 9900, status: 'ACTIVE',
      startedAt: NOW, priceRaiseAt: priceRaiseDate(NOW),
    }) });
  });
});

describe('Bloqueio de acesso', () => {
  const response = () => {
    const res = { status: jest.fn(), json: jest.fn() } as unknown as Response;
    (res.status as jest.Mock).mockReturnValue(res);
    (res.json as jest.Mock).mockReturnValue(res);
    return res;
  };
  const token = (clinicId: number) => jwt.sign({ id: 5, type: 'user', role: ROLE.DONO, clinicId }, process.env.JWT_SECRET as string, { algorithm: 'HS256' });
  const call = async (clinicId: number) => {
    const res = response();
    const next = jest.fn() as jest.MockedFunction<NextFunction>;
    requireRoles(ROLE.DONO)({ headers: { authorization: `Bearer ${token(clinicId)}` } } as AuthenticatedRequest, res, next);
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));
    return { res, next };
  };

  beforeEach(() => {
    db.user.findFirst = jest.fn().mockResolvedValue({ active: true, roleName: 'DONO' });
  });

  it('assinatura cancelada recebe 402 com código; sem assinatura segue normal', async () => {
    db.subscription.findUnique.mockResolvedValueOnce({ status: 'CANCELLED', pastDueSince: null });
    const blocked = await call(77);
    expect(blocked.res.status).toHaveBeenCalledWith(402);
    expect(blocked.res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'SUBSCRIPTION_BLOCKED' }));
    expect(blocked.next).not.toHaveBeenCalled();

    db.subscription.findUnique.mockResolvedValueOnce(null);
    const manual = await call(78);
    expect(manual.next).toHaveBeenCalled();
  });
});

describe('Webhook de assinatura', () => {
  it('encaminha assinatura e cobrança mensal aos serviços certos', async () => {
    const service = { handlePaymentNotification: jest.fn(), handlePreapprovalNotification: jest.fn().mockResolvedValue('paid') } as any;
    const billing = {
      handlePreapprovalNotification: jest.fn().mockResolvedValue('ACTIVE'),
      handleAuthorizedPaymentNotification: jest.fn().mockResolvedValue('approved'),
    };
    const app = express();
    app.use(express.json());
    app.use('/webhooks/mercadopago', createMercadoPagoWebhookRouter(service, () => ({ ...settings(), webhookSecret: '' }), billing));

    await request(app).post('/webhooks/mercadopago?type=subscription_preapproval&data.id=preap0001abc').send({}).expect(200);
    expect(service.handlePreapprovalNotification).toHaveBeenCalledWith('preap0001abc');
    expect(billing.handlePreapprovalNotification).toHaveBeenCalledWith('preap0001abc');

    await request(app).post('/webhooks/mercadopago?type=subscription_authorized_payment&data.id=6114264375').send({}).expect(200);
    expect(billing.handleAuthorizedPaymentNotification).toHaveBeenCalledWith('6114264375');

    const ignored = await request(app).post('/webhooks/mercadopago?type=subscription_preapproval&data.id=../x').send({}).expect(200);
    expect(ignored.body).toEqual({ ignored: true });
    expect(service.handlePaymentNotification).not.toHaveBeenCalled();
  });
});
