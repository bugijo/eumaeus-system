import { Request, Response } from 'express';
import { TutorService } from '../services/tutor.service';

export class TutorController {
  static getAllTutors(req: Request, res: Response): Response | void {
    try {
      const tutors = TutorService.getAllTutors();
      return res.status(200).json(tutors);
    } catch (error) {
      console.error('Erro ao buscar tutores:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static createTutor(req: Request, res: Response): Response | void {
    try {
      const newTutorData = req.body;
      const createdTutor = TutorService.createTutor(newTutorData);
      return res.status(201).json(createdTutor);
    } catch (error) {
      console.error('Erro ao criar tutor:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static getTutorById(req: Request, res: Response): Response | void {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      
      const tutor = TutorService.getTutorById(id);
      
      if (!tutor) {
        return res.status(404).json({ error: 'Tutor não encontrado' });
      }
      
      return res.status(200).json(tutor);
    } catch (error) {
      console.error('Erro ao buscar tutor:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static updateTutor(req: Request, res: Response): Response | void {
    try {
      const id = parseInt(req.params.id);
      const updatedData = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      
      const updatedTutor = TutorService.updateTutor(id, updatedData);
      
      if (!updatedTutor) {
        return res.status(404).json({ error: 'Tutor não encontrado' });
      }
      
      return res.status(200).json(updatedTutor);
    } catch (error) {
      console.error('Erro ao atualizar tutor:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static deleteTutor(req: Request, res: Response): Response | void {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      
      const deleted = TutorService.deleteTutor(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Tutor não encontrado' });
      }
      
      return res.status(200).json({ message: 'Tutor deletado com sucesso' });
    } catch (error) {
      console.error('Erro ao deletar tutor:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}