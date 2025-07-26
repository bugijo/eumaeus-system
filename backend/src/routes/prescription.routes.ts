import { Router } from 'express';
import { PrescriptionController } from '../controllers/prescription.controller';

const router = Router();

// POST /api/records/:recordId/prescriptions - Criar nova receita para um prontuário
router.post('/records/:recordId/prescriptions', PrescriptionController.createPrescription);

// GET /api/records/:recordId/prescriptions - Buscar receita por prontuário
router.get('/records/:recordId/prescriptions', PrescriptionController.getPrescriptionByMedicalRecord);

// GET /api/prescriptions/:id - Buscar receita por ID
router.get('/prescriptions/:id', PrescriptionController.getPrescriptionById);

// PUT /api/prescriptions/:id - Atualizar receita
router.put('/prescriptions/:id', PrescriptionController.updatePrescription);

// DELETE /api/prescriptions/:id - Deletar receita
router.delete('/prescriptions/:id', PrescriptionController.deletePrescription);

// GET /api/prescriptions - Buscar todas as receitas
router.get('/prescriptions', PrescriptionController.getAllPrescriptions);

export default router;