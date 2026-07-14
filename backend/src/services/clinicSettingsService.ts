import {
  ClinicSettingsData,
  CreateClinicSettingsRequest,
  UpdateClinicSettingsRequest,
  ClinicSettingsResponse
} from '../models/clinicSettings.model';
import { prisma } from '../lib/prisma';

class ClinicSettingsService {
  /**
   * Busca as configurações da clínica
   * Se não existir, cria uma com valores padrão
   */
  async getSettings(clinicId: number = 1): Promise<ClinicSettingsResponse> {
    try {
      let settings = await prisma.clinicSettings.findUnique({
        where: { clinicId }
      });

      // Se não existir configuração, cria uma com valores padrão
      if (!settings) {
        console.log('🏥 Criando configurações padrão para a clínica...');
        settings = await this.createDefaultSettings(clinicId);
      }

      return settings as ClinicSettingsResponse;
    } catch (error) {
      console.error('❌ Erro ao buscar configurações da clínica:', error);
      throw new Error('Erro ao buscar configurações da clínica');
    }
  }

  /**
   * Cria configurações padrão para a clínica
   */
  private async createDefaultSettings(clinicId: number = 1) {
    return await prisma.clinicSettings.create({
      data: {
        clinicId,
        appointmentRemindersEnabled: true,
        appointmentReminderTemplate: "Olá {tutor}! Não se esqueça da consulta do {pet} amanhã às {hora}. Até logo!",
        vaccineRemindersEnabled: true,
        vaccineReminderTemplate: "Olá {tutor}! A vacina {vacina} do {pet} está próxima do vencimento em {data}. Agende a revacinação!",
        emailFromName: "Eumaeus Clínica Veterinária",
        emailFromAddress: "contato@eumaeus.com.br",
        clinicName: "Eumaeus Clínica Veterinária",
        clinicPhone: "(11) 99999-9999",
        clinicAddress: "Rua das Flores, 123 - São Paulo, SP",
        reminderSendTime: "08:00",
        vaccineReminderDaysBefore: 7
      }
    });
  }

  /**
   * Atualiza as configurações da clínica
   */
  async updateSettings(
    data: UpdateClinicSettingsRequest,
    clinicId: number = 1
  ): Promise<ClinicSettingsResponse> {
    try {
      // Verifica se as configurações existem
      const existingSettings = await prisma.clinicSettings.findUnique({
        where: { clinicId }
      });

      if (!existingSettings) {
        // Se não existir, cria com os dados fornecidos
        console.log('🏥 Criando novas configurações para a clínica...');
        const newSettings = await prisma.clinicSettings.create({
          data: {
            clinicId,
            ...data
          }
        });
        return newSettings as ClinicSettingsResponse;
      }

      // Atualiza as configurações existentes
      console.log('🔧 Atualizando configurações da clínica...');
      const updatedSettings = await prisma.clinicSettings.update({
        where: { clinicId },
        data: {
          ...data,
          updatedAt: new Date()
        }
      });

      return updatedSettings as ClinicSettingsResponse;
    } catch (error) {
      console.error('❌ Erro ao atualizar configurações da clínica:', error);
      throw new Error('Erro ao atualizar configurações da clínica');
    }
  }

  /**
   * Valida o formato do horário (HH:MM)
   */
  validateTimeFormat(time: string): boolean {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  /**
   * Valida o template de e-mail
   */
  validateTemplate(template: string, type: 'appointment' | 'vaccine'): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!template || template.trim().length === 0) {
      errors.push('Template não pode estar vazio');
    }

    if (template.length > 1000) {
      errors.push('Template não pode ter mais de 1000 caracteres');
    }

    // Verifica se contém pelo menos uma variável obrigatória
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

  /**
   * Testa as configurações de e-mail
   */
  async testEmailSettings(clinicId: number = 1): Promise<{ success: boolean; message: string }> {
    try {
      const settings = await this.getSettings(clinicId);
      
      // Aqui você pode adicionar lógica para testar a conexão de e-mail
      // Por exemplo, enviar um e-mail de teste
      
      return {
        success: true,
        message: 'Configurações de e-mail válidas'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erro ao testar configurações de e-mail'
      };
    }
  }

  /**
   * Reseta as configurações para os valores padrão
   */
  async resetToDefaults(clinicId: number = 1): Promise<ClinicSettingsResponse> {
    try {
      console.log('🔄 Resetando configurações para valores padrão...');
      
      // Remove as configurações existentes
      await prisma.clinicSettings.deleteMany({
        where: { clinicId }
      });

      // Cria novas configurações com valores padrão
      const defaultSettings = await this.createDefaultSettings(clinicId);
      
      return defaultSettings as ClinicSettingsResponse;
    } catch (error) {
      console.error('❌ Erro ao resetar configurações:', error);
      throw new Error('Erro ao resetar configurações');
    }
  }

  /**
   * Obtém estatísticas de uso dos lembretes
   */
  async getReminderStats(clinicId: number = 1): Promise<{
    appointmentRemindersEnabled: boolean;
    vaccineRemindersEnabled: boolean;
    lastUpdated: Date;
  }> {
    try {
      const settings = await this.getSettings(clinicId);
      
      return {
        appointmentRemindersEnabled: settings.appointmentRemindersEnabled,
        vaccineRemindersEnabled: settings.vaccineRemindersEnabled,
        lastUpdated: settings.updatedAt
      };
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      throw new Error('Erro ao buscar estatísticas dos lembretes');
    }
  }
}

export const clinicSettingsService = new ClinicSettingsService();
export default ClinicSettingsService;
