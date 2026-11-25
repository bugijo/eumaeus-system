import bcrypt from 'bcrypt';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { prisma } from '../lib/prisma';
import { runWithClinic } from '../tenantContext';
import { emailService as defaultEmailService } from './emailService';
import { UserServiceError, validateStaffPassword } from './user.service';
import {
  MercadoPagoClient,
  MercadoPagoPayment,
  MercadoPagoSettings,
  createMercadoPagoClient,
  loadMercadoPagoSettings,
} from '../integrations/mercadopago/client';

/** Preços em centavos. O valor cobrado sai daqui, nunca do navegador. */
export const PLAN_PRICES = {
  PETSHOP: { name: 'Pet Shop', promoCents: 7900, fullCents: 9900 },
  CLINICA: { name: 'Clínica', promoCents: 12900, fullCents: 14900 },
  CLINICA_PETSHOP: { name: 'Clínica + Pet Shop', promoCents: 14900, fullCents: 19900 },
} as const;
export type SignupPlan = keyof typeof PLAN_PRICES;

const OWNER_ROLE = 'DONO';
const VERIFICATION_TTL_MS = 48 * 60 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FAILED_STATUSES = new Set(['rejected', 'cancelled']);

export class SignupError extends Error {
  constructor(message: string, public readonly status = 400, public readonly code?: string) {
    super(message);
    this.name = 'SignupError';
  }
}

export const hashSecret = (value: string) => createHash('sha256').update(value).digest('hex');
const newSecret = () => randomBytes(32).toString('base64url');
const sameHash = (a: string | null | undefined, b: string) =>
  Boolean(a) && a!.length === b.length && timingSafeEqual(Buffer.from(a!), Buffer.from(b));

const normalizeEmail = (value: unknown) => String(value ?? '').trim().toLowerCase();
const isEmail = (value: string) => value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
const cleanText = (value: unknown, label: string, min = 2, max = 120) => {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (text.length < min || text.length > max || /[\0<>]/.test(text)) {
    throw new SignupError(`${label} deve ter entre ${min} e ${max} caracteres`);
  }
  return text;
};
const parsePlan = (value: unknown): SignupPlan => {
  const plan = String(value ?? '').trim().toUpperCase();
  if (!(plan in PLAN_PRICES)) throw new SignupError('Plano inválido');
  return plan as SignupPlan;
};

type EmailSender = Pick<typeof defaultEmailService, 'isConfigured' | 'sendSignupLink' | 'sendEmailVerification'>;

export type SignupServiceDeps = {
  settings?: () => MercadoPagoSettings;
  mercadoPago?: (settings: MercadoPagoSettings) => MercadoPagoClient;
  email?: EmailSender;
  now?: () => Date;
};

export const createSignupService = (deps: SignupServiceDeps = {}) => {
  const settings = deps.settings ?? (() => loadMercadoPagoSettings());
  const mercadoPago = deps.mercadoPago ?? ((s: MercadoPagoSettings) => createMercadoPagoClient(s));
  const email = deps.email ?? defaultEmailService;
  const now = deps.now ?? (() => new Date());
  const db = prisma as any;

  const findAuthorizedCheckout = async (checkoutId: unknown, token: unknown) => {
    const id = String(checkoutId ?? '');
    const secret = String(token ?? '');
    if (!UUID.test(id) || secret.length < 20 || secret.length > 200) throw new SignupError('Contratação não encontrada', 404);
    const checkout = await db.signupCheckout.findUnique({ where: { id } });
    const hashed = hashSecret(secret);
    if (!checkout || !(sameHash(checkout.browserTokenHash, hashed) || sameHash(checkout.emailTokenHash, hashed))) {
      throw new SignupError('Contratação não encontrada', 404);
    }
    return checkout;
  };

  /** Aplica um pagamento consultado na API ao checkout correspondente. Idempotente. */
  const applyPayment = async (payment: MercadoPagoPayment): Promise<string> => {
    const reference = String(payment.external_reference ?? '');
    if (!UUID.test(reference)) return 'ignored';
    const checkout = await db.signupCheckout.findUnique({ where: { id: reference } });
    if (!checkout) return 'ignored';

    const paidCents = Math.round(Number(payment.transaction_amount) * 100);
    if (payment.currency_id !== 'BRL' || paidCents !== checkout.amountCents) {
      console.warn(`Pagamento ${payment.id} com valor divergente do checkout ${checkout.id}; ignorado.`);
      return 'amount-mismatch';
    }

    if (payment.status === 'approved') {
      const emailToken = newSecret();
      const updated = await db.signupCheckout.updateMany({
        where: { id: checkout.id, status: { in: ['PENDING', 'REJECTED'] } },
        data: {
          status: 'PAID',
          paidAt: payment.date_approved ? new Date(payment.date_approved) : now(),
          mpPaymentId: String(payment.id),
          mpPaymentStatus: payment.status,
          emailTokenHash: hashSecret(emailToken),
        },
      });
      if (updated.count === 1) {
        const link = `${settings().publicBaseUrl}/cadastro?checkout=${checkout.id}&token=${emailToken}`;
        await email.sendSignupLink(checkout.contactEmail, { planName: PLAN_PRICES[checkout.plan as SignupPlan]?.name ?? checkout.plan, link })
          .catch(() => false);
      } else if (checkout.mpPaymentId && checkout.mpPaymentId !== String(payment.id)) {
        console.warn(`Checkout ${checkout.id} recebeu um segundo pagamento aprovado (${payment.id}); avaliar estorno.`);
      }
      return 'paid';
    }

    if (FAILED_STATUSES.has(payment.status)) {
      await db.signupCheckout.updateMany({
        where: { id: checkout.id, status: 'PENDING' },
        data: { status: 'REJECTED', mpPaymentStatus: payment.status },
      });
      return 'rejected';
    }

    await db.signupCheckout.updateMany({
      where: { id: checkout.id, status: 'PENDING' },
      data: { mpPaymentStatus: payment.status },
    });
    return 'pending';
  };

  return {
    /** Cria o checkout e a preferência no Mercado Pago. Devolve o segredo do navegador e o link de pagamento. */
    async createCheckout(input: { plan: unknown; email: unknown }) {
      const plan = parsePlan(input.plan);
      const contactEmail = normalizeEmail(input.email);
      if (!isEmail(contactEmail)) throw new SignupError('Informe um e-mail válido');

      const current = settings();
      if (!current.accessToken) {
        throw new SignupError('Contratação online indisponível no momento. Fale com a equipe pelo WhatsApp.', 503, 'CHECKOUT_DISABLED');
      }

      const price = PLAN_PRICES[plan];
      const browserToken = newSecret();
      const checkout = await db.signupCheckout.create({
        data: { plan, amountCents: price.promoCents, contactEmail, browserTokenHash: hashSecret(browserToken) },
        select: { id: true },
      });

      // O token vai no retorno: no celular o Mercado Pago pode devolver o cliente em outro navegador
      // (sem o localStorage da compra). Ele só consulta esta contratação e cria a conta uma vez.
      const returnUrl = `${current.publicBaseUrl}/assinar/retorno?checkout=${checkout.id}&token=${browserToken}`;
      const preference: Record<string, unknown> = {
        items: [{
          id: `eumaeus-${plan.toLowerCase()}`,
          title: `Eumaeus - Plano ${price.name} (1º mês promocional)`,
          quantity: 1,
          currency_id: 'BRL',
          unit_price: price.promoCents / 100,
        }],
        payer: { email: contactEmail },
        external_reference: checkout.id,
        back_urls: { success: returnUrl, pending: returnUrl, failure: returnUrl },
        auto_return: 'approved',
        statement_descriptor: 'EUMAEUS',
      };
      // O Mercado Pago só aceita notificação em endereço público com HTTPS.
      if (current.publicBaseUrl.startsWith('https://')) {
        preference.notification_url = `${current.publicBaseUrl}/webhooks/mercadopago`;
      }

      let created: { id: string; init_point: string };
      try {
        created = await mercadoPago(current).createPreference(preference, checkout.id);
      } catch {
        throw new SignupError('Não foi possível iniciar o pagamento. Tente de novo em instantes.', 502, 'CHECKOUT_FAILED');
      }
      await db.signupCheckout.update({ where: { id: checkout.id }, data: { mpPreferenceId: String(created.id) } });
      return { checkoutId: checkout.id, token: browserToken, redirectUrl: created.init_point };
    },

    /** Notificação do webhook: sempre consulta o pagamento na API antes de mudar qualquer coisa. */
    async handlePaymentNotification(paymentId: string) {
      const payment = await mercadoPago(settings()).getPayment(paymentId);
      return applyPayment(payment);
    },

    applyPayment,

    /** Situação do checkout para a tela de retorno. Sem webhook, consulta a API pelo external_reference. */
    async getCheckoutStatus(input: { checkoutId: unknown; token: unknown }) {
      let checkout = await findAuthorizedCheckout(input.checkoutId, input.token);
      if (checkout.status === 'PENDING' && settings().accessToken) {
        try {
          const payments = await mercadoPago(settings()).searchPaymentsByReference(checkout.id);
          const best = payments.find((p) => p.status === 'approved') ?? payments[0];
          if (best) {
            await applyPayment(best);
            checkout = await db.signupCheckout.findUnique({ where: { id: checkout.id } });
          }
        } catch { /* consulta opcional: segue com o estado salvo */ }
      }
      const price = PLAN_PRICES[checkout.plan as SignupPlan];
      return {
        status: checkout.status as string,
        plan: checkout.plan as string,
        planName: price?.name ?? checkout.plan,
        amountCents: checkout.amountCents as number,
        fullPriceCents: price?.fullCents ?? null,
        contactEmail: checkout.contactEmail as string,
      };
    },

    /** Cria estabelecimento, dono e configurações a partir de um checkout pago. Uso único. */
    async completeSignup(input: {
      checkoutId: unknown; token: unknown; clinicName: unknown; ownerName: unknown;
      email: unknown; password: unknown; document?: unknown;
    }) {
      const clinicName = cleanText(input.clinicName, 'Nome do estabelecimento');
      const ownerName = cleanText(input.ownerName, 'Nome do responsável');
      const ownerEmail = normalizeEmail(input.email);
      if (!isEmail(ownerEmail)) throw new SignupError('Informe um e-mail válido');
      const rawDocument = String(input.document ?? '').replace(/\D/g, '');
      if (rawDocument && rawDocument.length !== 11 && rawDocument.length !== 14) throw new SignupError('CPF ou CNPJ inválido');
      const password = String(input.password ?? '');
      try {
        validateStaffPassword(password, ownerEmail);
      } catch (error) {
        if (error instanceof UserServiceError) throw new SignupError(error.message);
        throw error;
      }

      const checkout = await findAuthorizedCheckout(input.checkoutId, input.token);
      if (checkout.status === 'COMPLETED') throw new SignupError('Esta contratação já tem conta criada. Entre pelo login.', 409, 'ALREADY_COMPLETED');
      if (checkout.status !== 'PAID') throw new SignupError('O pagamento ainda não foi confirmado.', 409, 'NOT_PAID');

      const existing = await db.authProfile.findUnique({ where: { email: ownerEmail }, select: { id: true } });
      if (existing) throw new SignupError('Já existe uma conta com este e-mail. Use outro ou entre pelo login.', 409, 'EMAIL_IN_USE');

      const passwordHash = await bcrypt.hash(password, 12);
      const requiresVerification = email.isConfigured();
      const verificationToken = requiresVerification ? newSecret() : null;
      const plan = checkout.plan as SignupPlan;

      const clinic = await db.clinic.create({ data: { name: clinicName }, select: { id: true } });
      try {
        await runWithClinic(clinic.id, () => db.$transaction(async (tx: any) => {
          const claimed = await tx.signupCheckout.updateMany({
            where: { id: checkout.id, status: 'PAID' },
            data: { status: 'COMPLETED', completedAt: now(), clinicId: clinic.id },
          });
          if (claimed.count !== 1) throw new SignupError('Esta contratação já tem conta criada. Entre pelo login.', 409, 'ALREADY_COMPLETED');

          await tx.role.upsert({
            where: { name: OWNER_ROLE },
            update: {},
            create: { name: OWNER_ROLE, description: 'Acesso total ao sistema.' },
          });
          const authProfile = await tx.authProfile.create({
            data: {
              email: ownerEmail,
              password: passwordHash,
              emailVerifiedAt: requiresVerification ? null : now(),
              emailVerificationTokenHash: verificationToken ? hashSecret(verificationToken) : null,
              emailVerificationExpiresAt: verificationToken ? new Date(now().getTime() + VERIFICATION_TTL_MS) : null,
            },
            select: { id: true },
          });
          await tx.user.create({ data: { name: ownerName, roleName: OWNER_ROLE, authProfileId: authProfile.id } });
          await tx.clinicSettings.create({
            data: {
              plan,
              separateUnits: plan === 'CLINICA_PETSHOP',
              clinicName,
              clinicEmail: ownerEmail,
              clinicDocument: rawDocument || null,
              clinicPhone: '',
              clinicAddress: '',
              emailFromName: clinicName,
            },
          });
        }, { isolationLevel: 'Serializable' }));
      } catch (error) {
        await db.clinic.delete({ where: { id: clinic.id } }).catch(() => undefined);
        if ((error as { code?: string })?.code === 'P2002') {
          throw new SignupError('Já existe uma conta com este e-mail. Use outro ou entre pelo login.', 409, 'EMAIL_IN_USE');
        }
        throw error;
      }

      if (verificationToken) {
        const link = `${settings().publicBaseUrl}/confirmar-email?token=${verificationToken}`;
        await email.sendEmailVerification(ownerEmail, { name: ownerName, link }).catch(() => false);
      }
      return { email: ownerEmail, requiresEmailVerification: requiresVerification };
    },

    async verifyEmail(token: unknown) {
      const secret = String(token ?? '');
      if (secret.length < 20 || secret.length > 200) throw new SignupError('Link inválido ou vencido', 400, 'INVALID_TOKEN');
      const profile = await db.authProfile.findFirst({
        where: { emailVerificationTokenHash: hashSecret(secret) },
        select: { id: true, emailVerificationExpiresAt: true },
      });
      if (!profile || !profile.emailVerificationExpiresAt || profile.emailVerificationExpiresAt < now()) {
        throw new SignupError('Link inválido ou vencido', 400, 'INVALID_TOKEN');
      }
      await db.authProfile.update({
        where: { id: profile.id },
        data: { emailVerifiedAt: now(), emailVerificationTokenHash: null, emailVerificationExpiresAt: null },
      });
      return { verified: true };
    },

    /** Reenvia o link. Resposta sempre igual para não revelar quais e-mails têm conta. */
    async resendVerification(rawEmail: unknown) {
      const ownerEmail = normalizeEmail(rawEmail);
      if (!isEmail(ownerEmail) || !email.isConfigured()) return { sent: true };
      const profile = await db.authProfile.findUnique({
        where: { email: ownerEmail },
        select: { id: true, emailVerifiedAt: true, user: { select: { name: true } } },
      });
      if (!profile || profile.emailVerifiedAt) return { sent: true };
      const token = newSecret();
      await db.authProfile.update({
        where: { id: profile.id },
        data: { emailVerificationTokenHash: hashSecret(token), emailVerificationExpiresAt: new Date(now().getTime() + VERIFICATION_TTL_MS) },
      });
      const link = `${settings().publicBaseUrl}/confirmar-email?token=${token}`;
      await email.sendEmailVerification(ownerEmail, { name: profile.user?.name ?? '', link }).catch(() => false);
      return { sent: true };
    },
  };
};

export const signupService = createSignupService();
