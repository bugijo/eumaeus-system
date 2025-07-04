import { Request, Response } from 'express';
import { InvoiceService } from '../services/invoice.service';

export class InvoiceController {
  private invoiceService: InvoiceService;

  constructor() {
    this.invoiceService = new InvoiceService();
  }

  // POST /api/invoices/from-appointment/:appointmentId
  createFromAppointment = async (req: Request, res: Response) => {
    try {
      const appointmentId = parseInt(req.params.appointmentId);
      
      if (isNaN(appointmentId)) {
        return res.status(400).json({ 
          error: 'ID do agendamento inválido' 
        });
      }

      const invoice = await this.invoiceService.createFromAppointment(appointmentId);
      
      res.status(201).json({
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
  getById = async (req: Request, res: Response) => {
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
      
      res.json({ data: invoice });
    } catch (error: any) {
      console.error('Erro ao buscar fatura:', error);
      return res.status(500).json({ 
        error: 'Erro interno do servidor ao buscar fatura' 
      });
    }
  };

  // GET /api/invoices/appointment/:appointmentId
  getByAppointmentId = async (req: Request, res: Response) => {
    try {
      const appointmentId = parseInt(req.params.appointmentId);
      
      if (isNaN(appointmentId)) {
        return res.status(400).json({ 
          error: 'ID do agendamento inválido' 
        });
      }

      const invoice = await this.invoiceService.getByAppointmentId(appointmentId);
      
      res.json({ data: invoice });
    } catch (error: any) {
      console.error('Erro ao buscar fatura por agendamento:', error);
      return res.status(500).json({ 
        error: 'Erro interno do servidor ao buscar fatura' 
      });
    }
  };

  // PATCH /api/invoices/:id/status
  updateStatus = async (req: Request, res: Response) => {
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
      
      res.json({
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
  getAll = async (req: Request, res: Response) => {
    try {
      const invoices = await this.invoiceService.getAll();
      
      res.json({ data: invoices });
    } catch (error: any) {
      console.error('Erro ao listar faturas:', error);
      return res.status(500).json({ 
        error: 'Erro interno do servidor ao listar faturas' 
      });
    }
  };
}