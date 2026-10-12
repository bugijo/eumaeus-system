import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { CommunicationService } from '../services/communication.service';

export const communicationController = {
  async setPreference(req: AuthenticatedRequest, res: Response) {
    try {
      const tutorId = Number(req.params.tutorId);
      if (!Number.isInteger(tutorId) || !req.body?.sender || !req.body?.category) return res.status(400).json({ error: 'Preferência inválida' });
      const preference = await CommunicationService.upsertPreference(tutorId, {
        sender: String(req.body.sender), category: String(req.body.category), enabled: req.body.enabled, stopAll: req.body.stopAll,
        pausedUntil: req.body.pausedUntil ? new Date(req.body.pausedUntil) : null,
      });
      return res.json({ success: true, data: preference });
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Não foi possível salvar a preferência' });
    }
  },
  async dispatchSimulation(_req: AuthenticatedRequest, res: Response) {
    const result = await CommunicationService.dispatchPending();
    return res.json({ success: true, mode: 'simulation', data: result });
  },
  async listPreferences(req: AuthenticatedRequest, res: Response) {
    return res.json({ success: true, data: await CommunicationService.listPreferences(Number(req.params.tutorId)) });
  },
  async listHistory(req: AuthenticatedRequest, res: Response) {
    return res.json({ success: true, data: await CommunicationService.listHistory(Number(req.params.tutorId)) });
  },
};
