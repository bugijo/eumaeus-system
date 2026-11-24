import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller';
import { requireRoles, requireRolesStrict, ROLE } from '../middlewares/auth.middleware';
import { purchaseInvoiceController } from '../controllers/purchaseInvoice.controller';

const router = Router();
const read = requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.RECEPCAO, ROLE.AUXILIAR);
const write = requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.AUXILIAR);
router.get('/lots', read, inventoryController.lots);
router.get('/movements', read, inventoryController.movements);
router.post('/receipts', write, inventoryController.receive);
router.post('/issues', write, inventoryController.issue);
router.post('/changes', write, inventoryController.change);
router.post('/adjustments', requireRolesStrict(ROLE.DONO), inventoryController.adjustment);
router.post('/losses', write, inventoryController.loss);
router.post('/returns', write, inventoryController.returnStock);
// Importação de XML de NF-e de compra.
router.get('/nfe', read, purchaseInvoiceController.list);
router.get('/nfe/:id(\\d+)/xml', read, purchaseInvoiceController.xml);
router.post('/nfe/preview', write, purchaseInvoiceController.preview);
router.post('/nfe/import', write, purchaseInvoiceController.import);
export default router;
