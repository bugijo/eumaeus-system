import { Request, Response } from 'express';
import { ServiceService } from '../services/service.service';

export class ServiceController {
  static async createService(req: Request, res: Response) {
    try {
      const service = await ServiceService.createService({
        name: req.body.name,
        description: req.body.description,
        duration: Number(req.body.duration ?? req.body.durationMinutes),
        price: Number(req.body.price),
        category: req.body.category,
        active: req.body.active,
      });
      return res.status(201).json({ success: true, data: service });
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Dados de serviço inválidos' });
    }
  }

  static async updateService(req: Request, res: Response) {
    try {
      const service = await ServiceService.updateService(Number(req.params.id), {
        ...req.body,
        ...(req.body.duration !== undefined || req.body.durationMinutes !== undefined
          ? { duration: Number(req.body.duration ?? req.body.durationMinutes) } : {}),
        ...(req.body.price !== undefined ? { price: Number(req.body.price) } : {}),
      });
      if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });
      return res.json({ success: true, data: service });
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : 'Dados de serviço inválidos' });
    }
  }
  /**
   * GET /api/services
   * Retorna todos os serviços disponíveis
   * Query params: category (opcional), search (opcional)
   */
  static async getAllServices(req: Request, res: Response) {
    try {
      const { category, search } = req.query;
      
      let services;
      
      if (search) {
        // Busca por termo
        services = await ServiceService.searchServices(search as string);
      } else if (category) {
        // Filtra por categoria
        services = await ServiceService.getServicesByCategoryName(category as string);
      } else {
        // Retorna todos os serviços
        services = await ServiceService.getAllServices();
      }
      
      res.json({
        success: true,
        data: services,
        message: `${services.length} serviços encontrados`,
        total: services.length
      });
      
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      res.status(500).json({
        error: 'Erro interno do servidor ao buscar serviços',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
  
  /**
   * GET /api/services/categories
   * Retorna serviços agrupados por categoria
   */
  static async getServicesByCategory(req: Request, res: Response) {
    try {
      const categories = await ServiceService.getServicesByCategory();
      
      res.json({
        success: true,
        data: categories,
        message: `${categories.length} categorias encontradas`,
        total: categories.length
      });
      
    } catch (error) {
      console.error('Erro ao buscar categorias de serviços:', error);
      res.status(500).json({
        error: 'Erro interno do servidor ao buscar categorias',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
  
  /**
   * GET /api/services/:id
   * Retorna um serviço específico por ID
   */
  static async getServiceById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const serviceId = parseInt(id);
      
      if (isNaN(serviceId)) {
        return res.status(400).json({
          error: 'ID do serviço deve ser um número válido'
        });
      }
      
      const service = await ServiceService.getServiceById(serviceId);
      
      if (!service) {
        return res.status(404).json({
          error: 'Serviço não encontrado'
        });
      }
      
      return res.json({
        success: true,
        data: service,
        message: 'Serviço encontrado com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao buscar serviço por ID:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor ao buscar serviço',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
}
