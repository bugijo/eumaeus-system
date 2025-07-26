import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';

// Interfaces
export interface ClinicSettings {
  id: number;
  appointmentRemindersEnabled: boolean;
  appointmentReminderTemplate: string;
  vaccineRemindersEnabled: boolean;
  vaccineReminderTemplate: string;
  emailFromName: string;
  emailFromAddress: string;
  clinicName: string;
  clinicPhone: string;
  clinicAddress: string;
  reminderSendTime: string;
  vaccineReminderDaysBefore: number;
  clinicId: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateClinicSettingsRequest {
  appointmentRemindersEnabled?: boolean;
  appointmentReminderTemplate?: string;
  vaccineRemindersEnabled?: boolean;
  vaccineReminderTemplate?: string;
  emailFromName?: string;
  emailFromAddress?: string;
  clinicName?: string;
  clinicPhone?: string;
  clinicAddress?: string;
  reminderSendTime?: string;
  vaccineReminderDaysBefore?: number;
}

export interface TemplateVariable {
  variable: string;
  description: string;
}

export interface TemplateVariables {
  appointment: TemplateVariable[];
  vaccine: TemplateVariable[];
}

export interface ReminderStats {
  appointmentRemindersEnabled: boolean;
  vaccineRemindersEnabled: boolean;
  lastUpdated: string;
}

// Query Keys
export const clinicSettingsKeys = {
  all: ['clinicSettings'] as const,
  settings: (clinicId?: number) => [...clinicSettingsKeys.all, 'settings', clinicId] as const,
  stats: (clinicId?: number) => [...clinicSettingsKeys.all, 'stats', clinicId] as const,
  templateVariables: () => [...clinicSettingsKeys.all, 'templateVariables'] as const,
};

// API Functions
export const clinicSettingsApi = {
  // Buscar configurações
  getSettings: async (clinicId?: number): Promise<ClinicSettings> => {
    const params = clinicId ? { clinicId } : {};
    const response = await apiClient.get('/settings/notifications', { params });
    return response.data.data;
  },

  // Atualizar configurações
  updateSettings: async (data: UpdateClinicSettingsRequest, clinicId?: number): Promise<ClinicSettings> => {
    const params = clinicId ? { clinicId } : {};
    const response = await apiClient.put('/settings/notifications', data, { params });
    return response.data.data;
  },

  // Testar configurações de e-mail
  testEmailSettings: async (clinicId?: number): Promise<{ success: boolean; message: string }> => {
    const params = clinicId ? { clinicId } : {};
    const response = await apiClient.post('/settings/notifications/test', {}, { params });
    return response.data;
  },

  // Resetar para configurações padrão
  resetToDefaults: async (clinicId?: number): Promise<ClinicSettings> => {
    const params = clinicId ? { clinicId } : {};
    const response = await apiClient.post('/settings/notifications/reset', {}, { params });
    return response.data.data;
  },

  // Buscar estatísticas
  getStats: async (clinicId?: number): Promise<ReminderStats> => {
    const params = clinicId ? { clinicId } : {};
    const response = await apiClient.get('/settings/notifications/stats', { params });
    return response.data.data;
  },

  // Buscar variáveis de template
  getTemplateVariables: async (): Promise<TemplateVariables> => {
    const response = await apiClient.get('/settings/notifications/template-variables');
    return response.data.data;
  },
};

// React Query Hooks

// Hook para buscar configurações
export const useClinicSettings = (clinicId?: number) => {
  return useQuery({
    queryKey: clinicSettingsKeys.settings(clinicId),
    queryFn: () => clinicSettingsApi.getSettings(clinicId),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

// Hook para atualizar configurações
export const useUpdateClinicSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ data, clinicId }: { data: UpdateClinicSettingsRequest; clinicId?: number }) =>
      clinicSettingsApi.updateSettings(data, clinicId),
    onSuccess: (_, variables) => {
      // Invalida e refetch as configurações
      queryClient.invalidateQueries({ queryKey: clinicSettingsKeys.settings(variables.clinicId) });
      queryClient.invalidateQueries({ queryKey: clinicSettingsKeys.stats(variables.clinicId) });
    },
  });
};

// Hook para testar configurações de e-mail
export const useTestEmailSettings = () => {
  return useMutation({
    mutationFn: (clinicId?: number) => clinicSettingsApi.testEmailSettings(clinicId),
  });
};

// Hook para resetar configurações
export const useResetClinicSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (clinicId?: number) => clinicSettingsApi.resetToDefaults(clinicId),
    onSuccess: (_, clinicId) => {
      // Invalida e refetch as configurações
      queryClient.invalidateQueries({ queryKey: clinicSettingsKeys.settings(clinicId) });
      queryClient.invalidateQueries({ queryKey: clinicSettingsKeys.stats(clinicId) });
    },
  });
};

// Hook para buscar estatísticas
export const useReminderStats = (clinicId?: number) => {
  return useQuery({
    queryKey: clinicSettingsKeys.stats(clinicId),
    queryFn: () => clinicSettingsApi.getStats(clinicId),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
};

// Hook para buscar variáveis de template
export const useTemplateVariables = () => {
  return useQuery({
    queryKey: clinicSettingsKeys.templateVariables(),
    queryFn: () => clinicSettingsApi.getTemplateVariables(),
    staleTime: 30 * 60 * 1000, // 30 minutos (raramente muda)
  });
};