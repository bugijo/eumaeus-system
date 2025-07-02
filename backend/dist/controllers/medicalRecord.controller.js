"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalRecordController = void 0;
const medicalRecord_service_1 = require("../services/medicalRecord.service");
class MedicalRecordController {
    static getRecordsByPetId(req, res) {
        try {
            const petId = parseInt(req.params.petId);
            if (isNaN(petId)) {
                return res.status(400).json({ error: 'ID do pet inválido' });
            }
            const records = medicalRecord_service_1.MedicalRecordService.getRecordsByPetId(petId);
            res.json(records);
        }
        catch (error) {
            console.error('Erro ao buscar prontuários:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static createRecord(req, res) {
        try {
            const appointmentId = parseInt(req.params.appointmentId);
            if (isNaN(appointmentId)) {
                return res.status(400).json({ error: 'ID do agendamento inválido' });
            }
            const { petId, notes, prescription } = req.body;
            if (!petId || !notes) {
                return res.status(400).json({ error: 'Pet ID e anotações são obrigatórios' });
            }
            const recordData = {
                petId,
                appointmentId,
                notes,
                prescription: prescription || ''
            };
            const newRecord = medicalRecord_service_1.MedicalRecordService.createRecord(appointmentId, recordData);
            res.status(201).json(newRecord);
        }
        catch (error) {
            console.error('Erro ao criar prontuário:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static getRecordById(req, res) {
        try {
            const recordId = parseInt(req.params.recordId || req.params.id);
            if (isNaN(recordId)) {
                return res.status(400).json({ error: 'ID do prontuário inválido' });
            }
            const record = medicalRecord_service_1.MedicalRecordService.getRecordById(recordId);
            if (!record) {
                return res.status(404).json({ error: 'Prontuário não encontrado' });
            }
            res.json(record);
        }
        catch (error) {
            console.error('Erro ao buscar prontuário:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static getAllRecords(req, res) {
        try {
            const records = medicalRecord_service_1.MedicalRecordService.getAllRecords();
            res.json(records);
        }
        catch (error) {
            console.error('Erro ao buscar todos os prontuários:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static updateRecord(req, res) {
        try {
            const recordId = parseInt(req.params.recordId);
            if (isNaN(recordId)) {
                return res.status(400).json({ error: 'ID do prontuário inválido' });
            }
            const { notes, prescription } = req.body;
            if (!notes) {
                return res.status(400).json({ error: 'Anotações são obrigatórias' });
            }
            const updatedRecord = medicalRecord_service_1.MedicalRecordService.updateRecord(recordId, {
                notes,
                prescription: prescription || ''
            });
            if (!updatedRecord) {
                return res.status(404).json({ error: 'Prontuário não encontrado' });
            }
            res.json(updatedRecord);
        }
        catch (error) {
            console.error('Erro ao atualizar prontuário:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static deleteRecord(req, res) {
        try {
            const recordId = parseInt(req.params.recordId);
            if (isNaN(recordId)) {
                return res.status(400).json({ error: 'ID do prontuário inválido' });
            }
            const deleted = medicalRecord_service_1.MedicalRecordService.deleteRecord(recordId);
            if (!deleted) {
                return res.status(404).json({ error: 'Prontuário não encontrado' });
            }
            res.status(200).json({ message: 'Prontuário deletado com sucesso' });
        }
        catch (error) {
            console.error('Erro ao deletar prontuário:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}
exports.MedicalRecordController = MedicalRecordController;
//# sourceMappingURL=medicalRecord.controller.js.map