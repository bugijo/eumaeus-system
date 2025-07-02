import { Router } from 'express';
import { PetController } from '../controllers/pet.controller';

const petRoutes = Router();

petRoutes.get('/pets', PetController.getAllPets);
petRoutes.get('/pets/:id', PetController.getPetById);
petRoutes.post('/pets', PetController.createPet);
petRoutes.put('/pets/:id', PetController.updatePet);
petRoutes.delete('/pets/:id', PetController.deletePet);

export { petRoutes };