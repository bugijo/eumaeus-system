export interface ClinicSettingsData {
  id?: number;
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
  clinicId?: number;
}

export interface CreateClinicSettingsRequest {
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

export interface ClinicSettingsResponse {
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
  createdAt: Date;
  updatedAt: Date;
}

// Variáveis disponíveis para templates
export const TEMPLATE_VARIABLES = {
  appointment: [
    '{tutor}',
    '{pet}',
    '{data}',
    '{hora}',
    '{clinica}',
    '{telefone}'
  ],
  vaccine: [
    '{tutor}',
    '{pet}',
    '{vacina}',
    '{data}',
    '{clinica}',
    '{telefone}'
  ]
} as const;

// Templates padrão
export const DEFAULT_TEMPLATES = {
  appointment: "Olá {tutor}! Não se esqueça da consulta do {pet} amanhã às {hora}. Até logo!",
  vaccine: "Olá {tutor}! A vacina {vacina} do {pet} está próxima do vencimento em {data}. Agende a revacinação!"
} as const;