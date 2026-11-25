import express from 'express';
import request from 'supertest';
import { createHmac } from 'node:crypto';
import { prisma } from '../lib/prisma';
import { createSignupService, hashSecret, SignupError } from '../services/signup.service';
import { getCurrentClinicId } from '../tenantContext';
import { verifyWebhookSignature } from '../integrations/mercadopago/client';
import { createMercadoPagoWebhookRouter } from '../routes/signup.routes';

const db = prisma as any;
const CHECKOUT_ID = '1b4e28ba-2fa1-41d2-883f-0016d3cca427';
const BROWSER_TOKEN = 'segredo-do-navegador-0123456789abcdef';

const settings = () => ({ accessToken: 'token-de-teste-local', webhookSecret: '', publicBaseUrl: 'https://eumaeus.example' });
const makeEmail = (configured = true) => ({
  isConfigured: jest.fn(() => configured),
  sendSignupLink: jest.fn().mockResolvedValue(true),
  sendEmailVerification: jest.fn().mockResolvedValue(true),
});
const makeMp = (overrides: Record<string, jest.Mock> = {}) => ({
  createPreference: jest.fn().mockResolvedValue({ id: 'pref-1', init_point: 'https://mp.example/checkout' }),
  getPayment: jest.fn(),
  searchPaymentsByReference: jest.fn().mockResolvedValue([]),
  ...overrides,
});

const paidCheckout = (extra: Record<string, unknown> = {}) => ({
  id: CHECKOUT_ID, plan: 'CLINICA', amountCents: 12900, contactEmail: 'dono@example.invalid',
  status: 'PAID', browserTokenHash: hashSecret(BROWSER_TOKEN), emailTokenHash: null, mpPaymentId: '77', ...extra,
});

beforeEach(() => {
  db.signupCheckout = { create: jest.fn(), findUnique: jest.fn(), update: jest.fn(), updateMany: jest.fn() };
  db.clinic = { create: jest.fn().mockResolvedValue({ id: 42 }), delete: jest.fn().mockResolvedValue({}) };
  db.clinicSettings.create = jest.fn().mockResolvedValue({});
  db.user.create.mockReset().mockResolvedValue({ id: 5 });
  db.authProfile.create.mockReset().mockResolvedValue({ id: 9 });
  db.authProfile.findUnique.mockReset().mockResolvedValue(null);
  db.role.upsert.mockReset().mockResolvedValue({});
});

describe('Contratação: checkout', () => {
  it('cobra o preço promocional definido no servidor e manda a referência ao Mercado Pago', async () => {
    db.signupCheckout.create.mockResolvedValue({ id: CHECKOUT_ID });
    const mp = makeMp();
    const service = createSignupService({ settings, mercadoPago: () => mp as any, email: makeEmail() });
    const result = await service.createCheckout({ plan: 'petshop', email: ' Dono@Example.invalid ' });

    expect(db.signupCheckout.create.mock.calls[0][0].data).toEqual(expect.objectContaining({ plan: 'PETSHOP', amountCents: 7900, contactEmail: 'dono@example.invalid' }));
    const [preference, idempotency] = mp.createPreference.mock.calls[0];
    expect(preference.items[0].unit_price).toBe(79);
    expect(preference.external_reference).toBe(CHECKOUT_ID);
    expect(preference.notification_url).toBe('https://eumaeus.example/webhooks/mercadopago');
    expect(idempotency).toBe(CHECKOUT_ID);
    expect(result.redirectUrl).toBe('https://mp.example/checkout');
    // O segredo devolvido ao navegador não é o que fica no banco.
    expect(db.signupCheckout.create.mock.calls[0][0].data.browserTokenHash).toBe(hashSecret(result.token));
  });

  it('recusa plano desconhecido e responde 503 sem credencial', async () => {
    const service = createSignupService({ settings, mercadoPago: () => makeMp() as any, email: makeEmail() });
    await expect(service.createCheckout({ plan: 'GRATIS', email: 'a@example.invalid' })).rejects.toThrow('Plano inválido');
    const off = createSignupService({ settings: () => ({ ...settings(), accessToken: '' }), email: makeEmail() });
    await expect(off.createCheckout({ plan: 'CLINICA', email: 'a@example.invalid' })).rejects.toMatchObject({ status: 503 });
  });
});

describe('Contratação: pagamento', () => {
  const service = (mp = makeMp(), email = makeEmail()) => createSignupService({ settings, mercadoPago: () => mp as any, email });

  it('pagamento aprovado com valor certo marca PAID uma vez e envia o link de cadastro', async () => {
    db.signupCheckout.findUnique.mockResolvedValue(paidCheckout({ status: 'PENDING', mpPaymentId: null }));
    db.signupCheckout.updateMany.mockResolvedValue({ count: 1 });
    const email = makeEmail();
    const result = await service(makeMp(), email).applyPayment({ id: 77, status: 'approved', external_reference: CHECKOUT_ID, transaction_amount: 129, currency_id: 'BRL' });
    expect(result).toBe('paid');
    expect(db.signupCheckout.updateMany.mock.calls[0][0].where).toEqual({ id: CHECKOUT_ID, status: { in: ['PENDING', 'REJECTED'] } });
    expect(email.sendSignupLink).toHaveBeenCalledWith('dono@example.invalid', expect.objectContaining({ link: expect.stringContaining(`/cadastro?checkout=${CHECKOUT_ID}&token=`) }));
  });

  it('valor divergente não libera nada', async () => {
    db.signupCheckout.findUnique.mockResolvedValue(paidCheckout({ status: 'PENDING' }));
    const result = await service().applyPayment({ id: 78, status: 'approved', external_reference: CHECKOUT_ID, transaction_amount: 1, currency_id: 'BRL' });
    expect(result).toBe('amount-mismatch');
    expect(db.signupCheckout.updateMany).not.toHaveBeenCalled();
  });

  it('notificação repetida não reenvia o link', async () => {
    db.signupCheckout.findUnique.mockResolvedValue(paidCheckout());
    db.signupCheckout.updateMany.mockResolvedValue({ count: 0 });
    const email = makeEmail();
    await service(makeMp(), email).applyPayment({ id: 77, status: 'approved', external_reference: CHECKOUT_ID, transaction_amount: 129, currency_id: 'BRL' });
    expect(email.sendSignupLink).not.toHaveBeenCalled();
  });
});

describe('Contratação: cadastro do dono', () => {
  const input = (extra: Record<string, unknown> = {}) => ({
    checkoutId: CHECKOUT_ID, token: BROWSER_TOKEN, clinicName: 'Clínica Teste', ownerName: 'Pessoa Dona',
    email: 'dono@example.invalid', password: 'Cadastro2026xyz', ...extra,
  });

  it('cria estabelecimento novo com o plano pago e exige confirmação quando há SMTP', async () => {
    db.signupCheckout.findUnique.mockResolvedValue(paidCheckout());
    db.signupCheckout.updateMany.mockResolvedValue({ count: 1 });
    const email = makeEmail(true);
    const contexts: Array<number | undefined> = [];
    db.user.create.mockImplementation(async () => { contexts.push(getCurrentClinicId()); return { id: 5 }; });
    db.clinicSettings.create.mockImplementation(async () => { contexts.push(getCurrentClinicId()); return {}; });
    const service = createSignupService({ settings, mercadoPago: () => makeMp() as any, email });
    await expect(service.completeSignup(input())).resolves.toEqual({ email: 'dono@example.invalid', requiresEmailVerification: true });

    expect(db.signupCheckout.updateMany.mock.calls[0][0]).toEqual(expect.objectContaining({ where: { id: CHECKOUT_ID, status: 'PAID' } }));
    expect(db.authProfile.create.mock.calls[0][0].data).toEqual(expect.objectContaining({ email: 'dono@example.invalid', emailVerifiedAt: null }));
    expect(db.authProfile.create.mock.calls[0][0].data.password).not.toContain('Cadastro2026xyz');
    expect(db.user.create.mock.calls[0][0].data).toEqual(expect.objectContaining({ roleName: 'DONO' }));
    expect(db.clinicSettings.create.mock.calls[0][0].data).toEqual(expect.objectContaining({ plan: 'CLINICA' }));
    // Usuário e configurações são gravados no contexto do estabelecimento novo.
    expect(contexts).toEqual([42, 42]);
    expect(email.sendEmailVerification).toHaveBeenCalledWith('dono@example.invalid', expect.objectContaining({ link: expect.stringContaining('/confirmar-email?token=') }));
  });

  it('segredo errado não encontra a contratação', async () => {
    db.signupCheckout.findUnique.mockResolvedValue(paidCheckout());
    const service = createSignupService({ settings, email: makeEmail() });
    await expect(service.completeSignup(input({ token: 'outro-segredo-qualquer-0123456789' }))).rejects.toMatchObject({ status: 404 });
    expect(db.clinic.create).not.toHaveBeenCalled();
  });

  it('checkout já usado ou ainda não pago é recusado', async () => {
    const service = createSignupService({ settings, email: makeEmail() });
    db.signupCheckout.findUnique.mockResolvedValue(paidCheckout({ status: 'COMPLETED' }));
    await expect(service.completeSignup(input())).rejects.toMatchObject({ code: 'ALREADY_COMPLETED' });
    db.signupCheckout.findUnique.mockResolvedValue(paidCheckout({ status: 'PENDING' }));
    await expect(service.completeSignup(input())).rejects.toMatchObject({ code: 'NOT_PAID' });
  });

  it('corrida no mesmo checkout: a segunda tentativa desfaz o estabelecimento criado', async () => {
    db.signupCheckout.findUnique.mockResolvedValue(paidCheckout());
    db.signupCheckout.updateMany.mockResolvedValue({ count: 0 });
    const service = createSignupService({ settings, email: makeEmail() });
    await expect(service.completeSignup(input())).rejects.toBeInstanceOf(SignupError);
    expect(db.authProfile.create).not.toHaveBeenCalled();
    expect(db.clinic.delete).toHaveBeenCalledWith({ where: { id: 42 } });
  });

  it('sem SMTP a conta nasce confirmada', async () => {
    db.signupCheckout.findUnique.mockResolvedValue(paidCheckout());
    db.signupCheckout.updateMany.mockResolvedValue({ count: 1 });
    const service = createSignupService({ settings, email: makeEmail(false) });
    await expect(service.completeSignup(input())).resolves.toMatchObject({ requiresEmailVerification: false });
    expect(db.authProfile.create.mock.calls[0][0].data.emailVerifiedAt).toBeInstanceOf(Date);
  });
});

describe('Webhook do Mercado Pago', () => {
  const secret = 'chave-local-de-assinatura-0123456789';
  const sign = (id: string, requestId: string, ts = '1764000000') =>
    `ts=${ts},v1=${createHmac('sha256', secret).update(`id:${id};request-id:${requestId};ts:${ts};`).digest('hex')}`;

  it('valida a assinatura pelo manifesto documentado', () => {
    expect(verifyWebhookSignature({ signatureHeader: sign('123', 'req-1'), requestId: 'req-1', dataId: '123', secret })).toBe(true);
    expect(verifyWebhookSignature({ signatureHeader: sign('123', 'req-1'), requestId: 'req-1', dataId: '124', secret })).toBe(false);
    expect(verifyWebhookSignature({ signatureHeader: 'ts=1,v1=zz', requestId: 'req-1', dataId: '123', secret })).toBe(false);
  });

  it('recusa assinatura inválida e só consulta pagamentos com assinatura certa', async () => {
    const service = { handlePaymentNotification: jest.fn().mockResolvedValue('paid') } as any;
    const app = express();
    app.use(express.json());
    app.use('/webhooks/mercadopago', createMercadoPagoWebhookRouter(service, () => ({ accessToken: 'x', webhookSecret: secret, publicBaseUrl: 'https://e.example' })));

    await request(app).post('/webhooks/mercadopago?data.id=555&type=payment').set('x-request-id', 'r1').set('x-signature', sign('556', 'r1')).send({}).expect(401);
    expect(service.handlePaymentNotification).not.toHaveBeenCalled();

    await request(app).post('/webhooks/mercadopago?data.id=555&type=payment').set('x-request-id', 'r1').set('x-signature', sign('555', 'r1')).send({ type: 'payment', data: { id: '555' } }).expect(200);
    expect(service.handlePaymentNotification).toHaveBeenCalledWith('555');
  });
});

describe('Login com e-mail não confirmado', () => {
  it('senha certa mas e-mail pendente recebe 403 com código, sem tokens', async () => {
    const bcrypt = await import('bcrypt');
    const { default: authController } = await import('../controllers/authController');
    db.authProfile.findUnique.mockResolvedValueOnce({
      id: 11, email: 'novo@example.invalid', password: await bcrypt.hash('Cadastro2026xyz', 4), emailVerifiedAt: null,
      user: { id: 3, name: 'N', clinicId: 42, active: true, role: { name: 'DONO' } }, tutor: null,
    });
    const res: any = { status: jest.fn(), json: jest.fn() };
    res.status.mockReturnValue(res);
    await authController.login({ body: { email: 'novo@example.invalid', password: 'Cadastro2026xyz' } } as any, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'EMAIL_NOT_VERIFIED' }));
    expect(JSON.stringify(res.json.mock.calls)).not.toContain('accessToken');
  });
});
