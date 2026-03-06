import { Router } from 'express';
import { PrescriptionController } from '../controllers/prescription.controller';
import { requireRoles, ROLE } from '../middlewares/auth.middleware';

const router = Router();

// POST /api/records/:recordId/prescriptions - Criar nova receita para um prontuário
router.post('/records/:recordId/prescriptions', requireRoles(ROLE.DONO, ROLE.VETERINARIO), PrescriptionController.createPrescription);

// GET /api/records/:recordId/prescriptions - Buscar receita por prontuário
router.get('/records/:recordId/prescriptions', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.AUXILIAR), PrescriptionController.getPrescriptionByMedicalRecord);

// GET /api/prescriptions/:id - Buscar receita por ID
router.get('/prescriptions/:id', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.AUXILIAR), PrescriptionController.getPrescriptionById);

// PUT /api/prescriptions/:id - Atualizar receita
router.put('/prescriptions/:id', requireRoles(ROLE.DONO, ROLE.VETERINARIO), PrescriptionController.updatePrescription);

// DELETE /api/prescriptions/:id - Deletar receita
router.delete('/prescriptions/:id', requireRoles(ROLE.DONO, ROLE.VETERINARIO), PrescriptionController.deletePrescription);

// GET /api/prescriptions - Buscar todas as receitas
router.get('/prescriptions', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.AUXILIAR), PrescriptionController.getAllPrescriptions);

export default router;
