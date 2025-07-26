import { Router } from 'express';
import { TutorController } from '../controllers/tutor.controller';
import { tutorPetRoutes } from './pet.routes';

const tutorRoutes = Router();

tutorRoutes.get('/tutors/stats', TutorController.getTutorStats);
tutorRoutes.get('/tutors', TutorController.getAllTutors);
tutorRoutes.get('/tutors/:id', TutorController.getTutorById);
tutorRoutes.post('/tutors', TutorController.createTutor);
tutorRoutes.put('/tutors/:id', TutorController.updateTutor);
tutorRoutes.delete('/tutors/:id', TutorController.deleteTutor);

// Rota aninhada para pets de um tutor específico
tutorRoutes.use('/tutors/:tutorId/pets', tutorPetRoutes);

export { tutorRoutes };