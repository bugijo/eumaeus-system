import { Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { WhatsAppChannelConfig } from '../integrations/whatsapp/config';

export interface WhatsAppWebhookStore {
  findTutorByPhone(clinicId: number, phone: string): Promise<{ id: number } | null>;
  findExistingEvent(clinicId: number, dedupeKey: string): Promise<{ id: number } | null>;
  persistInboundEvent(input: {
    clinicId: number;
    tutorId: number;
    dedupeKey: string;
    eventType: string;
    payload: Record<string, unknown>;
  }): Promise<{ id: number }>;
}

export interface WhatsAppWebhookDependencies {
  channels: Record<string, WhatsAppChannelConfig>;
  store: WhatsAppWebhookStore;
}

const rawBody = (req: Request): Buffer | null => {
  if (Buffer.isBuffer(req.body)) return req.body;
  return null;
};

const validSignature = (body: Buffer, value: string | undefined, secret: string): boolean => {
  if (!value || !/^sha256=[0-9a-f]{64}$/.test(value)) return false;
  const expected = Buffer.from(`sha256=${createHmac('sha256', secret).update(body).digest('hex')}`);
  const received = Buffer.from(value);
  return expected.length === received.length && timingSafeEqual(expected, received);
};

const stringValue = (value: unknown): string => typeof value === 'string' ? value : '';

const extractEvent = (candidate: Record<string, unknown>): { id: string; type: string; phone: string; payload: Record<string, unknown> } | null => {
  const directId = stringValue(candidate.id);
  const directType = stringValue(candidate.type);
  const directPayload = candidate.payload;
  if (directId && directType && directPayload && typeof directPayload === 'object' && !Array.isArray(directPayload)) {
    const payload = directPayload as Record<string, unknown>;
    return { id: directId, type: directType, phone: stringValue(payload.from), payload };
  }

  const entries = Array.isArray(candidate.entry) ? candidate.entry : [];
  const entry = entries[0];
  if (!entry || typeof entry !== 'object') return null;
  const changes: unknown[] = Array.isArray((entry as Record<string, unknown>).changes) ? (entry as Record<string, unknown>).changes as unknown[] : [];
  const change = changes[0];
  if (!change || typeof change !== 'object') return null;
  const value = (change as Record<string, unknown>).value;
  if (!value || typeof value !== 'object') return null;
  const valueRecord = value as Record<string, unknown>;
  const messages = Array.isArray(valueRecord.messages) ? valueRecord.messages : [];
  const statuses = Array.isArray(valueRecord.statuses) ? valueRecord.statuses : [];
  const item = messages[0] || statuses[0];
  if (!item || typeof item !== 'object') return null;
  const itemRecord = item as Record<string, unknown>;
  const id = stringValue(itemRecord.id);
  const type = messages[0] ? `message.${stringValue(itemRecord.type) || 'unknown'}` : `status.${stringValue(itemRecord.status) || 'unknown'}`;
  if (!id || !type) return null;
  return { id, type, phone: stringValue(itemRecord.from || itemRecord.recipient_id), payload: itemRecord };
};

export const createWhatsAppWebhookController = ({ channels, store }: WhatsAppWebhookDependencies) => ({
  handshake(req: Request, res: Response) {
    const channel = channels[String(req.params.channelId)];
    const mode = String(req.query['hub.mode'] || '');
    const token = String(req.query['hub.verify_token'] || '');
    const challenge = String(req.query['hub.challenge'] || '');
    if (!channel || mode !== 'subscribe' || token !== channel.verifyToken || !challenge) {
      return res.sendStatus(403);
    }
    return res.status(200).type('text/plain').send(challenge);
  },

  async receive(req: Request, res: Response) {
    const channel = channels[String(req.params.channelId)];
    const body = rawBody(req);
    if (!channel) return res.status(404).json({ error: 'Canal WhatsApp não configurado' });
    if (!body) return res.status(415).json({ error: 'O webhook exige corpo JSON bruto' });
    if (!validSignature(body, req.header('x-hub-signature-256'), channel.webhookSecret)) {
      return res.status(401).json({ error: 'Assinatura de webhook inválida' });
    }

    let parsed: unknown;
    try { parsed = JSON.parse(body.toString('utf8')); } catch { return res.status(400).json({ error: 'Payload de webhook inválido' }); }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return res.status(400).json({ error: 'Payload de webhook inválido' });
    const event = extractEvent(parsed as Record<string, unknown>);
    if (!event) return res.status(400).json({ error: 'Evento WhatsApp inválido' });

    try {
      const dedupeKey = `whatsapp:inbound:${req.params.channelId}:${event.id}`;
      const existing = await store.findExistingEvent(channel.clinicId, dedupeKey);
      if (existing) return res.status(200).json({ accepted: true, duplicate: true, eventId: event.id, outboxId: existing.id });
      if (!event.phone) return res.status(422).json({ error: 'Evento sem identificador de contato' });
      const tutor = await store.findTutorByPhone(channel.clinicId, event.phone);
      if (!tutor) return res.status(422).json({ error: 'Contato não associado ao canal configurado' });

      const persisted = await store.persistInboundEvent({ clinicId: channel.clinicId, tutorId: tutor.id, dedupeKey, eventType: `WHATSAPP_INBOUND_${event.type}`, payload: { channelId: req.params.channelId, eventId: event.id, type: event.type, source: event.payload, statePolicy: 'append-only-no-regression' } });
      return res.status(200).json({ accepted: true, duplicate: false, eventId: event.id, outboxId: persisted.id, mode: 'simulation' });
    } catch {
      return res.status(503).json({ error: 'Persistência do webhook indisponível' });
    }
  },
});
