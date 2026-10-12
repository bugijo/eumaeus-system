import { Request, Response } from 'express';
import { VaccinationService } from '../services/vaccination.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const vaccinationController = {
  async list(req: Request, res: Response) { try { return res.json({ success: true, data: await VaccinationService.listByPet(Number(req.params.petId)) }); } catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : 'Histórico indisponível' }); } },
  async create(req: Request, res: Response) { try { const actor = (req as AuthenticatedRequest).user?.id; return res.status(201).json({ success: true, data: await VaccinationService.create({ ...req.body, petId: Number(req.params.petId), responsibleUserId: actor as number, medicalRecordId: req.body.medicalRecordId ? Number(req.body.medicalRecordId) : undefined }) }); } catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : 'Vacinação recusada' }); } },
};
