import { Router } from 'express';
import {
  createMedicalRecord,
  createDirectMedicalRecord,
  getRecordsByPet,
  getRecordByAppointment,
  getAvailableProducts
} from '../controllers/medicalRecordController';

const router = Router();

// POST /api/records/direct - Criar prontuário diretamente para um pet
router.post('/direct', createDirectMedicalRecord);

// POST /api/records/:appointmentId - Criar prontuário para um agendamento
router.post('/:appointmentId', createMedicalRecord);

// GET /api/pets/:petId/records - Buscar todos os prontuários de um pet
router.get('/pets/:petId/records', getRecordsByPet);

// GET /api/appointments/:appointmentId/record - Buscar prontuário de um agendamento
router.get('/appointments/:appointmentId/record', getRecordByAppointment);

// GET /api/records/products - Buscar produtos disponíveis para uso
router.get('/products', getAvailableProducts);

export { router as medicalRecordRoutes };