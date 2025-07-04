"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorController = void 0;
const tutor_service_1 = require("../services/tutor.service");
class TutorController {
    static getAllTutors(req, res) {
        try {
            const tutors = tutor_service_1.TutorService.getAllTutors();
            return res.status(200).json(tutors);
        }
        catch (error) {
            console.error('Erro ao buscar tutores:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static createTutor(req, res) {
        try {
            const newTutorData = req.body;
            const createdTutor = tutor_service_1.TutorService.createTutor(newTutorData);
            return res.status(201).json(createdTutor);
        }
        catch (error) {
            console.error('Erro ao criar tutor:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static getTutorById(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const tutor = tutor_service_1.TutorService.getTutorById(id);
            if (!tutor) {
                return res.status(404).json({ error: 'Tutor não encontrado' });
            }
            return res.status(200).json(tutor);
        }
        catch (error) {
            console.error('Erro ao buscar tutor:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static updateTutor(req, res) {
        try {
            const id = parseInt(req.params.id);
            const updatedData = req.body;
            if (isNaN(id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const updatedTutor = tutor_service_1.TutorService.updateTutor(id, updatedData);
            if (!updatedTutor) {
                return res.status(404).json({ error: 'Tutor não encontrado' });
            }
            return res.status(200).json(updatedTutor);
        }
        catch (error) {
            console.error('Erro ao atualizar tutor:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static deleteTutor(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const deleted = tutor_service_1.TutorService.deleteTutor(id);
            if (!deleted) {
                return res.status(404).json({ error: 'Tutor não encontrado' });
            }
            return res.status(200).json({ message: 'Tutor deletado com sucesso' });
        }
        catch (error) {
            console.error('Erro ao deletar tutor:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}
exports.TutorController = TutorController;
//# sourceMappingURL=tutor.controller.js.map