import { Router } from 'express';
import { communicationController } from '../controllers/communication.controller';
import { requireRoles, ROLE } from '../middlewares/auth.middleware';

const router = Router();
router.put('/tutors/:tutorId/communication-preferences', requireRoles(ROLE.DONO, ROLE.RECEPCAO), communicationController.setPreference);
router.get('/tutors/:tutorId/communication-preferences', requireRoles(ROLE.DONO, ROLE.RECEPCAO, ROLE.VETERINARIO), communicationController.listPreferences);
router.get('/tutors/:tutorId/communication-history', requireRoles(ROLE.DONO, ROLE.RECEPCAO, ROLE.VETERINARIO), communicationController.listHistory);
router.post('/communication/outbox/dispatch-simulation', requireRoles(ROLE.DONO, ROLE.RECEPCAO), communicationController.dispatchSimulation);
export default router;
