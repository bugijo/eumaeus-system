import { Router } from 'express';
import { saleController } from '../controllers/sale.controller';
import { requireRoles, ROLE } from '../middlewares/auth.middleware';

const router = Router();
const sell = requireRoles(ROLE.DONO, ROLE.RECEPCAO, ROLE.AUXILIAR, ROLE.FINANCEIRO, ROLE.VETERINARIO);
const manage = requireRoles(ROLE.DONO, ROLE.FINANCEIRO);

router.get('/', sell, saleController.list);
router.get('/barcode/:code', sell, saleController.byBarcode);
router.get('/:id', sell, saleController.getById);
router.post('/', sell, saleController.create);
router.post('/:id/cancel', manage, saleController.cancel);

export default router;
