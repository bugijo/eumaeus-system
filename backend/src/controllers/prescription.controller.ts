import { Request, Response } from 'express';
import { PrescriptionService } from '../services/prescription.service';
import { CreatePrescriptionRequest, UpdatePrescriptionRequest } from '../models/prescription.model';

export class PrescriptionController {
  // POST /api/records/:recordId/prescriptions - Criar nova receita para um prontuário
  static async createPrescription(req: Request, res: Response): Promise<Response> {
    try {
      const medicalRecordId = parseInt(req.params.recordId);
      
      if (isNaN(medicalRecordId)) {
        return res.status(400).json({ error: 'ID do prontuário inválido' });
      }

      const { items }: { items: any[] } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Itens da receita são obrigatórios' });
      }

      // Validar cada item da receita
      for (const item of items) {
        if (!item.medication || !item.dosage || !item.frequency || !item.duration) {
          return res.status(400).json({ 
            error: 'Cada item deve conter medicamento, dosagem, frequência e duração' 
          });
        }
      }

      const prescriptionData: CreatePrescriptionRequest = {
        medicalRecordId,
        items
      };

      const newPrescription = await PrescriptionService.createPrescription(prescriptionData);
      return res.status(201).json(newPrescription);
    } catch (error: any) {
      console.error('Erro ao criar receita:', error);
      if (error.message === 'Prontuário médico não encontrado') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Já existe uma receita para este prontuário') {
        return res.status(409).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // GET /api/prescriptions/:id - Buscar receita por ID
  static async getPrescriptionById(req: Request, res: Response): Promise<Response> {
    try {
      const prescriptionId = parseInt(req.params.id);
      
      if (isNaN(prescriptionId)) {
        return res.status(400).json({ error: 'ID da receita inválido' });
      }

      const prescription = await PrescriptionService.getPrescriptionById(prescriptionId);
      
      if (!prescription) {
        return res.status(404).json({ error: 'Receita não encontrada' });
      }

      return res.json(prescription);
    } catch (error) {
      console.error('Erro ao buscar receita:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // GET /api/records/:recordId/prescriptions - Buscar receita por prontuário
  static async getPrescriptionByMedicalRecord(req: Request, res: Response): Promise<Response> {
    try {
      const medicalRecordId = parseInt(req.params.recordId);
      
      if (isNaN(medicalRecordId)) {
        return res.status(400).json({ error: 'ID do prontuário inválido' });
      }

      const prescription = await PrescriptionService.getPrescriptionByMedicalRecordId(medicalRecordId);
      
      if (!prescription) {
        return res.status(404).json({ error: 'Receita não encontrada para este prontuário' });
      }

      return res.json(prescription);
    } catch (error) {
      console.error('Erro ao buscar receita por prontuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // PUT /api/prescriptions/:id - Atualizar receita
  static async updatePrescription(req: Request, res: Response): Promise<Response> {
    try {
      const prescriptionId = parseInt(req.params.id);
      
      if (isNaN(prescriptionId)) {
        return res.status(400).json({ error: 'ID da receita inválido' });
      }

      const { items }: { items: any[] } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Itens da receita são obrigatórios' });
      }

      // Validar cada item da receita
      for (const item of items) {
        if (!item.medication || !item.dosage || !item.frequency || !item.duration) {
          return res.status(400).json({ 
            error: 'Cada item deve conter medicamento, dosagem, frequência e duração' 
          });
        }
      }

      const updateData: UpdatePrescriptionRequest = { items };

      const updatedPrescription = await PrescriptionService.updatePrescription(prescriptionId, updateData);
      
      if (!updatedPrescription) {
        return res.status(404).json({ error: 'Receita não encontrada' });
      }

      return res.json(updatedPrescription);
    } catch (error: any) {
      console.error('Erro ao atualizar receita:', error);
      if (error.message === 'Receita não encontrada') {
        return res.status(404).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // DELETE /api/prescriptions/:id - Deletar receita
  static async deletePrescription(req: Request, res: Response): Promise<Response> {
    try {
      const prescriptionId = parseInt(req.params.id);
      
      if (isNaN(prescriptionId)) {
        return res.status(400).json({ error: 'ID da receita inválido' });
      }

      const deleted = await PrescriptionService.deletePrescription(prescriptionId);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Receita não encontrada' });
      }

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar receita:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // GET /api/prescriptions - Buscar todas as receitas
  static async getAllPrescriptions(req: Request, res: Response): Promise<Response> {
    try {
      const prescriptions = await PrescriptionService.getAllPrescriptions();
      return res.json(prescriptions);
    } catch (error) {
      console.error('Erro ao buscar todas as receitas:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}