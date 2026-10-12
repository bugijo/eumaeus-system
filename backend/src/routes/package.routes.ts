import { Router } from 'express';
import { packageController } from '../controllers/package.controller';
import { requireRoles, ROLE } from '../middlewares/auth.middleware';

const router = Router();
const staff = requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO);
router.get('/', staff, packageController.list);
router.post('/', requireRoles(ROLE.DONO, ROLE.VETERINARIO), packageController.create);
router.post('/:packageId/purchases', staff, packageController.purchase);
router.get('/contracts/:contractId', staff, packageController.getContract);
router.post('/contracts/:contractId/consume', staff, packageController.consume);
router.post('/sessions/:sessionId/reverse', staff, packageController.reverse);
export default router;
