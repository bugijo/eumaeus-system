"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorController = void 0;
const tutor_service_1 = require("../services/tutor.service");
class TutorController {
    static async getTutorStats(req, res) {
        try {
            const stats = await tutor_service_1.TutorService.getTutorStats();
            return res.status(200).json(stats);
        }
        catch (error) {
            console.error('Erro ao buscar estatísticas de tutores:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static async getAllTutors(req, res) {
        try {
            const tutors = await tutor_service_1.TutorService.getAllTutors();
            return res.status(200).json(tutors);
        }
        catch (error) {
            console.error('Erro ao buscar tutores:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static async createTutor(req, res) {
        try {
            const newTutorData = req.body;
            const createdTutor = await tutor_service_1.TutorService.createTutor(newTutorData);
            return res.status(201).json(createdTutor);
        }
        catch (error) {
            console.error('Erro ao criar tutor:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static async getTutorById(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const tutor = await tutor_service_1.TutorService.getTutorById(id);
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
    static async updateTutor(req, res) {
        try {
            const id = parseInt(req.params.id);
            const updatedData = req.body;
            if (isNaN(id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const updatedTutor = await tutor_service_1.TutorService.updateTutor(id, updatedData);
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
    static async deleteTutor(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const deleted = await tutor_service_1.TutorService.deleteTutor(id);
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