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
export declare const TEMPLATE_VARIABLES: {
    readonly appointment: readonly ["{tutor}", "{pet}", "{data}", "{hora}", "{clinica}", "{telefone}"];
    readonly vaccine: readonly ["{tutor}", "{pet}", "{vacina}", "{data}", "{clinica}", "{telefone}"];
};
export declare const DEFAULT_TEMPLATES: {
    readonly appointment: "Olá {tutor}! Não se esqueça da consulta do {pet} amanhã às {hora}. Até logo!";
    readonly vaccine: "Olá {tutor}! A vacina {vacina} do {pet} está próxima do vencimento em {data}. Agende a revacinação!";
};
//# sourceMappingURL=clinicSettings.model.d.ts.map