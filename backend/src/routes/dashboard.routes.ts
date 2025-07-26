import { Router } from 'express';
import { dashboardController } from '../controllers/dashboardController';

const router = Router();

router.get('/stats', dashboardController.getStats);
router.get('/upcoming-appointments', dashboardController.getUpcomingAppointments);
router.get('/recent-activities', dashboardController.getRecentActivities);
router.get('/activity', dashboardController.getRecentActivity);

export default router;