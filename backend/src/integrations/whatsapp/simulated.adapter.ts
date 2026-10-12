import { WhatsAppLocalConfig } from './config';
import { WhatsAppEventDeduplicator } from './dedupe';
import {
  WhatsAppDelivery,
  WhatsAppOutboundMessage,
  WhatsAppProvider,
  WhatsAppWebhookEvent,
} from './types';
import { verifyWhatsAppWebhookSignature } from './signature';

const now = (): string => new Date().toISOString();

export class SimulatedWhatsAppProvider implements WhatsAppProvider {
  private readonly deliveries = new Map<string, WhatsAppDelivery>();

  constructor(private readonly config: WhatsAppLocalConfig) {}

  async send(message: WhatsAppOutboundMessage): Promise<WhatsAppDelivery> {
    if (this.config.mode !== 'simulation') {
      throw new Error('O adapter local só pode operar em modo simulation');
    }

    const existing = this.deliveries.get(message.eventId);
    if (existing) {
      return { ...existing };
    }

    const delivery: WhatsAppDelivery = {
      eventId: message.eventId,
      state: 'accepted',
      acceptedAt: now(),
    };
    this.deliveries.set(message.eventId, delivery);
    return { ...delivery };
  }

  markDelivered(eventId: string): WhatsAppDelivery {
    const delivery = this.requireDelivery(eventId);
    const updated: WhatsAppDelivery = {
      ...delivery,
      state: 'delivered',
      deliveredAt: now(),
      failedAt: undefined,
      failureReason: undefined,
    };
    this.deliveries.set(eventId, updated);
    return { ...updated };
  }

  markFailed(eventId: string, failureReason: string): WhatsAppDelivery {
    if (!failureReason.trim()) {
      throw new Error('failureReason é obrigatório');
    }

    const delivery = this.requireDelivery(eventId);
    const updated: WhatsAppDelivery = {
      ...delivery,
      state: 'failed',
      failedAt: now(),
      failureReason,
      deliveredAt: undefined,
    };
    this.deliveries.set(eventId, updated);
    return { ...updated };
  }

  getDelivery(eventId: string): WhatsAppDelivery | undefined {
    const delivery = this.deliveries.get(eventId);
    return delivery ? { ...delivery } : undefined;
  }

  private requireDelivery(eventId: string): WhatsAppDelivery {
    const delivery = this.deliveries.get(eventId);
    if (!delivery) {
      throw new Error('Mensagem simulada não encontrada');
    }
    return delivery;
  }
}

export class SimulatedWhatsAppWebhookReceiver {
  constructor(
    private readonly config: WhatsAppLocalConfig,
    private readonly deduplicator = new WhatsAppEventDeduplicator(),
  ) {}

  receive(rawBody: string | Buffer, signature: string | undefined):
    | { accepted: true; duplicate: false; event: WhatsAppWebhookEvent }
    | { accepted: true; duplicate: true; eventId: string } {
    if (!verifyWhatsAppWebhookSignature(rawBody, signature, this.config.webhookSecret)) {
      throw new Error('Assinatura de webhook inválida');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody.toString('utf8'));
    } catch {
      throw new Error('Payload de webhook inválido');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Payload de webhook inválido');
    }

    const candidate = parsed as Record<string, unknown>;
    const id = typeof candidate.id === 'string' ? candidate.id : '';
    const type = typeof candidate.type === 'string' ? candidate.type : '';
    const payload = candidate.payload;
    if (!id || !type || !payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new Error('Webhook exige id, type e payload');
    }

    if (!this.deduplicator.claim(id)) {
      return { accepted: true, duplicate: true, eventId: id };
    }

    return {
      accepted: true,
      duplicate: false,
      event: { id, type, payload: payload as Record<string, unknown> },
    };
  }
}
