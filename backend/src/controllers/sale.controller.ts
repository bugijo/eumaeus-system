import { Request, Response } from 'express';
import { SaleService } from '../services/sale.service';

// Erros internos do Prisma (código P....) não vão para a tela: mostram detalhes do banco e não ajudam o usuário.
const message = (error: unknown, fallback: string) => {
  if (!(error instanceof Error)) return fallback;
  if (/^P\d{4}$/.test(String((error as { code?: string }).code || '')) || error.message.includes('prisma.')) return fallback;
  return error.message;
};

export const saleController = {
  async list(req: Request, res: Response) {
    try { return res.json(await SaleService.list({ from: req.query.from as string | undefined, to: req.query.to as string | undefined })); }
    catch (error) { return res.status(500).json({ error: message(error, 'Falha ao listar vendas') }); }
  },
  async getById(req: Request, res: Response) {
    const sale = await SaleService.getById(Number(req.params.id));
    return sale ? res.json(sale) : res.status(404).json({ error: 'Venda não encontrada' });
  },
  async create(req: Request, res: Response) {
    try {
      const sale = await SaleService.create({
        items: req.body?.items,
        payments: req.body?.payments,
        discount: req.body?.discount === undefined ? 0 : Number(req.body.discount),
        resultCenterId: req.body?.resultCenterId ? Number(req.body.resultCenterId) : undefined,
        tutorId: req.body?.tutorId ? Number(req.body.tutorId) : undefined,
        idempotencyKey: req.body?.idempotencyKey,
      });
      return res.status(201).json(sale);
    } catch (error) { return res.status(400).json({ error: message(error, 'Venda recusada') }); }
  },
  async cancel(req: Request, res: Response) {
    try { return res.json(await SaleService.cancel(Number(req.params.id), req.body?.reason)); }
    catch (error) { return res.status(400).json({ error: message(error, 'Cancelamento recusado') }); }
  },
  async byBarcode(req: Request, res: Response) {
    const product = await SaleService.findProductByBarcode(req.params.code);
    return product ? res.json(product) : res.status(404).json({ error: 'Nenhum produto com este código de barras' });
  },
};
