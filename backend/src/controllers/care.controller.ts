import { Request, Response } from 'express';
import { CareService } from '../services/care.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
const actor = (req: Request) => (req as AuthenticatedRequest).user?.id;
const ok = (res: Response, fn: Promise<unknown>, code = 201) => fn.then(data => res.status(code).json(data)).catch(error => res.status(400).json({ error: error instanceof Error ? error.message : 'Operação recusada' }));
export const careController = {
  admissions: async (_: Request, res: Response) => res.json(await CareService.listAdmissions()),
  admit: (req: Request, res: Response) => ok(res, CareService.admit({ ...req.body, petId: Number(req.body.petId), responsibleUserId: Number(req.body.responsibleUserId) })),
  task: (req: Request, res: Response) => ok(res, CareService.addTask(Number(req.params.id), req.body)),
  executeTask: (req: Request, res: Response) => ok(res, CareService.recordTask(Number(req.params.id), { ...req.body, executedById: Number(actor(req)) }), 200),
  prescription: (req: Request, res: Response) => ok(res, CareService.addPrescription(Number(req.params.id), { ...req.body, createdById: Number(req.body.createdById || actor(req)) })),
  discharge: (req: Request, res: Response) => ok(res, CareService.discharge(Number(req.params.id), { notes: req.body.notes, reviewerId: Number(actor(req)) }), 200),
  handoff: (req: Request, res: Response) => ok(res, CareService.handoff(Number(req.params.id), { ...req.body, fromUserId: Number(actor(req)), toUserId: Number(req.body.toUserId) })),
  surgeries: async (_: Request, res: Response) => res.json(await CareService.listSurgeries()),
  surgery: (req: Request, res: Response) => ok(res, CareService.createSurgery({ ...req.body, petId: Number(req.body.petId), veterinarianId: Number(req.body.veterinarianId || actor(req)) })),
  budget: (req: Request, res: Response) => ok(res, CareService.addBudget(Number(req.params.id), { ...req.body, createdById: Number(actor(req)) })),
  consent: (req: Request, res: Response) => ok(res, CareService.addConsent(Number(req.params.id), { ...req.body, budgetVersionId: Number(req.body.budgetVersionId), recordedById: Number(actor(req)) })),
  checklist: (req: Request, res: Response) => ok(res, CareService.addChecklist(Number(req.params.id), req.body)),
  completeChecklist: (req: Request, res: Response) => ok(res, CareService.completeChecklist(Number(req.params.id), { ...req.body, userId: Number(actor(req)) }), 200),
  instruction: (req: Request, res: Response) => ok(res, CareService.addInstruction(Number(req.params.id), req.body)),
  approveInstruction: (req: Request, res: Response) => ok(res, CareService.approveInstruction(Number(req.params.id), Number(actor(req))), 200),
};
