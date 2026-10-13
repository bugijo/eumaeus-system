import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController';
import { requireRoles, ROLE } from '../middlewares/auth.middleware';

const router = Router();

router.get('/stats', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR, ROLE.FINANCEIRO), dashboardController.getStats);
router.get('/upcoming-appointments', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR), dashboardController.getUpcomingAppointments);
router.get('/recent-activities', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR, ROLE.FINANCEIRO), dashboardController.getRecentActivities);
router.get('/activity', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR, ROLE.FINANCEIRO), dashboardController.getRecentActivity);
router.get('/assistant', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR, ROLE.FINANCEIRO), dashboardController.getAssistantSummary);
router.get('/assistant/reminders', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR, ROLE.FINANCEIRO), dashboardController.getAssistantReminders);
router.post('/assistant/reminders/:id/snooze', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR, ROLE.FINANCEIRO), dashboardController.snoozeAssistantReminder);
router.post('/assistant/reminders/:id/dismiss', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR, ROLE.FINANCEIRO), dashboardController.dismissAssistantReminder);
router.post('/assistant/reminders/:id/resolve', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR, ROLE.FINANCEIRO), dashboardController.resolveAssistantReminder);

export default router;
