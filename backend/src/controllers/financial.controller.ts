import { Request, Response } from 'express';
import { FinancialService } from '../services/financial.service';

export const financialController = {
  async centers(_req: Request, res: Response) { return res.json(await FinancialService.listCenters()); },
  async expenses(_req: Request, res: Response) { return res.json(await FinancialService.listExpenses()); },
  async createCenter(req: Request, res: Response) { try { return res.status(201).json(await FinancialService.createCenter(req.body)); } catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : 'Centro recusado' }); } },
  async createExpense(req: Request, res: Response) { try { return res.status(201).json(await FinancialService.createExpense({ description: req.body.description, amount: Number(req.body.amount), resultCenterId: req.body.resultCenterId === undefined ? undefined : Number(req.body.resultCenterId), reason: req.body.reason })); } catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : 'Despesa recusada' }); } },
  async receive(req: Request, res: Response) { try { return res.status(201).json(await FinancialService.receive(Number(req.params.id), Number(req.body.amount), req.body.method, req.body.idempotencyKey)); } catch (error) { return res.status(409).json({ error: error instanceof Error ? error.message : 'Recebimento recusado' }); } },
  async reverse(req: Request, res: Response) { try { return res.json(await FinancialService.reversePayment(Number(req.params.paymentId), req.body.reason)); } catch (error) { return res.status(409).json({ error: error instanceof Error ? error.message : 'Estorno recusado' }); } },
};
