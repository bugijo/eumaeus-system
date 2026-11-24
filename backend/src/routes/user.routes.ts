import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { requireRoles, ROLE } from '../middlewares/auth.middleware';

const router = Router();
const anyStaff = requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR, ROLE.FINANCEIRO, ROLE.BANHO_TOSA);
const owner = requireRoles(ROLE.DONO);

router.get('/roles', anyStaff, userController.roles);
router.get('/me/access', anyStaff, userController.myAccess);
router.post('/me/password', anyStaff, userController.changeOwnPassword);
router.get('/', owner, userController.list);
router.post('/', owner, userController.create);
router.patch('/:id', owner, userController.update);
router.post('/:id/password', owner, userController.resetPassword);

export default router;
