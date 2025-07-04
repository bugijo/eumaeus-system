"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetController = void 0;
const pet_service_1 = require("../services/pet.service");
class PetController {
    static getAllPets(req, res) {
        try {
            const pets = pet_service_1.PetService.getAllPets();
            return res.status(200).json(pets);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static createPet(req, res) {
        try {
            const newPetData = req.body;
            const createdPet = pet_service_1.PetService.createPet(newPetData);
            return res.status(201).json(createdPet);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static getPetById(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const pet = pet_service_1.PetService.getPetById(id);
            if (!pet) {
                return res.status(404).json({ error: 'Pet não encontrado' });
            }
            return res.status(200).json(pet);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static updatePet(req, res) {
        try {
            const id = parseInt(req.params.id);
            const updateData = req.body;
            if (isNaN(id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const updatedPet = pet_service_1.PetService.updatePet(id, updateData);
            if (!updatedPet) {
                return res.status(404).json({ error: 'Pet não encontrado' });
            }
            return res.status(200).json(updatedPet);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static deletePet(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const deleted = pet_service_1.PetService.deletePet(id);
            if (!deleted) {
                return res.status(404).json({ error: 'Pet não encontrado' });
            }
            return res.status(200).json({ message: 'Pet excluído com sucesso' });
        }
        catch (error) {
            console.error(error);
            if (error instanceof Error && error.message.includes('registros associados')) {
                return res.status(400).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static getPetsByTutor(req, res) {
        try {
            const tutorId = parseInt(req.params.tutorId);
            if (isNaN(tutorId)) {
                return res.status(400).json({ error: 'ID do tutor inválido' });
            }
            const pets = pet_service_1.PetService.getPetsByTutorId(tutorId);
            return res.status(200).json(pets);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static createPetForTutor(req, res) {
        try {
            const tutorId = parseInt(req.params.tutorId);
            if (isNaN(tutorId)) {
                return res.status(400).json({ error: 'ID do tutor inválido' });
            }
            const newPetData = {
                ...req.body,
                tutorId: tutorId
            };
            const createdPet = pet_service_1.PetService.createPet(newPetData);
            return res.status(201).json(createdPet);
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}
exports.PetController = PetController;
//# sourceMappingURL=pet.controller.js.map