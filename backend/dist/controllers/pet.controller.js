"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetController = void 0;
const pet_service_1 = require("../services/pet.service");
class PetController {
    static getAllPets(req, res) {
        try {
            const pets = pet_service_1.PetService.getAllPets();
            res.status(200).json(pets);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static createPet(req, res) {
        try {
            const newPetData = req.body;
            const createdPet = pet_service_1.PetService.createPet(newPetData);
            res.status(201).json(createdPet);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static getPetById(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ error: 'ID inválido' });
                return;
            }
            const pet = pet_service_1.PetService.getPetById(id);
            if (!pet) {
                res.status(404).json({ error: 'Pet não encontrado' });
                return;
            }
            res.status(200).json(pet);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static updatePet(req, res) {
        try {
            const id = parseInt(req.params.id);
            const updateData = req.body;
            if (isNaN(id)) {
                res.status(400).json({ error: 'ID inválido' });
                return;
            }
            const updatedPet = pet_service_1.PetService.updatePet(id, updateData);
            if (!updatedPet) {
                res.status(404).json({ error: 'Pet não encontrado' });
                return;
            }
            res.status(200).json(updatedPet);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static deletePet(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ error: 'ID inválido' });
                return;
            }
            const deleted = pet_service_1.PetService.deletePet(id);
            if (!deleted) {
                res.status(404).json({ error: 'Pet não encontrado' });
                return;
            }
            res.status(200).json({ message: 'Pet excluído com sucesso' });
        }
        catch (error) {
            if (error instanceof Error && error.message.includes('registros associados')) {
                res.status(400).json({ error: error.message });
                return;
            }
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static getPetsByTutor(req, res) {
        try {
            const tutorId = parseInt(req.params.tutorId);
            if (isNaN(tutorId)) {
                res.status(400).json({ error: 'ID do tutor inválido' });
                return;
            }
            const pets = pet_service_1.PetService.getPetsByTutorId(tutorId);
            res.status(200).json(pets);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}
exports.PetController = PetController;
//# sourceMappingURL=pet.controller.js.map