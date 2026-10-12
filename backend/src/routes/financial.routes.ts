import { Router } from 'express';
import { financialController } from '../controllers/financial.controller';
import { requireRoles, ROLE } from '../middlewares/auth.middleware';

const router = Router();
const read = requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.FINANCEIRO);
const write = requireRoles(ROLE.DONO, ROLE.FINANCEIRO);
router.get('/centers', read, financialController.centers);
router.get('/expenses', read, financialController.expenses);
router.post('/centers', write, financialController.createCenter);
router.post('/expenses', write, financialController.createExpense);
router.post('/invoices/:id/payments', write, financialController.receive);
router.post('/payments/:paymentId/reverse', write, financialController.reverse);
export default router;
