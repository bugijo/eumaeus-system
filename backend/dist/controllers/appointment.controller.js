"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentController = void 0;
const appointment_service_1 = require("../services/appointment.service");
class AppointmentController {
    static getAllAppointments(req, res) {
        try {
            const appointments = appointment_service_1.AppointmentService.getAllAppointments();
            res.status(200).json(appointments);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static createAppointment(req, res) {
        try {
            const newAppointmentData = req.body;
            const createdAppointment = appointment_service_1.AppointmentService.createAppointment(newAppointmentData);
            res.status(201).json(createdAppointment);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static getAppointmentById(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ error: 'ID inválido' });
                return;
            }
            const appointment = appointment_service_1.AppointmentService.getAppointmentById(id);
            if (!appointment) {
                res.status(404).json({ error: 'Agendamento não encontrado' });
                return;
            }
            res.status(200).json(appointment);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static updateAppointment(req, res) {
        try {
            const id = parseInt(req.params.id);
            const updateData = req.body;
            if (isNaN(id)) {
                res.status(400).json({ error: 'ID inválido' });
                return;
            }
            const updatedAppointment = appointment_service_1.AppointmentService.updateAppointment(id, updateData);
            if (!updatedAppointment) {
                res.status(404).json({ error: 'Agendamento não encontrado' });
                return;
            }
            res.status(200).json(updatedAppointment);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static deleteAppointment(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ error: 'ID inválido' });
                return;
            }
            const deleted = appointment_service_1.AppointmentService.deleteAppointment(id);
            if (!deleted) {
                res.status(404).json({ error: 'Agendamento não encontrado' });
                return;
            }
            res.status(200).json({ message: 'Agendamento deletado com sucesso' });
        }
        catch (error) {
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}
exports.AppointmentController = AppointmentController;
//# sourceMappingURL=appointment.controller.js.map