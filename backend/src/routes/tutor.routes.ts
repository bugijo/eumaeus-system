import { Router } from 'express';
import { TutorController } from '../controllers/tutor.controller';
import { tutorPetRoutes } from './pet.routes';
import { requireRoles, ROLE } from '../middlewares/auth.middleware';

const tutorRoutes = Router();

tutorRoutes.get('/tutors/stats', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR), TutorController.getTutorStats);
tutorRoutes.get('/tutors', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR), TutorController.getAllTutors);
tutorRoutes.get('/tutors/:id', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR), TutorController.getTutorById);
tutorRoutes.post('/tutors', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO), TutorController.createTutor);
tutorRoutes.put('/tutors/:id', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO), TutorController.updateTutor);
tutorRoutes.delete('/tutors/:id', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO), TutorController.deleteTutor);

// Rota aninhada para pets de um tutor específico
tutorRoutes.use('/tutors/:tutorId/pets', tutorPetRoutes);

export { tutorRoutes };
