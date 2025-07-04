import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';

const appointmentRoutes = Router();

appointmentRoutes.get('/appointments', AppointmentController.getAllAppointments);
appointmentRoutes.get('/appointments/:id', AppointmentController.getAppointmentById);
appointmentRoutes.post('/appointments', AppointmentController.createAppointment);
appointmentRoutes.put('/appointments/:id', AppointmentController.updateAppointment);
appointmentRoutes.patch('/appointments/:id/status', AppointmentController.updateAppointmentStatus);
appointmentRoutes.delete('/appointments/:id', AppointmentController.deleteAppointment);

export { appointmentRoutes };