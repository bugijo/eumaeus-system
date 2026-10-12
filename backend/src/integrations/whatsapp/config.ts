import { hasConfigurationPlaceholder } from '../../config/runtimeEnvironment';

export interface WhatsAppLocalConfig {
  mode: 'simulation';
  webhookSecret: string;
  channels?: Record<string, WhatsAppChannelConfig>;
}

export interface WhatsAppChannelConfig {
  clinicId: number;
  verifyToken: string;
  webhookSecret: string;
}

const parseChannels = (value: string | undefined): Record<string, WhatsAppChannelConfig> => {
  if (!value) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('WHATSAPP_LOCAL_CHANNELS_JSON inválido');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('WHATSAPP_LOCAL_CHANNELS_JSON deve ser um objeto');
  }

  const channels: Record<string, WhatsAppChannelConfig> = {};
  for (const [channelId, raw] of Object.entries(parsed)) {
    if (!/^[-_a-zA-Z0-9]{3,128}$/.test(channelId) || !raw || typeof raw !== 'object') {
      throw new Error('Configuração de canal WhatsApp inválida');
    }
    const candidate = raw as Record<string, unknown>;
    const clinicId = Number(candidate.clinicId);
    const verifyToken = candidate.verifyToken;
    const webhookSecret = candidate.webhookSecret;
    if (!Number.isInteger(clinicId) || clinicId <= 0 || typeof verifyToken !== 'string' || typeof webhookSecret !== 'string') {
      throw new Error(`Configuração incompleta para o canal WhatsApp ${channelId}`);
    }
    if (verifyToken.length < 16 || webhookSecret.length < 32 || hasConfigurationPlaceholder(verifyToken) || hasConfigurationPlaceholder(webhookSecret)) {
      throw new Error(`Segredo inválido para o canal WhatsApp ${channelId}`);
    }
    channels[channelId] = { clinicId, verifyToken, webhookSecret };
  }
  return channels;
};

export const loadWhatsAppLocalConfig = (
  environment: NodeJS.ProcessEnv = process.env,
): WhatsAppLocalConfig => {
  const mode = environment.WHATSAPP_MODE?.trim().toLowerCase() || 'simulation';
  const webhookSecret = environment.WHATSAPP_WEBHOOK_SECRET;

  if (mode !== 'simulation') {
    throw new Error('WHATSAPP_MODE deve permanecer simulation nesta etapa');
  }

  if (
    !webhookSecret ||
    webhookSecret.trim() !== webhookSecret ||
    webhookSecret.length < 32 ||
    hasConfigurationPlaceholder(webhookSecret)
  ) {
    throw new Error('WHATSAPP_WEBHOOK_SECRET deve ser um segredo local válido');
  }

  const channels = parseChannels(environment.WHATSAPP_LOCAL_CHANNELS_JSON);
  return Object.keys(channels).length > 0 ? { mode: 'simulation', webhookSecret, channels } : { mode: 'simulation', webhookSecret };
};
