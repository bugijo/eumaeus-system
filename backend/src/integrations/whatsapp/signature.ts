import { createHmac, timingSafeEqual } from 'node:crypto';

export const createWhatsAppWebhookSignature = (rawBody: string | Buffer, secret: string): string =>
  `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;

export const verifyWhatsAppWebhookSignature = (
  rawBody: string | Buffer,
  signature: string | undefined,
  secret: string,
): boolean => {
  if (!signature || !/^sha256=[0-9a-f]{64}$/.test(signature)) {
    return false;
  }

  const expected = Buffer.from(createWhatsAppWebhookSignature(rawBody, secret), 'utf8');
  const received = Buffer.from(signature, 'utf8');

  return expected.length === received.length && timingSafeEqual(expected, received);
};
