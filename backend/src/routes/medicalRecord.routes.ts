import { Router } from 'express';
import { MedicalRecordController } from '../controllers/medicalRecord.controller';

const router = Router();

// GET /api/pets/:petId/records - Buscar todos os prontuários de um pet
router.get('/pets/:petId/records', MedicalRecordController.getRecordsByPetId);

// POST /api/appointments/:appointmentId/records - Criar novo prontuário para um agendamento
router.post('/appointments/:appointmentId/records', MedicalRecordController.createRecord);

// GET /api/records/:id - Buscar prontuário por ID
router.get('/records/:id', MedicalRecordController.getRecordById);

// GET /api/records - Buscar todos os prontuários
router.get('/records', MedicalRecordController.getAllRecords);

// GET /api/records/:recordId - Buscar prontuário específico por recordId
router.get('/records/:recordId', MedicalRecordController.getRecordById);

// PUT /api/records/:recordId - Atualizar prontuário específico
router.put('/records/:recordId', MedicalRecordController.updateRecord);

// DELETE /api/records/:recordId - Deletar prontuário específico
router.delete('/records/:recordId', MedicalRecordController.deleteRecord);

export default router;