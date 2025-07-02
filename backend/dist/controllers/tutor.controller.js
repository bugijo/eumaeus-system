"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorController = void 0;
const tutor_service_1 = require("../services/tutor.service");
class TutorController {
    static getAllTutors(req, res) {
        try {
            const tutors = tutor_service_1.TutorService.getAllTutors();
            res.status(200).json(tutors);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static createTutor(req, res) {
        try {
            const newTutorData = req.body;
            const createdTutor = tutor_service_1.TutorService.createTutor(newTutorData);
            res.status(201).json(createdTutor);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static getTutorById(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ error: 'ID inválido' });
                return;
            }
            const tutor = tutor_service_1.TutorService.getTutorById(id);
            if (!tutor) {
                res.status(404).json({ error: 'Tutor não encontrado' });
                return;
            }
            res.status(200).json(tutor);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static updateTutor(req, res) {
        try {
            const id = parseInt(req.params.id);
            const updatedData = req.body;
            if (isNaN(id)) {
                res.status(400).json({ error: 'ID inválido' });
                return;
            }
            const updatedTutor = tutor_service_1.TutorService.updateTutor(id, updatedData);
            if (!updatedTutor) {
                res.status(404).json({ error: 'Tutor não encontrado' });
                return;
            }
            res.status(200).json(updatedTutor);
        }
        catch (error) {
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static deleteTutor(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                res.status(400).json({ error: 'ID inválido' });
                return;
            }
            const deleted = tutor_service_1.TutorService.deleteTutor(id);
            if (!deleted) {
                res.status(404).json({ error: 'Tutor não encontrado' });
                return;
            }
            res.status(200).json({ message: 'Tutor deletado com sucesso' });
        }
        catch (error) {
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}
exports.TutorController = TutorController;
//# sourceMappingURL=tutor.controller.js.map