import { Request, Response } from 'express';
import { Appointment } from '../models/appointment.model';
import { AppointmentService } from '../services/appointment.service';
import { AppointmentProductUsageService } from '../services/appointmentProductUsage.service';
import { ProductUsageRequest } from '../models/appointmentProductUsage.model';

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

  static async registerProductUsage(req: Request, res: Response): Promise<void> {
    try {
      const appointmentId = parseInt(req.params.appointmentId);
      const products: ProductUsageRequest[] = req.body;
      
      if (isNaN(appointmentId)) {
        res.status(400).json({ error: 'ID do agendamento inválido' });
        return;
      }
      
      // Verificar se o agendamento existe
      const appointment = AppointmentService.getAppointmentById(appointmentId);
      if (!appointment) {
        res.status(404).json({ error: 'Agendamento não encontrado' });
        return;
      }
      
      // Validar formato dos produtos
      if (!Array.isArray(products) || products.length === 0) {
        res.status(400).json({ error: 'Lista de produtos é obrigatória e deve conter pelo menos um item' });
        return;
      }
      
      // Validar cada produto
      for (const product of products) {
        if (!product.productId || !product.quantityUsed || product.quantityUsed <= 0) {
          res.status(400).json({ error: 'Cada produto deve ter productId e quantityUsed válidos' });
          return;
        }
      }
      
      const result = await AppointmentProductUsageService.registerProductUsage(appointmentId, products);
      
      if (result.success) {
        res.status(200).json({
          message: result.message,
          usages: result.usages
        });
      } else {
        res.status(400).json({
          error: result.message,
          partialUsages: result.usages
        });
      }
    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}