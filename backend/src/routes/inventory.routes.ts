import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller';
import { requireRoles, ROLE } from '../middlewares/auth.middleware';

const router = Router();
const read = requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR);
const write = requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.AUXILIAR);
router.get('/lots', read, inventoryController.lots);
router.get('/movements', read, inventoryController.movements);
router.post('/receipts', write, inventoryController.receive);
router.post('/issues', write, inventoryController.issue);
router.post('/changes', write, inventoryController.change);
router.post('/adjustments', requireRoles(ROLE.DONO), inventoryController.adjustment);
router.post('/losses', write, inventoryController.loss);
router.post('/returns', write, inventoryController.returnStock);
export default router;
