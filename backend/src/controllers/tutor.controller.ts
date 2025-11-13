import { Request, Response } from 'express';
import { ServiceError, TutorService } from '../services/tutor.service';

export class TutorController {
  static async getTutorStats(req: Request, res: Response): Promise<Response> {
    try {
      const stats = await TutorService.getTutorStats();
      return res.status(200).json(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas de tutores:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async getAllTutors(req: Request, res: Response): Promise<Response> {
    try {
      const pageParam = Number(req.query.page ?? 1);
      const limitParam = Number(req.query.limit ?? 10);

      const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
      const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 10;

      const tutors = await TutorService.getAllTutors();
      const total = tutors.length;
      const start = (page - 1) * limit;
      const data = tutors.slice(start, start + limit);

      return res.status(200).json({
        data,
        total,
        page,
        limit,
      });
    } catch (error) {
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao buscar tutores:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async createTutor(req: Request, res: Response): Promise<Response> {
    try {
      const newTutorData = req.body;
      const createdTutor = await TutorService.createTutor(newTutorData);
      return res.status(201).json(createdTutor);
    } catch (error) {
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao criar tutor:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async getTutorById(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      
      const tutor = await TutorService.getTutorById(id);

      if (!tutor) {
        return res.status(404).json({ error: 'Tutor não encontrado' });
      }

      return res.status(200).json(tutor);
    } catch (error) {
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao buscar tutor:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async updateTutor(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id);
      const updatedData = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      
      const updatedTutor = await TutorService.updateTutor(id, updatedData);
      
      if (!updatedTutor) {
        return res.status(404).json({ error: 'Tutor não encontrado' });
      }

      return res.status(200).json(updatedTutor);
    } catch (error) {
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao atualizar tutor:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async deleteTutor(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      
      const deleted = await TutorService.deleteTutor(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Tutor não encontrado' });
      }

      return res.status(200).json({ message: 'Tutor deletado com sucesso' });
    } catch (error) {
      if (error instanceof ServiceError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Erro ao deletar tutor:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}