"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceController = void 0;
const invoice_service_1 = require("../services/invoice.service");
class InvoiceController {
    constructor() {
        this.createFromAppointment = async (req, res) => {
            try {
                const appointmentId = parseInt(req.params.appointmentId);
                if (isNaN(appointmentId)) {
                    return res.status(400).json({
                        error: 'ID do agendamento inválido'
                    });
                }
                const invoice = await this.invoiceService.createFromAppointment(appointmentId);
                return res.status(201).json({
                    message: 'Fatura criada com sucesso',
                    data: invoice
                });
            }
            catch (error) {
                console.error('Erro ao criar fatura:', error);
                if (error.message.includes('não encontrado')) {
                    return res.status(404).json({ error: error.message });
                }
                if (error.message.includes('já possui uma fatura')) {
                    return res.status(409).json({ error: error.message });
                }
                return res.status(500).json({
                    error: 'Erro interno do servidor ao criar fatura'
                });
            }
        };
        this.getById = async (req, res) => {
            try {
                const invoiceId = parseInt(req.params.id);
                if (isNaN(invoiceId)) {
                    return res.status(400).json({
                        error: 'ID da fatura inválido'
                    });
                }
                const invoice = await this.invoiceService.getById(invoiceId);
                if (!invoice) {
                    return res.status(404).json({
                        error: 'Fatura não encontrada'
                    });
                }
                return res.json({ data: invoice });
            }
            catch (error) {
                console.error('Erro ao buscar fatura:', error);
                return res.status(500).json({
                    error: 'Erro interno do servidor ao buscar fatura'
                });
            }
        };
        this.getByAppointmentId = async (req, res) => {
            try {
                const appointmentId = parseInt(req.params.appointmentId);
                if (isNaN(appointmentId)) {
                    return res.status(400).json({
                        error: 'ID do agendamento inválido'
                    });
                }
                const invoice = await this.invoiceService.getByAppointmentId(appointmentId);
                return res.json({ data: invoice });
            }
            catch (error) {
                console.error('Erro ao buscar fatura por agendamento:', error);
                return res.status(500).json({
                    error: 'Erro interno do servidor ao buscar fatura'
                });
            }
        };
        this.updateStatus = async (req, res) => {
            try {
                const invoiceId = parseInt(req.params.id);
                const { status } = req.body;
                if (isNaN(invoiceId)) {
                    return res.status(400).json({
                        error: 'ID da fatura inválido'
                    });
                }
                if (!status || !['PENDING', 'PAID', 'CANCELLED'].includes(status)) {
                    return res.status(400).json({
                        error: 'Status inválido. Use: PENDING, PAID ou CANCELLED'
                    });
                }
                const invoice = await this.invoiceService.updateStatus(invoiceId, status);
                return res.json({
                    message: 'Status da fatura atualizado com sucesso',
                    data: invoice
                });
            }
            catch (error) {
                console.error('Erro ao atualizar status da fatura:', error);
                if (error.message.includes('não encontrada')) {
                    return res.status(404).json({ error: error.message });
                }
                return res.status(500).json({
                    error: 'Erro interno do servidor ao atualizar fatura'
                });
            }
        };
        this.getAll = async (req, res) => {
            try {
                const invoices = await this.invoiceService.getAll();
                return res.json({ data: invoices });
            }
            catch (error) {
                console.error('Erro ao listar faturas:', error);
                return res.status(500).json({
                    error: 'Erro interno do servidor ao listar faturas'
                });
            }
        };
        this.invoiceService = new invoice_service_1.InvoiceService();
    }
}
exports.InvoiceController = InvoiceController;
//# sourceMappingURL=invoice.controller.js.map