"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.appointmentRoutes = void 0;
const express_1 = require("express");
const appointment_controller_1 = require("../controllers/appointment.controller");
const appointmentRoutes = (0, express_1.Router)();
exports.appointmentRoutes = appointmentRoutes;
appointmentRoutes.get('/appointments', appointment_controller_1.AppointmentController.getAllAppointments);
appointmentRoutes.get('/appointments/:id', appointment_controller_1.AppointmentController.getAppointmentById);
appointmentRoutes.post('/appointments', appointment_controller_1.AppointmentController.createAppointment);
appointmentRoutes.put('/appointments/:id', appointment_controller_1.AppointmentController.updateAppointment);
appointmentRoutes.patch('/appointments/:id/status', appointment_controller_1.AppointmentController.updateAppointmentStatus);
appointmentRoutes.delete('/appointments/:id', appointment_controller_1.AppointmentController.deleteAppointment);
//# sourceMappingURL=appointment.routes.js.map