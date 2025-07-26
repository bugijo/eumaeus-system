import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';

const router = Router();
const invoiceController = new InvoiceController();

// POST /api/invoices/from-appointment/:appointmentId - Criar fatura a partir de agendamento
router.post('/from-appointment/:appointmentId', invoiceController.createFromAppointment);

// GET /api/invoices/stats - Obter estatísticas financeiras
router.get('/stats', invoiceController.getFinancialStats);

// GET /api/invoices - Listar todas as faturas
router.get('/', invoiceController.getAll);

// GET /api/invoices/:id - Buscar fatura por ID
router.get('/:id', invoiceController.getById);

// GET /api/invoices/appointment/:appointmentId - Buscar fatura por ID do agendamento
router.get('/appointment/:appointmentId', invoiceController.getByAppointmentId);

// PATCH /api/invoices/:id/status - Atualizar status da fatura
router.patch('/:id/status', invoiceController.updateStatus);

// === ROTAS NFS-E ===
// POST /api/invoices/:id/issue-nfe - Emitir NFS-e para uma fatura
router.post('/:id/issue-nfe', invoiceController.issueNFSe);

// GET /api/invoices/:id/nfe-status - Consultar status da NFS-e
router.get('/:id/nfe-status', invoiceController.getNFSeStatus);

// GET /api/invoices/:id/nfe-pdf - Baixar PDF da NFS-e
router.get('/:id/nfe-pdf', invoiceController.downloadNFSePdf);

// DELETE /api/invoices/:id/cancel-nfe - Cancelar NFS-e
router.delete('/:id/cancel-nfe', invoiceController.cancelNFSe);

export default router;