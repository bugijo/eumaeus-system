"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceController = void 0;
const invoice_service_1 = require("../services/invoice.service");
const nfe_service_1 = require("../services/nfe.service");
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
        this.getFinancialStats = async (req, res) => {
            try {
                const stats = await this.invoiceService.getFinancialStats();
                return res.json({ data: stats });
            }
            catch (error) {
                console.error('Erro ao buscar estatísticas financeiras:', error);
                return res.status(500).json({
                    error: 'Erro interno do servidor ao buscar estatísticas financeiras'
                });
            }
        };
        this.issueNFSe = async (req, res) => {
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
                if (invoice.status !== 'PAID') {
                    return res.status(400).json({
                        error: 'Apenas faturas pagas podem gerar NFS-e'
                    });
                }
                if (invoice.nfeId) {
                    return res.status(409).json({
                        error: 'Esta fatura já possui uma NFS-e emitida',
                        nfeId: invoice.nfeId
                    });
                }
                const nfseData = {
                    prestador: {
                        cnpj: process.env.EMPRESA_CNPJ || '00.000.000/0001-00',
                        inscricaoMunicipal: process.env.EMPRESA_INSCRICAO_MUNICIPAL,
                        codigoMunicipio: process.env.EMPRESA_CODIGO_MUNICIPIO
                    },
                    tomador: {
                        cpf: invoice.appointment?.tutor?.cpf,
                        cnpj: invoice.appointment?.tutor?.cnpj,
                        razaoSocial: invoice.appointment?.tutor?.name || 'Cliente',
                        email: invoice.appointment?.tutor?.email || '',
                        endereco: {
                            logradouro: invoice.appointment?.tutor?.address || 'Não informado',
                            numero: '0',
                            bairro: 'Centro',
                            codigoMunicipio: process.env.EMPRESA_CODIGO_MUNICIPIO || '3543402',
                            uf: 'SP',
                            cep: '14000000'
                        }
                    },
                    servico: {
                        discriminacao: this.buildServiceDescription(invoice),
                        valorServicos: invoice.totalAmount,
                        aliquota: 5.0,
                        issRetido: false,
                        itemListaServico: '17.05',
                        codigoTributarioMunicipio: '1705'
                    }
                };
                const referencia = `INVOICE_${invoiceId}_${Date.now()}`;
                const nfseResponse = await nfe_service_1.nfeService.emitirNFSe(referencia, nfseData);
                await this.invoiceService.updateNFeId(invoiceId, nfseResponse.id);
                return res.status(201).json({
                    message: 'NFS-e emitida com sucesso',
                    data: {
                        nfseId: nfseResponse.id,
                        status: nfseResponse.status,
                        numero: nfseResponse.numero,
                        linkPdf: nfseResponse.linkPdf,
                        linkXml: nfseResponse.linkXml
                    }
                });
            }
            catch (error) {
                console.error('Erro ao emitir NFS-e:', error);
                return res.status(500).json({
                    error: `Erro ao emitir NFS-e: ${error.message}`
                });
            }
        };
        this.getNFSeStatus = async (req, res) => {
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
                if (!invoice.nfeId) {
                    return res.status(404).json({
                        error: 'Esta fatura não possui NFS-e emitida'
                    });
                }
                const nfseStatus = await nfe_service_1.nfeService.consultarNFSe(invoice.nfeId);
                return res.json({
                    data: nfseStatus
                });
            }
            catch (error) {
                console.error('Erro ao consultar status da NFS-e:', error);
                return res.status(500).json({
                    error: `Erro ao consultar status da NFS-e: ${error.message}`
                });
            }
        };
        this.downloadNFSePdf = async (req, res) => {
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
                if (!invoice.nfeId) {
                    return res.status(404).json({
                        error: 'Esta fatura não possui NFS-e emitida'
                    });
                }
                const pdfBuffer = await nfe_service_1.nfeService.baixarPdf(invoice.nfeId);
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="NFSe_${invoice.nfeId}.pdf"`);
                return res.send(pdfBuffer);
            }
            catch (error) {
                console.error('Erro ao baixar PDF da NFS-e:', error);
                return res.status(500).json({
                    error: `Erro ao baixar PDF da NFS-e: ${error.message}`
                });
            }
        };
        this.cancelNFSe = async (req, res) => {
            try {
                const invoiceId = parseInt(req.params.id);
                const { motivo } = req.body;
                if (isNaN(invoiceId)) {
                    return res.status(400).json({
                        error: 'ID da fatura inválido'
                    });
                }
                if (!motivo || motivo.trim().length < 15) {
                    return res.status(400).json({
                        error: 'Motivo do cancelamento é obrigatório e deve ter pelo menos 15 caracteres'
                    });
                }
                const invoice = await this.invoiceService.getById(invoiceId);
                if (!invoice) {
                    return res.status(404).json({
                        error: 'Fatura não encontrada'
                    });
                }
                if (!invoice.nfeId) {
                    return res.status(404).json({
                        error: 'Esta fatura não possui NFS-e emitida'
                    });
                }
                await nfe_service_1.nfeService.cancelarNFSe(invoice.nfeId, motivo);
                return res.json({
                    message: 'NFS-e cancelada com sucesso'
                });
            }
            catch (error) {
                console.error('Erro ao cancelar NFS-e:', error);
                return res.status(500).json({
                    error: `Erro ao cancelar NFS-e: ${error.message}`
                });
            }
        };
        this.invoiceService = new invoice_service_1.InvoiceService();
    }
    buildServiceDescription(invoice) {
        let description = 'Serviços veterinários:\n';
        if (invoice.appointment?.service) {
            description += `- ${invoice.appointment.service.name}: R$ ${invoice.appointment.service.price.toFixed(2)}\n`;
        }
        if (invoice.appointment?.appointmentProductUsages?.length > 0) {
            description += 'Produtos utilizados:\n';
            invoice.appointment.appointmentProductUsages.forEach((usage) => {
                description += `- ${usage.product.name} (${usage.quantity}x): R$ ${(usage.product.price * usage.quantity).toFixed(2)}\n`;
            });
        }
        description += `\nTotal: R$ ${invoice.totalAmount.toFixed(2)}`;
        return description;
    }
}
exports.InvoiceController = InvoiceController;
//# sourceMappingURL=invoice.controller.js.map