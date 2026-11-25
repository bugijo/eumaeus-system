import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Cliente mínimo do Mercado Pago (Checkout Pro + consulta de pagamento).
 * As credenciais vêm só do ambiente: MP_ACCESS_TOKEN e MP_WEBHOOK_SECRET.
 */
const API_BASE = 'https://api.mercadopago.com';
const TIMEOUT_MS = 10_000;

export type MercadoPagoSettings = { accessToken: string; webhookSecret: string; publicBaseUrl: string };

export const loadMercadoPagoSettings = (environment: NodeJS.ProcessEnv = process.env): MercadoPagoSettings => ({
  accessToken: environment.MP_ACCESS_TOKEN?.trim() || '',
  webhookSecret: environment.MP_WEBHOOK_SECRET?.trim() || '',
  publicBaseUrl: (environment.PUBLIC_BASE_URL?.trim() || 'https://eumaeus.com.br').replace(/\/+$/, ''),
});

export class MercadoPagoError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'MercadoPagoError';
  }
}

export type MercadoPagoPayment = {
  id: number | string;
  status: string;
  status_detail?: string;
  external_reference?: string | null;
  transaction_amount?: number;
  currency_id?: string;
  date_approved?: string | null;
};

type Fetcher = typeof fetch;

const call = async <T>(fetcher: Fetcher, accessToken: string, path: string, init: RequestInit = {}): Promise<T> => {
  if (!accessToken) throw new MercadoPagoError('MP_ACCESS_TOKEN não configurado');
  let response: Response;
  try {
    response = await fetcher(`${API_BASE}${path}`, {
      ...init,
      headers: { ...(init.headers || {}), Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new MercadoPagoError('Mercado Pago indisponível');
  }
  if (!response.ok) throw new MercadoPagoError(`Mercado Pago respondeu ${response.status}`, response.status);
  return response.json() as Promise<T>;
};

export const createMercadoPagoClient = (settings: MercadoPagoSettings, fetcher: Fetcher = fetch) => ({
  createPreference: (body: Record<string, unknown>, idempotencyKey: string) =>
    call<{ id: string; init_point: string }>(fetcher, settings.accessToken, '/checkout/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Idempotency-Key': idempotencyKey },
      body: JSON.stringify(body),
    }),

  getPayment: (paymentId: string) => {
    if (!/^\d{1,20}$/.test(paymentId)) throw new MercadoPagoError('Identificador de pagamento inválido');
    return call<MercadoPagoPayment>(fetcher, settings.accessToken, `/v1/payments/${paymentId}`);
  },

  searchPaymentsByReference: async (externalReference: string) => {
    const query = new URLSearchParams({ external_reference: externalReference, sort: 'date_created', criteria: 'desc' });
    const result = await call<{ results?: MercadoPagoPayment[] }>(fetcher, settings.accessToken, `/v1/payments/search?${query}`);
    return result.results || [];
  },
});

export type MercadoPagoClient = ReturnType<typeof createMercadoPagoClient>;

/**
 * Valida o cabeçalho x-signature das notificações (HMAC-SHA256 com a chave secreta do webhook).
 * Manifesto conforme a documentação: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
 */
export const verifyWebhookSignature = (input: {
  signatureHeader?: string;
  requestId?: string;
  dataId?: string;
  secret: string;
}): boolean => {
  if (!input.secret || !input.signatureHeader) return false;
  const parts = Object.fromEntries(
    input.signatureHeader.split(',').map((part) => {
      const [key, ...value] = part.split('=');
      return [key.trim(), value.join('=').trim()];
    }),
  );
  const ts = parts.ts;
  const received = parts.v1;
  if (!ts || !received || !/^[0-9a-f]{64}$/i.test(received)) return false;

  const id = input.dataId ? (/^[a-z0-9]+$/i.test(input.dataId) ? input.dataId.toLowerCase() : input.dataId) : '';
  const manifest = `${id ? `id:${id};` : ''}${input.requestId ? `request-id:${input.requestId};` : ''}ts:${ts};`;
  const expected = createHmac('sha256', input.secret).update(manifest).digest('hex');
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(received.toLowerCase(), 'hex'));
};
