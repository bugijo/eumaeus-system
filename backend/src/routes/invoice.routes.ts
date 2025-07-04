import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';

const router = Router();
const invoiceController = new InvoiceController();

// POST /api/invoices/from-appointment/:appointmentId - Criar fatura a partir de agendamento
router.post('/from-appointment/:appointmentId', invoiceController.createFromAppointment);

// GET /api/invoices - Listar todas as faturas
router.get('/', invoiceController.getAll);

// GET /api/invoices/:id - Buscar fatura por ID
router.get('/:id', invoiceController.getById);

// GET /api/invoices/appointment/:appointmentId - Buscar fatura por ID do agendamento
router.get('/appointment/:appointmentId', invoiceController.getByAppointmentId);

// PATCH /api/invoices/:id/status - Atualizar status da fatura
router.patch('/:id/status', invoiceController.updateStatus);

export default router;