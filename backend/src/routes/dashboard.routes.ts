import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController';
import { requireRoles, ROLE } from '../middlewares/auth.middleware';

const router = Router();

router.get('/stats', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR, ROLE.FINANCEIRO, ROLE.BANHO_TOSA), dashboardController.getStats);
router.get('/upcoming-appointments', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR), dashboardController.getUpcomingAppointments);
router.get('/recent-activities', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR, ROLE.FINANCEIRO, ROLE.BANHO_TOSA), dashboardController.getRecentActivities);
router.get('/activity', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR, ROLE.FINANCEIRO, ROLE.BANHO_TOSA), dashboardController.getRecentActivity);
router.get('/assistant', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR, ROLE.FINANCEIRO, ROLE.BANHO_TOSA), dashboardController.getAssistantSummary);
router.get('/assistant/reminders', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR, ROLE.FINANCEIRO, ROLE.BANHO_TOSA), dashboardController.getAssistantReminders);
router.post('/assistant/reminders/:id/snooze', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR, ROLE.FINANCEIRO, ROLE.BANHO_TOSA), dashboardController.snoozeAssistantReminder);
router.post('/assistant/reminders/:id/dismiss', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR, ROLE.FINANCEIRO, ROLE.BANHO_TOSA), dashboardController.dismissAssistantReminder);
router.post('/assistant/reminders/:id/resolve', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR, ROLE.FINANCEIRO, ROLE.BANHO_TOSA), dashboardController.resolveAssistantReminder);

export default router;
