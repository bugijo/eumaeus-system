import { hasConfigurationPlaceholder } from '../../config/runtimeEnvironment';

export interface WhatsAppLocalConfig {
  mode: 'simulation';
  webhookSecret: string;
}

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

  return { mode: 'simulation', webhookSecret };
};
