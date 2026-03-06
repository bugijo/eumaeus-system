import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController';
import { authenticateUser, requireRoles, ROLE } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticateUser);

router.get('/stats', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR, ROLE.FINANCEIRO), dashboardController.getStats);
router.get('/upcoming-appointments', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR), dashboardController.getUpcomingAppointments);
router.get('/recent-activities', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR, ROLE.FINANCEIRO), dashboardController.getRecentActivities);
router.get('/activity', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR, ROLE.FINANCEIRO), dashboardController.getRecentActivity);

export default router;
