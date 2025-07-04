import { Request, Response } from 'express';
import { Appointment } from '../models/appointment.model';
import { AppointmentService } from '../services/appointment.service';
import { z } from 'zod';

// Schema de validação para atualização de status
const updateStatusSchema = z.object({
  status: z.enum(['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'])
});

export class AppointmentController {
  static getAllAppointments(req: Request, res: Response): void {
    try {
      const appointments = AppointmentService.getAllAppointments();
      res.status(200).json(appointments);
    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static createAppointment(req: Request, res: Response): void {
    try {
      const newAppointmentData = req.body;
      const createdAppointment = AppointmentService.createAppointment(newAppointmentData);
      res.status(201).json(createdAppointment);
    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static getAppointmentById(req: Request, res: Response): void {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID inválido' });
        return;
      }
      
      const appointment = AppointmentService.getAppointmentById(id);
      
      if (!appointment) {
        res.status(404).json({ error: 'Agendamento não encontrado' });
        return;
      }
      
      res.status(200).json(appointment);
    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static updateAppointment(req: Request, res: Response): void {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID inválido' });
        return;
      }
      
      const updatedAppointment = AppointmentService.updateAppointment(id, updateData);
      
      if (!updatedAppointment) {
        res.status(404).json({ error: 'Agendamento não encontrado' });
        return;
      }
      
      res.status(200).json(updatedAppointment);
    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static deleteAppointment(req: Request, res: Response): void {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID inválido' });
        return;
      }
      
      const deleted = AppointmentService.deleteAppointment(id);
      
      if (!deleted) {
        res.status(404).json({ error: 'Agendamento não encontrado' });
        return;
      }
      
      res.status(200).json({ message: 'Agendamento deletado com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static updateAppointmentStatus(req: Request, res: Response): void {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID inválido' });
        return;
      }

      const validatedData = updateStatusSchema.parse(req.body);
      const updatedAppointment = AppointmentService.updateAppointmentStatus(id, validatedData.status);
      
      if (!updatedAppointment) {
        res.status(404).json({ error: 'Agendamento não encontrado' });
        return;
      }
      
      res.status(200).json(updatedAppointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Status inválido', details: error.errors });
        return;
      }
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}