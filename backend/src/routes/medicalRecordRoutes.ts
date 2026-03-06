import { Router } from 'express';
import {
  createMedicalRecord,
  createDirectMedicalRecord,
  getRecordsByPet,
  getRecordByAppointment,
  getAvailableProducts
} from '../controllers/medicalRecordController';
import { authenticateUser, requireRoles, ROLE } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticateUser);

// POST /api/records/direct - Criar prontuário diretamente para um pet
router.post('/direct', requireRoles(ROLE.DONO, ROLE.VETERINARIO), createDirectMedicalRecord);

// POST /api/records/:appointmentId - Criar prontuário para um agendamento
router.post('/:appointmentId', requireRoles(ROLE.DONO, ROLE.VETERINARIO), createMedicalRecord);

// GET /api/pets/:petId/records - Buscar todos os prontuários de um pet
router.get('/pets/:petId/records', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.AUXILIAR), getRecordsByPet);

// GET /api/appointments/:appointmentId/record - Buscar prontuário de um agendamento
router.get('/appointments/:appointmentId/record', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.AUXILIAR), getRecordByAppointment);

// GET /api/records/products - Buscar produtos disponíveis para uso
router.get('/products', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.AUXILIAR), getAvailableProducts);

export { router as medicalRecordRoutes };
