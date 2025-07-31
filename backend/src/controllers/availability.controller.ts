import { Request, Response } from 'express';
import { AvailabilityService } from '../services/availability.service';
import { AvailabilityRequest } from '../models/availability.model';

export class AvailabilityController {
  /**
   * GET /api/availability
   * Retorna os horários disponíveis para um mês/ano específico
   * Query params: year, month, serviceType (opcional)
   */
  static async getAvailability(req: Request, res: Response) {
    try {
      const { year, month, serviceType } = req.query;
      
      // Validação dos parâmetros obrigatórios
      if (!year || !month) {
        return res.status(400).json({
          error: 'Parâmetros year e month são obrigatórios',
          example: '/api/availability?year=2025&month=1'
        });
      }
      
      const yearNum = parseInt(year as string);
      const monthNum = parseInt(month as string);
      
      // Validação dos valores
      if (isNaN(yearNum) || isNaN(monthNum)) {
        return res.status(400).json({
          error: 'Year e month devem ser números válidos'
        });
      }
      
      if (monthNum < 1 || monthNum > 12) {
        return res.status(400).json({
          error: 'Month deve estar entre 1 e 12'
        });
      }
      
      // Validação para não permitir consulta de meses passados
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
        return res.status(400).json({
          error: 'Não é possível consultar disponibilidade de meses passados'
        });
      }
      
      const request: AvailabilityRequest = {
        year: yearNum,
        month: monthNum,
        serviceType: serviceType as string
      };
      
      const availability = AvailabilityService.getAvailability(request);
      
      return res.json({
        success: true,
        data: availability,
        message: `Disponibilidade para ${monthNum}/${yearNum} calculada com sucesso`
      });
      
    } catch (error) {
      console.error('Erro ao buscar disponibilidade:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor ao calcular disponibilidade',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
  
  /**
   * GET /api/availability/check
   * Verifica se um horário específico está disponível
   * Query params: date (YYYY-MM-DD), time (HH:mm)
   */
  static async checkSlotAvailability(req: Request, res: Response) {
    try {
      const { date, time } = req.query;
      
      if (!date || !time) {
        return res.status(400).json({
          error: 'Parâmetros date e time são obrigatórios',
          example: '/api/availability/check?date=2025-01-15&time=09:00'
        });
      }
      
      // Validação do formato da data
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date as string)) {
        return res.status(400).json({
          error: 'Date deve estar no formato YYYY-MM-DD'
        });
      }
      
      // Validação do formato da hora
      const timeRegex = /^\d{2}:\d{2}$/;
      if (!timeRegex.test(time as string)) {
        return res.status(400).json({
          error: 'Time deve estar no formato HH:mm'
        });
      }
      
      const isAvailable = await AvailabilityService.isSlotAvailable(
        date as string, 
        time as string
      );
      
      return res.json({
        success: true,
        data: {
          date,
          time,
          available: isAvailable
        },
        message: `Horário ${time} do dia ${date} ${isAvailable ? 'está disponível' : 'não está disponível'}`
      });
      
    } catch (error) {
      console.error('Erro ao verificar disponibilidade do slot:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor ao verificar disponibilidade',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
}