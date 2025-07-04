import { Request, Response } from 'express';
import { Pet } from '../models/pet.model';
import { PetService } from '../services/pet.service';

export class PetController {
  static getAllPets(req: Request, res: Response): Response | void {
    try {
      const pets = PetService.getAllPets();
      return res.status(200).json(pets);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static createPet(req: Request, res: Response): Response | void {
    try {
      const newPetData = req.body;
      const createdPet = PetService.createPet(newPetData);
      return res.status(201).json(createdPet);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static getPetById(req: Request, res: Response): Response | void {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      
      const pet = PetService.getPetById(id);
      
      if (!pet) {
        return res.status(404).json({ error: 'Pet não encontrado' });
      }
      
      return res.status(200).json(pet);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static updatePet(req: Request, res: Response): Response | void {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      
      const updatedPet = PetService.updatePet(id, updateData);
      
      if (!updatedPet) {
        return res.status(404).json({ error: 'Pet não encontrado' });
      }
      
      return res.status(200).json(updatedPet);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static deletePet(req: Request, res: Response): Response | void {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      
      const deleted = PetService.deletePet(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Pet não encontrado' });
      }
      
      return res.status(200).json({ message: 'Pet excluído com sucesso' });
    } catch (error) {
      console.error(error);
      if (error instanceof Error && error.message.includes('registros associados')) {
        return res.status(400).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static getPetsByTutor(req: Request, res: Response): Response | void {
    try {
      const tutorId = parseInt(req.params.tutorId);
      
      if (isNaN(tutorId)) {
        return res.status(400).json({ error: 'ID do tutor inválido' });
      }
      
      const pets = PetService.getPetsByTutorId(tutorId);
      return res.status(200).json(pets);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static createPetForTutor(req: Request, res: Response): Response | void {
    try {
      const tutorId = parseInt(req.params.tutorId);
      
      if (isNaN(tutorId)) {
        return res.status(400).json({ error: 'ID do tutor inválido' });
      }
      
      const newPetData = {
        ...req.body,
        tutorId: tutorId
      };
      
      const createdPet = PetService.createPet(newPetData);
      return res.status(201).json(createdPet);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}