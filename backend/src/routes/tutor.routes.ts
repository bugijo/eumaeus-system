import { Router } from 'express';
import { TutorController } from '../controllers/tutor.controller';

const tutorRoutes = Router();

tutorRoutes.get('/tutors', TutorController.getAllTutors);
tutorRoutes.get('/tutors/:id', TutorController.getTutorById);
tutorRoutes.post('/tutors', TutorController.createTutor);
tutorRoutes.put('/tutors/:id', TutorController.updateTutor);
tutorRoutes.delete('/tutors/:id', TutorController.deleteTutor);

export { tutorRoutes };