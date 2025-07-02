import { Request, Response } from 'express';
import { TutorService } from '../services/tutor.service';

export class TutorController {
  static getAllTutors(req: Request, res: Response): void {
    try {
      const tutors = TutorService.getAllTutors();
      res.status(200).json(tutors);
    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static createTutor(req: Request, res: Response): void {
    try {
      const newTutorData = req.body;
      const createdTutor = TutorService.createTutor(newTutorData);
      res.status(201).json(createdTutor);
    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static getTutorById(req: Request, res: Response): void {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID inválido' });
        return;
      }
      
      const tutor = TutorService.getTutorById(id);
      
      if (!tutor) {
        res.status(404).json({ error: 'Tutor não encontrado' });
        return;
      }
      
      res.status(200).json(tutor);
    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static updateTutor(req: Request, res: Response): void {
    try {
      const id = parseInt(req.params.id);
      const updatedData = req.body;
      
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID inválido' });
        return;
      }
      
      const updatedTutor = TutorService.updateTutor(id, updatedData);
      
      if (!updatedTutor) {
        res.status(404).json({ error: 'Tutor não encontrado' });
        return;
      }
      
      res.status(200).json(updatedTutor);
    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static deleteTutor(req: Request, res: Response): void {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID inválido' });
        return;
      }
      
      const deleted = TutorService.deleteTutor(id);
      
      if (!deleted) {
        res.status(404).json({ error: 'Tutor não encontrado' });
        return;
      }
      
      res.status(200).json({ message: 'Tutor deletado com sucesso' });
    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}