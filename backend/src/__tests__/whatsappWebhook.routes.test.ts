import express from 'express';
import request from 'supertest';
import { createHmac } from 'node:crypto';
import { createWhatsAppWebhookRouter } from '../routes/whatsappWebhook.routes';
import { WhatsAppWebhookStore } from '../controllers/whatsappWebhook.controller';

const secret = 'local-channel-secret-abcdefghijklmnopqrstuvwxyz-123';
const verifyToken = 'local-verify-token-123456';
const channels = { 'phone-local-1': { clinicId: 11, verifyToken, webhookSecret: secret } };

const sign = (body: Buffer) => `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
const build = (store: WhatsAppWebhookStore) => {
  const app = express();
  app.use('/webhooks/whatsapp', createWhatsAppWebhookRouter({ channels, store }));
  return app;
};

const newStore = (overrides: Partial<WhatsAppWebhookStore> = {}): WhatsAppWebhookStore => ({
  findTutorByPhone: jest.fn().mockResolvedValue({ id: 90 }),
  findExistingEvent: jest.fn().mockResolvedValue(null),
  persistInboundEvent: jest.fn().mockResolvedValue({ id: 501 }),
  ...overrides,
});

describe('WhatsApp local webhook contract', () => {
  it('responds to the Meta subscribe handshake only for the configured channel', async () => {
    const app = build(newStore());
    await request(app).get('/webhooks/whatsapp/phone-local-1').query({ 'hub.mode': 'subscribe', 'hub.verify_token': verifyToken, 'hub.challenge': 'challenge-1' }).expect(200, 'challenge-1');
    await request(app).get('/webhooks/whatsapp/unknown').query({ 'hub.mode': 'subscribe', 'hub.verify_token': verifyToken, 'hub.challenge': 'challenge-1' }).expect(403);
  });

  it('verifies the HMAC over raw bytes and persists a synthetic inbound event', async () => {
    const store = newStore();
    const app = build(store);
    const body = Buffer.from('{"id":"evt-1","type":"message","payload":{"from":"5511999999999","text":"oi"}}');
    await request(app).post('/webhooks/whatsapp/phone-local-1').set('Content-Type', 'application/json').set('X-Hub-Signature-256', sign(body)).send(body.toString('utf8')).expect(200);
    expect(store.persistInboundEvent).toHaveBeenCalledWith(expect.objectContaining({ clinicId: 11, tutorId: 90, dedupeKey: 'whatsapp:inbound:phone-local-1:evt-1' }));
  });

  it('rejects invalid signatures and unknown contacts without persistence', async () => {
    const store = newStore({ findTutorByPhone: jest.fn().mockResolvedValue(null) });
    const app = build(store);
    const body = Buffer.from('{"id":"evt-2","type":"message","payload":{"from":"5511888888888"}}');
    await request(app).post('/webhooks/whatsapp/phone-local-1').set('Content-Type', 'application/json').set('X-Hub-Signature-256', 'sha256=bad').send(body.toString('utf8')).expect(401);
    await request(app).post('/webhooks/whatsapp/phone-local-1').set('Content-Type', 'application/json').set('X-Hub-Signature-256', sign(body)).send(body.toString('utf8')).expect(422);
    expect(store.persistInboundEvent).not.toHaveBeenCalled();
  });

  it('returns the durable dedupe result and does not regress append-only state', async () => {
    const store = newStore({ findExistingEvent: jest.fn().mockResolvedValue({ id: 777 }) });
    const app = build(store);
    const body = Buffer.from('{"id":"evt-3","type":"status.delivered","payload":{"from":"5511999999999","status":"delivered"}}');
    await request(app).post('/webhooks/whatsapp/phone-local-1').set('Content-Type', 'application/json').set('X-Hub-Signature-256', sign(body)).send(body.toString('utf8')).expect(200).expect(({ body: response }) => {
      expect(response).toMatchObject({ duplicate: true, inboundEventId: 777 });
    });
    expect(store.persistInboundEvent).not.toHaveBeenCalled();
  });

  it('does not acknowledge a persistence failure', async () => {
    const store = newStore({ persistInboundEvent: jest.fn().mockRejectedValue(new Error('falha sintética de banco')) });
    const app = build(store);
    const body = Buffer.from('{"id":"evt-4","type":"message","payload":{"from":"5511999999999"}}');
    await request(app).post('/webhooks/whatsapp/phone-local-1').set('Content-Type', 'application/json').set('X-Hub-Signature-256', sign(body)).send(body.toString('utf8')).expect(503);
  });
});
