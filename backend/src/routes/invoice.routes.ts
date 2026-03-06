import { Router } from 'express';
import { InvoiceController } from '../controllers/invoice.controller';
import { requireRoles, ROLE } from '../middlewares/auth.middleware';

const router = Router();
const invoiceController = new InvoiceController();
const canAccessFinancial = requireRoles(ROLE.DONO, ROLE.VETERINARIO, ROLE.FINANCEIRO);

// POST /api/invoices/from-appointment/:appointmentId - Criar fatura a partir de agendamento
router.post('/from-appointment/:appointmentId', canAccessFinancial, invoiceController.createFromAppointment);

// GET /api/invoices/stats - Obter estatísticas financeiras
router.get('/stats', canAccessFinancial, invoiceController.getFinancialStats);

// GET /api/invoices - Listar todas as faturas
router.get('/', canAccessFinancial, invoiceController.getAll);

// GET /api/invoices/:id - Buscar fatura por ID
// GET /api/invoices/appointment/:appointmentId - Buscar fatura por ID do agendamento
router.get('/appointment/:appointmentId', canAccessFinancial, invoiceController.getByAppointmentId);

// GET /api/invoices/:id - Buscar fatura por ID
router.get('/:id', canAccessFinancial, invoiceController.getById);

// PATCH /api/invoices/:id/status - Atualizar status da fatura
router.patch('/:id/status', canAccessFinancial, invoiceController.updateStatus);

// === ROTAS NFS-E ===
// POST /api/invoices/:id/issue-nfe - Emitir NFS-e para uma fatura
router.post('/:id/issue-nfe', canAccessFinancial, invoiceController.issueNFSe);

// GET /api/invoices/:id/nfe-status - Consultar status da NFS-e
router.get('/:id/nfe-status', canAccessFinancial, invoiceController.getNFSeStatus);

// GET /api/invoices/:id/nfe-pdf - Baixar PDF da NFS-e
router.get('/:id/nfe-pdf', canAccessFinancial, invoiceController.downloadNFSePdf);

// DELETE /api/invoices/:id/cancel-nfe - Cancelar NFS-e
router.delete('/:id/cancel-nfe', canAccessFinancial, invoiceController.cancelNFSe);

export default router;
