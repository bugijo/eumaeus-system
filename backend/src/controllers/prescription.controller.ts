import { Request, Response } from 'express';
import { PrescriptionService } from '../services/prescription.service';
import { CreatePrescriptionRequest, UpdatePrescriptionRequest } from '../models/prescription.model';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

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

      const veterinarianUserId = (req as AuthenticatedRequest).user?.id;
      if (!veterinarianUserId) return res.status(401).json({ error: 'Veterinária responsável não identificada' });
      const newPrescription = await PrescriptionService.createPrescription(prescriptionData, veterinarianUserId);
      return res.status(201).json(newPrescription);
    } catch (error: any) {
      console.error('Erro ao criar receita:', error);
      if (error.message === 'Prontuário médico não encontrado') {
        return res.status(404).json({ error: error.message });
      }
      if (error.message === 'Já existe uma receita para este prontuário') {
        return res.status(409).json({ error: error.message });
      }
      if (error.message.includes('Apenas usuário veterinário')) return res.status(403).json({ error: error.message });
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
      if (error.message.includes('imutável') || error.message.includes('obrigatória')) return res.status(409).json({ error: error.message });
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async reviewPrescription(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id); const reviewer = (req as AuthenticatedRequest).user?.id;
      if (isNaN(id) || !reviewer) return res.status(400).json({ error: 'Dados de revisão inválidos' });
      return res.json(await PrescriptionService.review(id, reviewer, String(req.body.status).toUpperCase() as 'APPROVED' | 'REJECTED', req.body.reviewNotes));
    } catch (error: any) { return res.status(error?.message?.includes('veterinário') ? 403 : 400).json({ error: error instanceof Error ? error.message : 'Revisão recusada' }); }
  }

  static async printPrescription(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id); const prescription: any = await PrescriptionService.getPrescriptionById(id);
      if (!prescription) return res.status(404).send('Receita não encontrada');
      const items = (prescription.items || []).map((item: any) => `<li><strong>${escapeHtml(item.medication)}</strong> — ${escapeHtml(item.dosage)}, ${escapeHtml(item.frequency)}, ${escapeHtml(item.duration)}${item.instructions ? ` — ${escapeHtml(item.instructions)}` : ''}</li>`).join('');
      return res.type('html').send(`<!doctype html><html><head><meta charset="utf-8"><title>Receita ${escapeHtml(prescription.id)}</title><style>body{font-family:Arial;margin:40px} @media print{button{display:none}}</style></head><body><button onclick="window.print()">Imprimir / salvar como PDF</button><h1>${escapeHtml(prescription.clinicNameSnapshot)}</h1><p>Pet: ${escapeHtml(prescription.petNameSnapshot)}<br>Tutor: ${escapeHtml(prescription.tutorNameSnapshot)}<br>Veterinária: ${escapeHtml(prescription.veterinarianNameSnapshot)}</p><p>Status: ${escapeHtml(prescription.status)} · Assinatura: ${escapeHtml(prescription.signatureMode)}</p><ol>${items}</ol><p>Este documento contém assinatura visual; não é assinatura digital verificável.</p></body></html>`);
    } catch { return res.status(500).send('Não foi possível preparar a impressão'); }
  }

  static async getPrescriptionVersions(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'ID da receita inválido' });
      const versions = await PrescriptionService.getVersions(id);
      if (!versions) return res.status(404).json({ error: 'Receita não encontrada' });
      return res.json(versions);
    } catch { return res.status(500).json({ error: 'Erro interno do servidor' }); }
  }

  // DELETE /api/prescriptions/:id - Cancelar receita preservando o histórico
  static async deletePrescription(req: Request, res: Response): Promise<Response> {
    try {
      const prescriptionId = parseInt(req.params.id);
      
      if (isNaN(prescriptionId)) {
        return res.status(400).json({ error: 'ID da receita inválido' });
      }

      const actor = (req as AuthenticatedRequest).user?.id;
      if (!actor) return res.status(401).json({ error: 'Usuário não identificado' });
      const deleted = await PrescriptionService.cancel(prescriptionId, actor, String(req.body?.reason || ''));
      
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
