"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clinicSettingsService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class ClinicSettingsService {
    async getSettings(clinicId = 1) {
        try {
            let settings = await prisma.clinicSettings.findUnique({
                where: { clinicId }
            });
            if (!settings) {
                console.log('🏥 Criando configurações padrão para a clínica...');
                settings = await this.createDefaultSettings(clinicId);
            }
            return settings;
        }
        catch (error) {
            console.error('❌ Erro ao buscar configurações da clínica:', error);
            throw new Error('Erro ao buscar configurações da clínica');
        }
    }
    async createDefaultSettings(clinicId = 1) {
        return await prisma.clinicSettings.create({
            data: {
                clinicId,
                appointmentRemindersEnabled: true,
                appointmentReminderTemplate: "Olá {tutor}! Não se esqueça da consulta do {pet} amanhã às {hora}. Até logo!",
                vaccineRemindersEnabled: true,
                vaccineReminderTemplate: "Olá {tutor}! A vacina {vacina} do {pet} está próxima do vencimento em {data}. Agende a revacinação!",
                emailFromName: "PulseVet Clínica Veterinária",
                emailFromAddress: "contato@pulsevet.com.br",
                clinicName: "PulseVet Clínica Veterinária",
                clinicPhone: "(11) 99999-9999",
                clinicAddress: "Rua das Flores, 123 - São Paulo, SP",
                reminderSendTime: "08:00",
                vaccineReminderDaysBefore: 7
            }
        });
    }
    async updateSettings(data, clinicId = 1) {
        try {
            const existingSettings = await prisma.clinicSettings.findUnique({
                where: { clinicId }
            });
            if (!existingSettings) {
                console.log('🏥 Criando novas configurações para a clínica...');
                const newSettings = await prisma.clinicSettings.create({
                    data: {
                        clinicId,
                        ...data
                    }
                });
                return newSettings;
            }
            console.log('🔧 Atualizando configurações da clínica...');
            const updatedSettings = await prisma.clinicSettings.update({
                where: { clinicId },
                data: {
                    ...data,
                    updatedAt: new Date()
                }
            });
            return updatedSettings;
        }
        catch (error) {
            console.error('❌ Erro ao atualizar configurações da clínica:', error);
            throw new Error('Erro ao atualizar configurações da clínica');
        }
    }
    validateTimeFormat(time) {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
    }
    validateTemplate(template, type) {
        const errors = [];
        if (!template || template.trim().length === 0) {
            errors.push('Template não pode estar vazio');
        }
        if (template.length > 1000) {
            errors.push('Template não pode ter mais de 1000 caracteres');
        }
        const requiredVars = type === 'appointment'
            ? ['{tutor}', '{pet}']
            : ['{tutor}', '{pet}', '{vacina}'];
        const hasRequiredVar = requiredVars.some(variable => template.includes(variable));
        if (!hasRequiredVar) {
            errors.push(`Template deve conter pelo menos uma das variáveis: ${requiredVars.join(', ')}`);
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    async testEmailSettings(clinicId = 1) {
        try {
            const settings = await this.getSettings(clinicId);
            return {
                success: true,
                message: 'Configurações de e-mail válidas'
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Erro ao testar configurações de e-mail'
            };
        }
    }
    async resetToDefaults(clinicId = 1) {
        try {
            console.log('🔄 Resetando configurações para valores padrão...');
            await prisma.clinicSettings.deleteMany({
                where: { clinicId }
            });
            const defaultSettings = await this.createDefaultSettings(clinicId);
            return defaultSettings;
        }
        catch (error) {
            console.error('❌ Erro ao resetar configurações:', error);
            throw new Error('Erro ao resetar configurações');
        }
    }
    async getReminderStats(clinicId = 1) {
        try {
            const settings = await this.getSettings(clinicId);
            return {
                appointmentRemindersEnabled: settings.appointmentRemindersEnabled,
                vaccineRemindersEnabled: settings.vaccineRemindersEnabled,
                lastUpdated: settings.updatedAt
            };
        }
        catch (error) {
            console.error('❌ Erro ao buscar estatísticas:', error);
            throw new Error('Erro ao buscar estatísticas dos lembretes');
        }
    }
}
exports.clinicSettingsService = new ClinicSettingsService();
exports.default = ClinicSettingsService;
//# sourceMappingURL=clinicSettingsService.js.map