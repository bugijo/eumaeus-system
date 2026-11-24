import { Request, Response, Router } from 'express';
import { requireRoles, ROLE } from '../middlewares/auth.middleware';
import { CashService } from '../services/cash.service';

const router = Router();
const operate = requireRoles(ROLE.DONO, ROLE.RECEPCAO, ROLE.AUXILIAR, ROLE.FINANCEIRO, ROLE.VETERINARIO);

// Erros internos do Prisma não vão para a tela.
const message = (error: unknown, fallback: string) => {
  if (!(error instanceof Error)) return fallback;
  if (/^P\d{4}$/.test(String((error as { code?: string }).code || '')) || error.message.includes('prisma.')) return fallback;
  return error.message;
};

router.get('/current', operate, async (_req: Request, res: Response) => {
  try { return res.json(await CashService.current()); } catch (error) { return res.status(500).json({ error: message(error, 'Falha ao carregar o caixa') }); }
});
router.get('/sessions', operate, async (req: Request, res: Response) => {
  try { return res.json(await CashService.history(Number(req.query.limit) || 30)); } catch (error) { return res.status(500).json({ error: message(error, 'Falha ao listar fechamentos') }); }
});
router.post('/open', operate, async (req: Request, res: Response) => {
  try { return res.status(201).json(await CashService.open(req.body?.openingAmount)); } catch (error) { return res.status(400).json({ error: message(error, 'Abertura recusada') }); }
});
router.post('/movements', operate, async (req: Request, res: Response) => {
  try { return res.status(201).json(await CashService.addMovement(String(req.body?.type || ''), req.body?.amount, req.body?.reason)); } catch (error) { return res.status(400).json({ error: message(error, 'Movimento recusado') }); }
});
router.post('/close', operate, async (req: Request, res: Response) => {
  try { return res.json(await CashService.close(req.body?.countedCash, req.body?.note)); } catch (error) { return res.status(400).json({ error: message(error, 'Fechamento recusado') }); }
});

export default router;
