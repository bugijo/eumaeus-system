export type WhatsAppDeliveryState = 'accepted' | 'delivered' | 'failed';

export interface WhatsAppOutboundMessage {
  eventId: string;
  recipient: string;
  body: string;
}

export interface WhatsAppDelivery {
  eventId: string;
  state: WhatsAppDeliveryState;
  acceptedAt: string;
  deliveredAt?: string;
  failedAt?: string;
  failureReason?: string;
}

export interface WhatsAppProvider {
  send(message: WhatsAppOutboundMessage): Promise<WhatsAppDelivery>;
}

export interface WhatsAppWebhookEvent {
  id: string;
  type: string;
  payload: Record<string, unknown>;
}
