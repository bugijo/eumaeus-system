import { Router } from 'express';
import { authenticateTutor } from '../middlewares/auth.middleware';
import portalController from '../controllers/portal.controller';

const router = Router();

// Todas as rotas do portal são protegidas e específicas para tutores
router.use(authenticateTutor);

// GET /api/portal/my-pets - Busca os pets do tutor logado
router.get('/my-pets', portalController.getMyPets);

// GET /api/portal/my-pets/:petId - Busca um pet específico do tutor logado
router.get('/my-pets/:petId', portalController.getMyPetById);

// GET /api/portal/my-appointments - Busca os agendamentos do tutor logado
router.get('/my-appointments', portalController.getMyAppointments);

// POST /api/portal/my-appointments - Cria um novo agendamento para o tutor logado
router.post('/my-appointments', portalController.createAppointment);

// GET /api/portal/pets/:petId/records - Busca o histórico médico de um pet do tutor logado
router.get('/pets/:petId/records', portalController.getPetMedicalHistory);

// GET /api/portal/my-profile - Busca os dados do perfil do tutor logado
router.get('/my-profile', portalController.getMyProfile);

// PUT /api/portal/my-profile - Atualiza os dados do perfil do tutor logado
router.put('/my-profile', portalController.updateMyProfile);

export { router as portalRoutes };