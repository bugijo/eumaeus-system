"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const clinicSettingsService_1 = require("../services/clinicSettingsService");
class ClinicSettingsController {
    static async getSettings(req, res) {
        try {
            const clinicId = parseInt(req.query.clinicId) || 1;
            console.log(`🔍 Buscando configurações da clínica ${clinicId}...`);
            const settings = await clinicSettingsService_1.clinicSettingsService.getSettings(clinicId);
            console.log('✅ Configurações encontradas com sucesso');
            res.status(200).json({
                success: true,
                data: settings
            });
        }
        catch (error) {
            console.error('❌ Erro ao buscar configurações:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor ao buscar configurações',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
    static async updateSettings(req, res) {
        try {
            const clinicId = parseInt(req.query.clinicId) || 1;
            const updateData = req.body;
            console.log(`🔧 Atualizando configurações da clínica ${clinicId}...`);
            console.log('📝 Dados recebidos:', updateData);
            if (updateData.reminderSendTime && !clinicSettingsService_1.clinicSettingsService.validateTimeFormat(updateData.reminderSendTime)) {
                return res.status(400).json({
                    success: false,
                    message: 'Formato de horário inválido. Use o formato HH:MM (ex: 08:00)'
                });
            }
            if (updateData.vaccineReminderDaysBefore !== undefined) {
                if (updateData.vaccineReminderDaysBefore < 1 || updateData.vaccineReminderDaysBefore > 30) {
                    return res.status(400).json({
                        success: false,
                        message: 'Dias antes do lembrete de vacina deve estar entre 1 e 30'
                    });
                }
            }
            if (updateData.appointmentReminderTemplate) {
                const validation = clinicSettingsService_1.clinicSettingsService.validateTemplate(updateData.appointmentReminderTemplate, 'appointment');
                if (!validation.isValid) {
                    return res.status(400).json({
                        success: false,
                        message: 'Template de lembrete de consulta inválido',
                        errors: validation.errors
                    });
                }
            }
            if (updateData.vaccineReminderTemplate) {
                const validation = clinicSettingsService_1.clinicSettingsService.validateTemplate(updateData.vaccineReminderTemplate, 'vaccine');
                if (!validation.isValid) {
                    return res.status(400).json({
                        success: false,
                        message: 'Template de lembrete de vacina inválido',
                        errors: validation.errors
                    });
                }
            }
            const updatedSettings = await clinicSettingsService_1.clinicSettingsService.updateSettings(updateData, clinicId);
            console.log('✅ Configurações atualizadas com sucesso');
            res.status(200).json({
                success: true,
                message: 'Configurações atualizadas com sucesso',
                data: updatedSettings
            });
        }
        catch (error) {
            console.error('❌ Erro ao atualizar configurações:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor ao atualizar configurações',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
    static async testEmailSettings(req, res) {
        try {
            const clinicId = parseInt(req.query.clinicId) || 1;
            console.log(`🧪 Testando configurações de e-mail da clínica ${clinicId}...`);
            const testResult = await clinicSettingsService_1.clinicSettingsService.testEmailSettings(clinicId);
            res.status(200).json({
                success: testResult.success,
                message: testResult.message
            });
        }
        catch (error) {
            console.error('❌ Erro ao testar configurações de e-mail:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor ao testar configurações de e-mail',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
    static async resetToDefaults(req, res) {
        try {
            const clinicId = parseInt(req.query.clinicId) || 1;
            console.log(`🔄 Resetando configurações da clínica ${clinicId} para padrão...`);
            const defaultSettings = await clinicSettingsService_1.clinicSettingsService.resetToDefaults(clinicId);
            console.log('✅ Configurações resetadas com sucesso');
            res.status(200).json({
                success: true,
                message: 'Configurações resetadas para valores padrão',
                data: defaultSettings
            });
        }
        catch (error) {
            console.error('❌ Erro ao resetar configurações:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor ao resetar configurações',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
    static async getReminderStats(req, res) {
        try {
            const clinicId = parseInt(req.query.clinicId) || 1;
            console.log(`📊 Buscando estatísticas de lembretes da clínica ${clinicId}...`);
            const stats = await clinicSettingsService_1.clinicSettingsService.getReminderStats(clinicId);
            res.status(200).json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            console.error('❌ Erro ao buscar estatísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor ao buscar estatísticas',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
    static async getTemplateVariables(req, res) {
        try {
            const variables = {
                appointment: [
                    { variable: '{tutor}', description: 'Nome do tutor' },
                    { variable: '{pet}', description: 'Nome do pet' },
                    { variable: '{data}', description: 'Data da consulta' },
                    { variable: '{hora}', description: 'Horário da consulta' },
                    { variable: '{clinica}', description: 'Nome da clínica' },
                    { variable: '{telefone}', description: 'Telefone da clínica' }
                ],
                vaccine: [
                    { variable: '{tutor}', description: 'Nome do tutor' },
                    { variable: '{pet}', description: 'Nome do pet' },
                    { variable: '{vacina}', description: 'Nome da vacina' },
                    { variable: '{data}', description: 'Data de vencimento' },
                    { variable: '{clinica}', description: 'Nome da clínica' },
                    { variable: '{telefone}', description: 'Telefone da clínica' }
                ]
            };
            res.status(200).json({
                success: true,
                data: variables
            });
        }
        catch (error) {
            console.error('❌ Erro ao buscar variáveis de template:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
}
exports.default = ClinicSettingsController;
//# sourceMappingURL=clinicSettingsController.js.map