import { Router, Request, Response } from 'express';
import { SignupError, signupService as defaultService } from '../services/signup.service';
import { MercadoPagoError, isPreapprovalId, loadMercadoPagoSettings, verifyWebhookSignature } from '../integrations/mercadopago/client';
import { billingService as defaultBilling } from '../services/billing.service';

type Service = typeof defaultService;
type Billing = Pick<typeof defaultBilling, 'handlePreapprovalNotification' | 'handleAuthorizedPaymentNotification'>;

const respond = (res: Response, error: unknown) => {
  if (error instanceof SignupError) {
    return res.status(error.status).json({ message: error.message, ...(error.code ? { code: error.code } : {}) });
  }
  console.error('Erro na contratação online.');
  return res.status(500).json({ message: 'Erro interno do servidor' });
};

/** Rotas públicas da contratação: /api/signup */
export const createSignupRouter = (service: Service = defaultService) => {
  const router = Router();
  router.post('/checkout', async (req: Request, res: Response) => {
    try { return res.status(201).json(await service.createCheckout(req.body ?? {})); } catch (error) { return respond(res, error); }
  });
  router.post('/checkout/status', async (req: Request, res: Response) => {
    try { return res.json(await service.getCheckoutStatus(req.body ?? {})); } catch (error) { return respond(res, error); }
  });
  router.post('/complete', async (req: Request, res: Response) => {
    try { return res.status(201).json(await service.completeSignup(req.body ?? {})); } catch (error) { return respond(res, error); }
  });
  router.post('/verify-email', async (req: Request, res: Response) => {
    try { return res.json(await service.verifyEmail(req.body?.token)); } catch (error) { return respond(res, error); }
  });
  router.post('/resend-verification', async (req: Request, res: Response) => {
    try { return res.status(202).json(await service.resendVerification(req.body?.email)); } catch (error) { return respond(res, error); }
  });
  return router;
};

let warnedMissingSecret = false;

/**
 * Notificações do Mercado Pago: /webhooks/mercadopago
 * Com MP_WEBHOOK_SECRET a assinatura é obrigatória. Em qualquer caso o pagamento é
 * consultado na API antes de mudar o checkout, então uma notificação forjada não libera nada.
 */
export const createMercadoPagoWebhookRouter = (
  service: Service = defaultService,
  settings = loadMercadoPagoSettings,
  billing: Billing = defaultBilling,
) => {
  const router = Router();
  router.post('/', async (req: Request, res: Response) => {
    const query = req.query as Record<string, unknown>;
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, any>;
    const type = String(query.type ?? query.topic ?? body.type ?? body.topic ?? '');
    const dataId = String(query['data.id'] ?? body.data?.id ?? query.id ?? '');

    const { webhookSecret } = settings();
    if (webhookSecret) {
      const valid = verifyWebhookSignature({
        signatureHeader: req.get('x-signature') ?? undefined,
        requestId: req.get('x-request-id') ?? undefined,
        dataId: query['data.id'] !== undefined ? String(query['data.id']) : dataId,
        secret: webhookSecret,
      });
      if (!valid) return res.status(401).json({ message: 'Assinatura inválida' });
    } else if (!warnedMissingSecret) {
      warnedMissingSecret = true;
      console.warn('MP_WEBHOOK_SECRET ausente: notificações aceitas sem assinatura (o pagamento ainda é conferido na API).');
    }

    const handlers: Record<string, { valid: (id: string) => boolean; run: (id: string) => Promise<unknown> }> = {
      payment: { valid: (id) => /^\d{1,20}$/.test(id), run: (id) => service.handlePaymentNotification(id) },
      // Assinatura criada/atualizada: libera o cadastro e reflete pausa ou cancelamento.
      subscription_preapproval: {
        valid: isPreapprovalId,
        run: async (id) => {
          const signup = await service.handlePreapprovalNotification(id);
          const subscription = await billing.handlePreapprovalNotification(id);
          return { signup, subscription };
        },
      },
      // Cada cobrança mensal da assinatura.
      subscription_authorized_payment: { valid: (id) => /^\d{1,20}$/.test(id), run: (id) => billing.handleAuthorizedPaymentNotification(id) },
    };
    const handler = handlers[type];
    if (!handler || !handler.valid(dataId)) return res.status(200).json({ ignored: true });
    try {
      const result = await handler.run(dataId);
      return res.status(200).json({ result });
    } catch (error) {
      // Pagamento inexistente (ex.: "Simular notificação" do painel): confirma e ignora; repetir não adianta.
      if (error instanceof MercadoPagoError && error.status === 404) return res.status(200).json({ ignored: true, reason: 'payment_not_found' });
      console.error('Falha ao processar notificação do Mercado Pago.');
      return res.status(500).json({ message: 'Tente novamente' });
    }
  });
  return router;
};
