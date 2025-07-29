"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionController = void 0;
const prescription_service_1 = require("../services/prescription.service");
class PrescriptionController {
    static async createPrescription(req, res) {
        try {
            const medicalRecordId = parseInt(req.params.recordId);
            if (isNaN(medicalRecordId)) {
                return res.status(400).json({ error: 'ID do prontuário inválido' });
            }
            const { items } = req.body;
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'Itens da receita são obrigatórios' });
            }
            for (const item of items) {
                if (!item.medication || !item.dosage || !item.frequency || !item.duration) {
                    return res.status(400).json({
                        error: 'Cada item deve conter medicamento, dosagem, frequência e duração'
                    });
                }
            }
            const prescriptionData = {
                medicalRecordId,
                items
            };
            const newPrescription = await prescription_service_1.PrescriptionService.createPrescription(prescriptionData);
            return res.status(201).json(newPrescription);
        }
        catch (error) {
            console.error('Erro ao criar receita:', error);
            if (error.message === 'Prontuário médico não encontrado') {
                return res.status(404).json({ error: error.message });
            }
            if (error.message === 'Já existe uma receita para este prontuário') {
                return res.status(409).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static async getPrescriptionById(req, res) {
        try {
            const prescriptionId = parseInt(req.params.id);
            if (isNaN(prescriptionId)) {
                return res.status(400).json({ error: 'ID da receita inválido' });
            }
            const prescription = await prescription_service_1.PrescriptionService.getPrescriptionById(prescriptionId);
            if (!prescription) {
                return res.status(404).json({ error: 'Receita não encontrada' });
            }
            return res.json(prescription);
        }
        catch (error) {
            console.error('Erro ao buscar receita:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static async getPrescriptionByMedicalRecord(req, res) {
        try {
            const medicalRecordId = parseInt(req.params.recordId);
            if (isNaN(medicalRecordId)) {
                return res.status(400).json({ error: 'ID do prontuário inválido' });
            }
            const prescription = await prescription_service_1.PrescriptionService.getPrescriptionByMedicalRecordId(medicalRecordId);
            if (!prescription) {
                return res.status(404).json({ error: 'Receita não encontrada para este prontuário' });
            }
            return res.json(prescription);
        }
        catch (error) {
            console.error('Erro ao buscar receita por prontuário:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static async updatePrescription(req, res) {
        try {
            const prescriptionId = parseInt(req.params.id);
            if (isNaN(prescriptionId)) {
                return res.status(400).json({ error: 'ID da receita inválido' });
            }
            const { items } = req.body;
            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'Itens da receita são obrigatórios' });
            }
            for (const item of items) {
                if (!item.medication || !item.dosage || !item.frequency || !item.duration) {
                    return res.status(400).json({
                        error: 'Cada item deve conter medicamento, dosagem, frequência e duração'
                    });
                }
            }
            const updateData = { items };
            const updatedPrescription = await prescription_service_1.PrescriptionService.updatePrescription(prescriptionId, updateData);
            if (!updatedPrescription) {
                return res.status(404).json({ error: 'Receita não encontrada' });
            }
            return res.json(updatedPrescription);
        }
        catch (error) {
            console.error('Erro ao atualizar receita:', error);
            if (error.message === 'Receita não encontrada') {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static async deletePrescription(req, res) {
        try {
            const prescriptionId = parseInt(req.params.id);
            if (isNaN(prescriptionId)) {
                return res.status(400).json({ error: 'ID da receita inválido' });
            }
            const deleted = await prescription_service_1.PrescriptionService.deletePrescription(prescriptionId);
            if (!deleted) {
                return res.status(404).json({ error: 'Receita não encontrada' });
            }
            return res.status(204).send();
        }
        catch (error) {
            console.error('Erro ao deletar receita:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static async getAllPrescriptions(req, res) {
        try {
            const prescriptions = await prescription_service_1.PrescriptionService.getAllPrescriptions();
            return res.json(prescriptions);
        }
        catch (error) {
            console.error('Erro ao buscar todas as receitas:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}
exports.PrescriptionController = PrescriptionController;
//# sourceMappingURL=prescription.controller.js.map