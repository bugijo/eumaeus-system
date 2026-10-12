import { Router } from 'express';
import { vaccinationController } from '../controllers/vaccination.controller';
import { requireRoles, ROLE } from '../middlewares/auth.middleware';

const router = Router();
router.get('/pets/:petId', requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.AUXILIAR), vaccinationController.list);
router.post('/pets/:petId', requireRoles(ROLE.DONO, ROLE.VETERINARIO), vaccinationController.create);
export default router;
