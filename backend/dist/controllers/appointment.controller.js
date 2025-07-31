"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentController = void 0;
const appointment_service_1 = require("../services/appointment.service");
const zod_1 = require("zod");
const errorHandler_1 = require("../utils/errorHandler");
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'])
});
class AppointmentController {
    static async getAllAppointments(req, res) {
        try {
            const appointments = await appointment_service_1.AppointmentService.getAllAppointments();
            return res.status(200).json(appointments);
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(error, res, 'Erro ao buscar agendamentos');
        }
    }
    static async createAppointment(req, res) {
        try {
            const newAppointmentData = req.body;
            const createdAppointment = await appointment_service_1.AppointmentService.createAppointment(newAppointmentData);
            return res.status(201).json(createdAppointment);
        }
        catch (error) {
            return (0, errorHandler_1.handleValidationError)(error, res);
        }
    }
    static async getAppointmentById(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const appointment = await appointment_service_1.AppointmentService.getAppointmentById(id);
            if (!appointment) {
                return res.status(404).json({ error: 'Agendamento não encontrado' });
            }
            return res.status(200).json(appointment);
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(error, res, 'Erro ao buscar agendamento');
        }
    }
    static async updateAppointment(req, res) {
        try {
            const id = parseInt(req.params.id);
            const updateData = req.body;
            if (isNaN(id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const updatedAppointment = await appointment_service_1.AppointmentService.updateAppointment(id, updateData);
            if (!updatedAppointment) {
                return res.status(404).json({ error: 'Agendamento não encontrado' });
            }
            return res.status(200).json(updatedAppointment);
        }
        catch (error) {
            return (0, errorHandler_1.handleValidationError)(error, res);
        }
    }
    static async deleteAppointment(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const deleted = await appointment_service_1.AppointmentService.deleteAppointment(id);
            if (!deleted) {
                return res.status(404).json({ error: 'Agendamento não encontrado' });
            }
            return res.status(200).json({ message: 'Agendamento deletado com sucesso' });
        }
        catch (error) {
            return (0, errorHandler_1.handleError)(error, res, 'Erro ao deletar agendamento');
        }
    }
    static async updateAppointmentStatus(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const validatedData = updateStatusSchema.parse(req.body);
            const updatedAppointment = await appointment_service_1.AppointmentService.updateAppointmentStatus(id, validatedData.status);
            if (!updatedAppointment) {
                return res.status(404).json({ error: 'Agendamento não encontrado' });
            }
            return res.status(200).json(updatedAppointment);
        }
        catch (error) {
            return (0, errorHandler_1.handleValidationError)(error, res);
        }
    }
}
exports.AppointmentController = AppointmentController;
//# sourceMappingURL=appointment.controller.js.map