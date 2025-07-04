"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const invoice_controller_1 = require("../controllers/invoice.controller");
const router = (0, express_1.Router)();
const invoiceController = new invoice_controller_1.InvoiceController();
router.post('/from-appointment/:appointmentId', invoiceController.createFromAppointment);
router.get('/', invoiceController.getAll);
router.get('/:id', invoiceController.getById);
router.get('/appointment/:appointmentId', invoiceController.getByAppointmentId);
router.patch('/:id/status', invoiceController.updateStatus);
exports.default = router;
//# sourceMappingURL=invoice.routes.js.map