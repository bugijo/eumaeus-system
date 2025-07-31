import { Request, Response } from 'express';
import { InvoiceService } from '../services/invoice.service';
import { nfeService, NFSeData } from '../services/nfe.service';
import { InvoiceWithRelations } from '../types';

export class InvoiceController {
  private invoiceService: InvoiceService;

  constructor() {
    this.invoiceService = new InvoiceService();
  }

  // POST /api/invoices/from-appointment/:appointmentId
  createFromAppointment = async (req: Request, res: Response): Promise<Response | void> => {
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
    } catch (error: any) {
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

  // GET /api/invoices/:id
  getById = async (req: Request, res: Response): Promise<Response | void> => {
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
    } catch (error: any) {
      console.error('Erro ao buscar fatura:', error);
      return res.status(500).json({ 
        error: 'Erro interno do servidor ao buscar fatura' 
      });
    }
  };

  // GET /api/invoices/appointment/:appointmentId
  getByAppointmentId = async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const appointmentId = parseInt(req.params.appointmentId);
      
      if (isNaN(appointmentId)) {
        return res.status(400).json({ 
          error: 'ID do agendamento inválido' 
        });
      }

      const invoice = await this.invoiceService.getByAppointmentId(appointmentId);
      
      return res.json({ data: invoice });
    } catch (error: any) {
      console.error('Erro ao buscar fatura por agendamento:', error);
      return res.status(500).json({ 
        error: 'Erro interno do servidor ao buscar fatura' 
      });
    }
  };

  // PATCH /api/invoices/:id/status
  updateStatus = async (req: Request, res: Response): Promise<Response | void> => {
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
    } catch (error: any) {
      console.error('Erro ao atualizar status da fatura:', error);
      
      if (error.message.includes('não encontrada')) {
        return res.status(404).json({ error: error.message });
      }
      
      return res.status(500).json({ 
        error: 'Erro interno do servidor ao atualizar fatura' 
      });
    }
  };

  // GET /api/invoices
  getAll = async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const invoices = await this.invoiceService.getAll();
      
      return res.json({ data: invoices });
    } catch (error: any) {
      console.error('Erro ao listar faturas:', error);
      return res.status(500).json({ 
        error: 'Erro interno do servidor ao listar faturas' 
      });
    }
  };

  // GET /api/invoices/stats - Obter estatísticas financeiras
  getFinancialStats = async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const stats = await this.invoiceService.getFinancialStats();
      
      return res.json({ data: stats });
    } catch (error: any) {
      console.error('Erro ao buscar estatísticas financeiras:', error);
      return res.status(500).json({ 
        error: 'Erro interno do servidor ao buscar estatísticas financeiras' 
      });
    }
  };

  // POST /api/invoices/:id/issue-nfe - Emitir NFS-e para uma fatura
  issueNFSe = async (req: Request, res: Response): Promise<Response | void> => {
    try {
      const invoiceId = parseInt(req.params.id);
      
      if (isNaN(invoiceId)) {
        return res.status(400).json({ 
          error: 'ID da fatura inválido' 
        });
      }

      // Buscar a fatura com todos os dados necessários
      const invoice: InvoiceWithRelations | null = await this.invoiceService.getById(invoiceId);
      
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

      // Verificar se já existe uma NFS-e para esta fatura
      if (invoice.nfeId) {
        return res.status(409).json({ 
          error: 'Esta fatura já possui uma NFS-e emitida',
          nfeId: invoice.nfeId
        });
      }

      // Preparar dados para emissão da NFS-e
      const nfseData: NFSeData = {
        prestador: {
          cnpj: process.env.EMPRESA_CNPJ || '00.000.000/0001-00',
          inscricaoMunicipal: process.env.EMPRESA_INSCRICAO_MUNICIPAL,
          codigoMunicipio: process.env.EMPRESA_CODIGO_MUNICIPIO
        },
        tomador: {
          cpf: '',
          cnpj: '',
          razaoSocial: invoice.appointment?.pet?.tutor?.name || 'Cliente',
          email: invoice.appointment?.pet?.tutor?.email || '',
          endereco: {
            logradouro: invoice.appointment?.pet?.tutor?.address || 'Não informado',
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
          aliquota: 5.0, // 5% de ISS
          issRetido: false,
          itemListaServico: '17.05', // Código para serviços veterinários
          codigoTributarioMunicipio: '1705'
        }
      };

      // Gerar referência única para a NFS-e
      const referencia = `INVOICE_${invoiceId}_${Date.now()}`;

      // Emitir a NFS-e
      const nfseResponse = await nfeService.emitirNFSe(referencia, nfseData);

      // Atualizar a fatura com o ID da NFS-e
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
    } catch (error: any) {
      console.error('Erro ao emitir NFS-e:', error);
      return res.status(500).json({ 
        error: `Erro ao emitir NFS-e: ${error.message}` 
      });
    }
  };

  // GET /api/invoices/:id/nfe-status - Consultar status da NFS-e
  getNFSeStatus = async (req: Request, res: Response): Promise<Response | void> => {
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

      // Consultar status na Focus NFe
      const nfseStatus = await nfeService.consultarNFSe(invoice.nfeId);

      return res.json({
        data: nfseStatus
      });
    } catch (error: any) {
      console.error('Erro ao consultar status da NFS-e:', error);
      return res.status(500).json({ 
        error: `Erro ao consultar status da NFS-e: ${error.message}` 
      });
    }
  };

  // GET /api/invoices/:id/nfe-pdf - Baixar PDF da NFS-e
  downloadNFSePdf = async (req: Request, res: Response): Promise<Response | void> => {
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

      // Baixar PDF da Focus NFe
      const pdfBuffer = await nfeService.baixarPdf(invoice.nfeId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="NFSe_${invoice.nfeId}.pdf"`);
      
      return res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Erro ao baixar PDF da NFS-e:', error);
      return res.status(500).json({ 
        error: `Erro ao baixar PDF da NFS-e: ${error.message}` 
      });
    }
  };

  // DELETE /api/invoices/:id/cancel-nfe - Cancelar NFS-e
  cancelNFSe = async (req: Request, res: Response): Promise<Response | void> => {
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

      // Cancelar na Focus NFe
      await nfeService.cancelarNFSe(invoice.nfeId, motivo);

      return res.json({
        message: 'NFS-e cancelada com sucesso'
      });
    } catch (error: any) {
      console.error('Erro ao cancelar NFS-e:', error);
      return res.status(500).json({ 
        error: `Erro ao cancelar NFS-e: ${error.message}` 
      });
    }
  };

  /**
   * Constrói a descrição dos serviços para a NFS-e
   */
  private buildServiceDescription(invoice: any): string {
    let description = 'Serviços veterinários:\n';
    
    if (invoice.appointment?.service) {
      description += `- ${invoice.appointment.service.name}: R$ ${invoice.appointment.service.price.toFixed(2)}\n`;
    }
    
    if (invoice.appointment?.appointmentProductUsages?.length > 0) {
      description += 'Produtos utilizados:\n';
      invoice.appointment.appointmentProductUsages.forEach((usage: any) => {
        description += `- ${usage.product.name} (${usage.quantity}x): R$ ${(usage.product.price * usage.quantity).toFixed(2)}\n`;
      });
    }
    
    description += `\nTotal: R$ ${invoice.totalAmount.toFixed(2)}`;
    
    return description;
  }
}