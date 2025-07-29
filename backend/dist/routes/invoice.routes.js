"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoice_controller_1 = require("../controllers/invoice.controller");
const router = (0, express_1.Router)();
const invoiceController = new invoice_controller_1.InvoiceController();
router.post('/from-appointment/:appointmentId', invoiceController.createFromAppointment);
router.get('/stats', invoiceController.getFinancialStats);
router.get('/', invoiceController.getAll);
router.get('/:id', invoiceController.getById);
router.get('/appointment/:appointmentId', invoiceController.getByAppointmentId);
router.patch('/:id/status', invoiceController.updateStatus);
router.post('/:id/issue-nfe', invoiceController.issueNFSe);
router.get('/:id/nfe-status', invoiceController.getNFSeStatus);
router.get('/:id/nfe-pdf', invoiceController.downloadNFSePdf);
router.delete('/:id/cancel-nfe', invoiceController.cancelNFSe);
exports.default = router;
//# sourceMappingURL=invoice.routes.js.map