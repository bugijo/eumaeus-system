import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';
import { requireRoles, ROLE } from '../middlewares/auth.middleware';

const appointmentRoutes = Router();

appointmentRoutes.get('/appointments', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR), AppointmentController.getAllAppointments);
appointmentRoutes.get('/appointments/:id', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR), AppointmentController.getAppointmentById);
appointmentRoutes.post('/appointments', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO), AppointmentController.createAppointment);
appointmentRoutes.put('/appointments/:id', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO), AppointmentController.updateAppointment);
appointmentRoutes.patch('/appointments/:id/status', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO), AppointmentController.updateAppointmentStatus);
appointmentRoutes.delete('/appointments/:id', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO), AppointmentController.deleteAppointment);

export { appointmentRoutes };
