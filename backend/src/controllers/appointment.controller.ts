import { Request, Response } from 'express';
import { Appointment } from '../models/appointment.model';
import { AppointmentService } from '../services/appointment.service';
import { z } from 'zod';
import { handleError, handleValidationError } from '../utils/errorHandler';

// Schema de validação para atualização de status
const updateStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'])
});

export class AppointmentController {
  static async getAllAppointments(req: Request, res: Response): Promise<Response | void> {
    try {
      const appointments = await AppointmentService.getAllAppointments();
      return res.status(200).json(appointments);
    } catch (error) {
      return handleError(error, res, 'Erro ao buscar agendamentos');
    }
  }

  static async createAppointment(req: Request, res: Response): Promise<Response | void> {
    try {
      const newAppointmentData = req.body;
      const createdAppointment = await AppointmentService.createAppointment(newAppointmentData);
      return res.status(201).json(createdAppointment);
    } catch (error) {
      return handleValidationError(error, res);
    }
  }

  static async getAppointmentById(req: Request, res: Response): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      
      const appointment = await AppointmentService.getAppointmentById(id);
      
      if (!appointment) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }
      
      return res.status(200).json(appointment);
    } catch (error) {
      return handleError(error, res, 'Erro ao buscar agendamento');
    }
  }

  static async updateAppointment(req: Request, res: Response): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      
      const updatedAppointment = await AppointmentService.updateAppointment(id, updateData);
      
      if (!updatedAppointment) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }
      
      return res.status(200).json(updatedAppointment);
    } catch (error) {
      return handleValidationError(error, res);
    }
  }

  static async deleteAppointment(req: Request, res: Response): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      
      const deleted = await AppointmentService.deleteAppointment(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }
      
      return res.status(200).json({ message: 'Agendamento deletado com sucesso' });
    } catch (error) {
      return handleError(error, res, 'Erro ao deletar agendamento');
    }
  }

  static async updateAppointmentStatus(req: Request, res: Response): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const validatedData = updateStatusSchema.parse(req.body);
      const updatedAppointment = await AppointmentService.updateAppointmentStatus(id, validatedData.status);
      
      if (!updatedAppointment) {
        return res.status(404).json({ error: 'Agendamento não encontrado' });
      }
      
      return res.status(200).json(updatedAppointment);
    } catch (error) {
      return handleValidationError(error, res);
    }
  }
}