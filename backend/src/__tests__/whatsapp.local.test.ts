import {
  createWhatsAppWebhookSignature,
  loadWhatsAppLocalConfig,
  SimulatedWhatsAppProvider,
  SimulatedWhatsAppWebhookReceiver,
} from '../integrations/whatsapp';

const SECRET = 'local-whatsapp-signing-value-for-tests-9f4d7c2a8b6e1d3f';

describe('WhatsApp local simulation', () => {
  it('requires simulation mode and a non-placeholder webhook secret', () => {
    expect(() => loadWhatsAppLocalConfig({ WHATSAPP_MODE: 'cloud' })).toThrow(
      'simulation',
    );
    expect(() => loadWhatsAppLocalConfig({ WHATSAPP_WEBHOOK_SECRET: 'placeholder-secret' })).toThrow(
      'WHATSAPP_WEBHOOK_SECRET',
    );

    expect(loadWhatsAppLocalConfig({ WHATSAPP_WEBHOOK_SECRET: SECRET })).toEqual({
      mode: 'simulation',
      webhookSecret: SECRET,
    });
  });

  it('accepts, delivers and fails without making an external request', async () => {
    const provider = new SimulatedWhatsAppProvider({ mode: 'simulation', webhookSecret: SECRET });
    const accepted = await provider.send({
      eventId: 'outbox-1',
      recipient: '+5500000000000',
      body: 'Mensagem sintética',
    });

    expect(accepted.state).toBe('accepted');
    expect(provider.markDelivered('outbox-1').state).toBe('delivered');
    expect(provider.markFailed('outbox-1', 'falha sintética').state).toBe('failed');
    expect(provider.getDelivery('outbox-1')?.failureReason).toBe('falha sintética');
  });

  it('deduplicates outbound events and webhook events', async () => {
    const provider = new SimulatedWhatsAppProvider({ mode: 'simulation', webhookSecret: SECRET });
    const first = await provider.send({ eventId: 'outbox-2', recipient: 'synthetic', body: 'x' });
    const second = await provider.send({ eventId: 'outbox-2', recipient: 'synthetic', body: 'changed' });
    expect(second).toEqual(first);

    const receiver = new SimulatedWhatsAppWebhookReceiver({ mode: 'simulation', webhookSecret: SECRET });
    const raw = JSON.stringify({ id: 'webhook-1', type: 'message.status', payload: { status: 'delivered' } });
    const signature = createWhatsAppWebhookSignature(raw, SECRET);
    expect(receiver.receive(raw, signature).duplicate).toBe(false);
    expect(receiver.receive(raw, signature)).toEqual({ accepted: true, duplicate: true, eventId: 'webhook-1' });
  });

  it('rejects tampered, malformed and unsigned webhooks', () => {
    const receiver = new SimulatedWhatsAppWebhookReceiver({ mode: 'simulation', webhookSecret: SECRET });
    const raw = JSON.stringify({ id: 'webhook-2', type: 'message', payload: {} });
    expect(() => receiver.receive(raw, undefined)).toThrow('Assinatura');
    expect(() => receiver.receive(`${raw}x`, createWhatsAppWebhookSignature(raw, SECRET))).toThrow('Assinatura');
    expect(() => receiver.receive('not-json', createWhatsAppWebhookSignature('not-json', SECRET))).toThrow('Payload');
  });
});
