import { Router, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { AuthenticatedRequest, ROLE, requireRoles } from '../middlewares/auth.middleware';
import { HELP_ARTICLES } from '../help/articles';
import { AssistantQuotaError, AssistantUnavailableError, askAssistant, consumeQuota, sanitizeHistory } from '../help/assistant';

const router = Router();
// Qualquer funcionário ativo do estabelecimento (requireRoles também confere se o acesso foi revogado).
const staff = requireRoles(...Object.values(ROLE));

router.get('/articles', staff, (_req, res) => res.json(HELP_ARTICLES));

router.get('/assistant/status', staff, (_req, res) => res.json({ enabled: Boolean(process.env.ANTHROPIC_API_KEY) }));

router.post('/assistant', staff, async (req: AuthenticatedRequest, res: Response) => {
  const history = sanitizeHistory(req.body?.messages);
  if (!history.length) return res.status(400).json({ error: 'Envie uma pergunta.' });
  const clinicId = req.user?.clinicId;
  if (!clinicId) return res.status(403).json({ error: 'Contexto da clínica ausente' });
  try {
    if (!process.env.ANTHROPIC_API_KEY) throw new AssistantUnavailableError('O assistente ainda não foi ativado neste servidor.');
    const remaining = consumeQuota(clinicId);
    const answer = await askAssistant(history, typeof req.body?.path === 'string' ? req.body.path : undefined);
    return res.json({ answer, remaining });
  } catch (error) {
    if (error instanceof AssistantUnavailableError) return res.status(503).json({ error: error.message });
    if (error instanceof AssistantQuotaError) return res.status(429).json({ error: error.message });
    if (error instanceof Anthropic.RateLimitError) return res.status(429).json({ error: 'Assistente ocupado. Tente de novo em instantes.' });
    console.error('[help] falha no assistente', error instanceof Anthropic.APIError ? `status ${error.status}` : error instanceof Error ? error.message : 'desconhecida');
    return res.status(502).json({ error: 'O assistente não respondeu agora. Tente de novo ou use a central de ajuda.' });
  }
});

export default router;
