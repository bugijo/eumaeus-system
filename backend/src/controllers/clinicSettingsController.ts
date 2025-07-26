import { Request, Response } from 'express';
import { clinicSettingsService } from '../services/clinicSettingsService';
import { UpdateClinicSettingsRequest } from '../models/clinicSettings.model';

class ClinicSettingsController {
  /**
   * GET /api/settings/notifications
   * Busca as configurações de notificação da clínica
   */
  static async getSettings(req: Request, res: Response) {
    try {
      const clinicId = parseInt(req.query.clinicId as string) || 1;
      
      console.log(`🔍 Buscando configurações da clínica ${clinicId}...`);
      
      const settings = await clinicSettingsService.getSettings(clinicId);
      
      console.log('✅ Configurações encontradas com sucesso');
      
      res.status(200).json({
        success: true,
        data: settings
      });
    } catch (error) {
      console.error('❌ Erro ao buscar configurações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar configurações',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * PUT /api/settings/notifications
   * Atualiza as configurações de notificação da clínica
   */
  static async updateSettings(req: Request, res: Response) {
    try {
      const clinicId = parseInt(req.query.clinicId as string) || 1;
      const updateData: UpdateClinicSettingsRequest = req.body;
      
      console.log(`🔧 Atualizando configurações da clínica ${clinicId}...`);
      console.log('📝 Dados recebidos:', updateData);
      
      // Validações
      if (updateData.reminderSendTime && !clinicSettingsService.validateTimeFormat(updateData.reminderSendTime)) {
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

      // Valida templates se fornecidos
      if (updateData.appointmentReminderTemplate) {
        const validation = clinicSettingsService.validateTemplate(
          updateData.appointmentReminderTemplate,
          'appointment'
        );
        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            message: 'Template de lembrete de consulta inválido',
            errors: validation.errors
          });
        }
      }

      if (updateData.vaccineReminderTemplate) {
        const validation = clinicSettingsService.validateTemplate(
          updateData.vaccineReminderTemplate,
          'vaccine'
        );
        if (!validation.isValid) {
          return res.status(400).json({
            success: false,
            message: 'Template de lembrete de vacina inválido',
            errors: validation.errors
          });
        }
      }
      
      const updatedSettings = await clinicSettingsService.updateSettings(updateData, clinicId);
      
      console.log('✅ Configurações atualizadas com sucesso');
      
      res.status(200).json({
        success: true,
        message: 'Configurações atualizadas com sucesso',
        data: updatedSettings
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar configurações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao atualizar configurações',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * POST /api/settings/notifications/test
   * Testa as configurações de e-mail
   */
  static async testEmailSettings(req: Request, res: Response) {
    try {
      const clinicId = parseInt(req.query.clinicId as string) || 1;
      
      console.log(`🧪 Testando configurações de e-mail da clínica ${clinicId}...`);
      
      const testResult = await clinicSettingsService.testEmailSettings(clinicId);
      
      res.status(200).json({
        success: testResult.success,
        message: testResult.message
      });
    } catch (error) {
      console.error('❌ Erro ao testar configurações de e-mail:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao testar configurações de e-mail',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * POST /api/settings/notifications/reset
   * Reseta as configurações para os valores padrão
   */
  static async resetToDefaults(req: Request, res: Response) {
    try {
      const clinicId = parseInt(req.query.clinicId as string) || 1;
      
      console.log(`🔄 Resetando configurações da clínica ${clinicId} para padrão...`);
      
      const defaultSettings = await clinicSettingsService.resetToDefaults(clinicId);
      
      console.log('✅ Configurações resetadas com sucesso');
      
      res.status(200).json({
        success: true,
        message: 'Configurações resetadas para valores padrão',
        data: defaultSettings
      });
    } catch (error) {
      console.error('❌ Erro ao resetar configurações:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao resetar configurações',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * GET /api/settings/notifications/stats
   * Obtém estatísticas de uso dos lembretes
   */
  static async getReminderStats(req: Request, res: Response) {
    try {
      const clinicId = parseInt(req.query.clinicId as string) || 1;
      
      console.log(`📊 Buscando estatísticas de lembretes da clínica ${clinicId}...`);
      
      const stats = await clinicSettingsService.getReminderStats(clinicId);
      
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao buscar estatísticas',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * GET /api/settings/notifications/template-variables
   * Retorna as variáveis disponíveis para templates
   */
  static async getTemplateVariables(req: Request, res: Response) {
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
    } catch (error) {
      console.error('❌ Erro ao buscar variáveis de template:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
}

export default ClinicSettingsController;