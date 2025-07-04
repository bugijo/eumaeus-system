import { Router } from 'express';
import { PetController } from '../controllers/pet.controller';

const petRoutes = Router();

// Rotas principais de pets
petRoutes.get('/pets', PetController.getAllPets);
petRoutes.get('/pets/:id', PetController.getPetById);
petRoutes.post('/pets', PetController.createPet);
petRoutes.put('/pets/:id', PetController.updatePet);
petRoutes.delete('/pets/:id', PetController.deletePet);

// Rota aninhada para pets de um tutor específico
const tutorPetRoutes = Router({ mergeParams: true });
tutorPetRoutes.get('/', PetController.getPetsByTutor);
tutorPetRoutes.post('/', PetController.createPetForTutor);

export { petRoutes, tutorPetRoutes };