import { Request, Response } from 'express';
import { MedicalRecordService } from '../services/medicalRecord.service';
import { CreateMedicalRecordRequest } from '../models/medicalRecord.model';

export class MedicalRecordController {
  static async getRecordsByPetId(req: Request, res: Response): Promise<Response | void> {
    try {
      const petId = parseInt(req.params.petId);
      
      if (isNaN(petId)) {
        return res.status(400).json({ error: 'ID do pet inválido' });
      }

      const records = await MedicalRecordService.getRecordsByPetId(petId);
      return res.json(records);
    } catch (error) {
      console.error('Erro ao buscar prontuários:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async createRecord(req: Request, res: Response): Promise<Response | void> {
    try {
      const appointmentId = parseInt(req.params.appointmentId);
      
      if (isNaN(appointmentId)) {
        return res.status(400).json({ error: 'ID do agendamento inválido' });
      }

      const { symptoms, diagnosis, treatment, notes }: CreateMedicalRecordRequest = req.body;

      if (!symptoms || !diagnosis || !treatment) {
        return res.status(400).json({ error: 'Sintomas, diagnóstico e tratamento são obrigatórios' });
      }

      const recordData: CreateMedicalRecordRequest = {
        symptoms,
        diagnosis,
        treatment,
        notes: notes || ''
      };

      const newRecord = await MedicalRecordService.createRecord(appointmentId, recordData);
      return res.status(201).json(newRecord);
    } catch (error) {
      console.error('Erro ao criar prontuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async getRecordById(req: Request, res: Response): Promise<Response | void> {
    try {
      const recordId = parseInt(req.params.recordId || req.params.id);
      
      if (isNaN(recordId)) {
        return res.status(400).json({ error: 'ID do prontuário inválido' });
      }

      const record = await MedicalRecordService.getRecordById(recordId);
      
      if (!record) {
        return res.status(404).json({ error: 'Prontuário não encontrado' });
      }

      return res.json(record);
    } catch (error) {
      console.error('Erro ao buscar prontuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async getAllRecords(req: Request, res: Response): Promise<Response | void> {
    try {
      const records = await MedicalRecordService.getAllRecords();
      return res.json(records);
    } catch (error) {
      console.error('Erro ao buscar todos os prontuários:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static updateRecord(req: Request, res: Response): Response | void {
    try {
      const recordId = parseInt(req.params.recordId);
      
      if (isNaN(recordId)) {
        return res.status(400).json({ error: 'ID do prontuário inválido' });
      }

      const { notes, prescription } = req.body;

      if (!notes) {
        return res.status(400).json({ error: 'Anotações são obrigatórias' });
      }

      const updatedRecord = MedicalRecordService.updateRecord(recordId, {
        notes,
        prescription: prescription || ''
      });

      if (!updatedRecord) {
        return res.status(404).json({ error: 'Prontuário não encontrado' });
      }

      return res.json(updatedRecord);
    } catch (error) {
      console.error('Erro ao atualizar prontuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}