"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentController = void 0;
const appointment_service_1 = require("../services/appointment.service");
const zod_1 = require("zod");
const updateStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'])
});
class AppointmentController {
    static getAllAppointments(req, res) {
        try {
            const appointments = appointment_service_1.AppointmentService.getAllAppointments();
            return res.status(200).json(appointments);
        }
        catch (error) {
            console.error('Erro ao buscar agendamentos:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static createAppointment(req, res) {
        try {
            const newAppointmentData = req.body;
            const createdAppointment = appointment_service_1.AppointmentService.createAppointment(newAppointmentData);
            return res.status(201).json(createdAppointment);
        }
        catch (error) {
            console.error('Erro ao criar agendamento:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static getAppointmentById(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const appointment = appointment_service_1.AppointmentService.getAppointmentById(id);
            if (!appointment) {
                return res.status(404).json({ error: 'Agendamento não encontrado' });
            }
            return res.status(200).json(appointment);
        }
        catch (error) {
            console.error('Erro ao buscar agendamento:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static updateAppointment(req, res) {
        try {
            const id = parseInt(req.params.id);
            const updateData = req.body;
            if (isNaN(id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const updatedAppointment = appointment_service_1.AppointmentService.updateAppointment(id, updateData);
            if (!updatedAppointment) {
                return res.status(404).json({ error: 'Agendamento não encontrado' });
            }
            return res.status(200).json(updatedAppointment);
        }
        catch (error) {
            console.error('Erro ao atualizar agendamento:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static deleteAppointment(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const deleted = appointment_service_1.AppointmentService.deleteAppointment(id);
            if (!deleted) {
                return res.status(404).json({ error: 'Agendamento não encontrado' });
            }
            return res.status(200).json({ message: 'Agendamento deletado com sucesso' });
        }
        catch (error) {
            console.error('Erro ao deletar agendamento:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static updateAppointmentStatus(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const validatedData = updateStatusSchema.parse(req.body);
            const updatedAppointment = appointment_service_1.AppointmentService.updateAppointmentStatus(id, validatedData.status);
            if (!updatedAppointment) {
                return res.status(404).json({ error: 'Agendamento não encontrado' });
            }
            return res.status(200).json(updatedAppointment);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: 'Status inválido', details: error.errors });
            }
            console.error('Erro ao atualizar status do agendamento:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}
exports.AppointmentController = AppointmentController;
//# sourceMappingURL=appointment.controller.js.map