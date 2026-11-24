import { Request, Response } from 'express';
import { PurchaseInvoiceService } from '../services/purchaseInvoice.service';
import { loadUserAccess } from '../access/accessGate';
import { getCurrentClinicId, getCurrentUserId } from '../tenantContext';
import { BUSY_MESSAGE } from '../lib/serializableRetry';

/** Mensagens de regra de negócio seguem para a tela; erros internos (Prisma etc.) não. */
const message = (error: unknown, fallback: string) => {
  const text = error instanceof Error ? error.message : '';
  if (!text || /\bP\d{4}\b|prisma\./i.test(text)) return fallback;
  return text;
};

async function canRecordExpense() {
  const userId = getCurrentUserId();
  const clinicId = getCurrentClinicId();
  if (!userId || !clinicId) return false;
  const access = await loadUserAccess(userId, clinicId);
  return !!access?.permissions.includes('financeiro');
}

export const purchaseInvoiceController = {
  async preview(req: Request, res: Response) {
    try { return res.json(await PurchaseInvoiceService.preview(req.body?.xml)); }
    catch (error) { return res.status(400).json({ error: message(error, 'Não foi possível ler a nota') }); }
  },
  async import(req: Request, res: Response) {
    try {
      const result = await PurchaseInvoiceService.import(req.body?.xml, req.body?.lines, {
        updateCost: req.body?.updateCost !== false,
        createExpense: req.body?.createExpense === true,
        resultCenterId: req.body?.resultCenterId ? Number(req.body.resultCenterId) : undefined,
      }, await canRecordExpense());
      return res.status(201).json(result);
    } catch (error) {
      const text = message(error, 'Importação recusada');
      return res.status(text === BUSY_MESSAGE ? 409 : 400).json({ error: text });
    }
  },
  async list(req: Request, res: Response) {
    return res.json(await PurchaseInvoiceService.list(req.query.limit ? Number(req.query.limit) : 30));
  },
  async xml(req: Request, res: Response) {
    const row = await PurchaseInvoiceService.xml(Number(req.params.id));
    if (!row) return res.status(404).json({ error: 'Nota não encontrada' });
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="NFe${row.accessKey}.xml"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.send(row.xml);
  },
};
