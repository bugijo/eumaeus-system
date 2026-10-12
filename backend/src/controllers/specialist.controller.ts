import { Request, Response } from 'express';
import { SpecialistService } from '../services/specialist.service';
export const specialistController = {
  async list(_req: Request, res: Response) { return res.json(await SpecialistService.list()); },
  async create(req: Request, res: Response) { try { return res.status(201).json(await SpecialistService.create({ ...req.body, userId: Number(req.body.userId), repasseRate: req.body.repasseRate === undefined ? undefined : Number(req.body.repasseRate) })); } catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : 'Especialista recusado' }); } },
  async availability(req: Request, res: Response) { try { return res.status(201).json(await SpecialistService.addAvailability(Number(req.params.id), req.body)); } catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : 'Disponibilidade recusada' }); } },
  async assign(req: Request, res: Response) { try { return res.status(201).json(await SpecialistService.assign({ appointmentId: Number(req.body.appointmentId), specialistId: Number(req.body.specialistId) })); } catch (error) { return res.status(409).json({ error: error instanceof Error ? error.message : 'Agendamento recusado' }); } },
  async confirm(req: Request, res: Response) { try { return res.json(await SpecialistService.confirm(Number(req.params.id))); } catch (error) { return res.status(409).json({ error: error instanceof Error ? error.message : 'Confirmação recusada' }); } },
};
