import { Request, Response } from 'express';
import { Pet } from '../models/pet.model';
import { PetService } from '../services/pet.service';

export class PetController {
  static async getAllPets(req: Request, res: Response): Promise<Response> {
    try {
      const pets = await PetService.getAllPets();
      return res.status(200).json(pets);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async createPet(req: Request, res: Response): Promise<Response> {
    try {
      const newPetData = req.body;
      const createdPet = await PetService.createPet(newPetData);
      return res.status(201).json(createdPet);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async getPetById(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      
      const pet = await PetService.getPetById(id);
      
      if (!pet) {
        return res.status(404).json({ error: 'Pet não encontrado' });
      }
      
      return res.status(200).json(pet);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async updatePet(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      
      const updatedPet = await PetService.updatePet(id, updateData);
      
      if (!updatedPet) {
        return res.status(404).json({ error: 'Pet não encontrado' });
      }
      
      return res.status(200).json(updatedPet);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async deletePet(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }
      
      const deleted = await PetService.deletePet(id);
      
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

  static async getPetsByTutor(req: Request, res: Response): Promise<Response> {
    try {
      const tutorId = parseInt(req.params.tutorId);
      
      if (isNaN(tutorId)) {
        return res.status(400).json({ error: 'ID do tutor inválido' });
      }
      
      const pets = await PetService.getPetsByTutorId(tutorId);
      return res.status(200).json(pets);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async createPetForTutor(req: Request, res: Response): Promise<Response> {
    try {
      const tutorId = parseInt(req.params.tutorId);
      
      if (isNaN(tutorId)) {
        return res.status(400).json({ error: 'ID do tutor inválido' });
      }
      
      const newPetData = {
        ...req.body,
        tutorId: tutorId
      };
      
      const createdPet = await PetService.createPet(newPetData);
      return res.status(201).json(createdPet);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}