import { Request, Response } from 'express';
import { Pet } from '../models/pet.model';
import { PetService } from '../services/pet.service';

export class PetController {
  static getAllPets(req: Request, res: Response): void {
    try {
      const pets = PetService.getAllPets();
      res.status(200).json(pets);
    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static createPet(req: Request, res: Response): void {
    try {
      const newPetData = req.body;
      const createdPet = PetService.createPet(newPetData);
      res.status(201).json(createdPet);
    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static getPetById(req: Request, res: Response): void {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID inválido' });
        return;
      }
      
      const pet = PetService.getPetById(id);
      
      if (!pet) {
        res.status(404).json({ error: 'Pet não encontrado' });
        return;
      }
      
      res.status(200).json(pet);
    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static updatePet(req: Request, res: Response): void {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID inválido' });
        return;
      }
      
      const updatedPet = PetService.updatePet(id, updateData);
      
      if (!updatedPet) {
        res.status(404).json({ error: 'Pet não encontrado' });
        return;
      }
      
      res.status(200).json(updatedPet);
    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static deletePet(req: Request, res: Response): void {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID inválido' });
        return;
      }
      
      const deleted = PetService.deletePet(id);
      
      if (!deleted) {
        res.status(404).json({ error: 'Pet não encontrado' });
        return;
      }
      
      res.status(200).json({ message: 'Pet excluído com sucesso' });
    } catch (error) {
      if (error instanceof Error && error.message.includes('registros associados')) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static getPetsByTutor(req: Request, res: Response): void {
    try {
      const tutorId = parseInt(req.params.tutorId);
      
      if (isNaN(tutorId)) {
        res.status(400).json({ error: 'ID do tutor inválido' });
        return;
      }
      
      const pets = PetService.getPetsByTutorId(tutorId);
      res.status(200).json(pets);
    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static createPetForTutor(req: Request, res: Response): void {
    try {
      const tutorId = parseInt(req.params.tutorId);
      
      if (isNaN(tutorId)) {
        res.status(400).json({ error: 'ID do tutor inválido' });
        return;
      }
      
      const newPetData = {
        ...req.body,
        tutorId: tutorId
      };
      
      const createdPet = PetService.createPet(newPetData);
      res.status(201).json(createdPet);
    } catch (error) {
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}