import express, { Router } from 'express';
import { createWhatsAppWebhookController, WhatsAppWebhookDependencies } from '../controllers/whatsappWebhook.controller';

/**
 * Mount this router before express.json(). The raw parser is intentional:
 * Meta signs the original request bytes, not a re-serialized JSON object.
 */
export const createWhatsAppWebhookRouter = (dependencies: WhatsAppWebhookDependencies): Router => {
  const router = Router();
  const controller = createWhatsAppWebhookController(dependencies);
  router.get('/:channelId', controller.handshake);
  router.post('/:channelId', express.raw({ type: 'application/json', limit: '1mb' }), controller.receive);
  return router;
};

export default createWhatsAppWebhookRouter;
