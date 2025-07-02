import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';

const appointmentRoutes = Router();

appointmentRoutes.get('/appointments', AppointmentController.getAllAppointments);
appointmentRoutes.get('/appointments/:id', AppointmentController.getAppointmentById);
appointmentRoutes.post('/appointments', AppointmentController.createAppointment);
appointmentRoutes.put('/appointments/:id', AppointmentController.updateAppointment);
appointmentRoutes.delete('/appointments/:id', AppointmentController.deleteAppointment);
appointmentRoutes.post('/appointments/:appointmentId/products', AppointmentController.registerProductUsage);

export { appointmentRoutes };