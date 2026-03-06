import { Router } from 'express';
import { PetController } from '../controllers/pet.controller';
import { requireRoles, ROLE } from '../middlewares/auth.middleware';

const petRoutes = Router();

// Rotas principais de pets
petRoutes.get('/pets', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR), PetController.getAllPets);
petRoutes.get('/pets/:id', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR), PetController.getPetById);
petRoutes.post('/pets', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO), PetController.createPet);
petRoutes.put('/pets/:id', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO), PetController.updatePet);
petRoutes.delete('/pets/:id', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO), PetController.deletePet);

// Rota aninhada para pets de um tutor específico
const tutorPetRoutes = Router({ mergeParams: true });
tutorPetRoutes.get('/', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR), PetController.getPetsByTutor);
tutorPetRoutes.post('/', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO), PetController.createPetForTutor);

export { petRoutes, tutorPetRoutes };
