import { UpdateClinicSettingsRequest, ClinicSettingsResponse } from '../models/clinicSettings.model';
declare class ClinicSettingsService {
    getSettings(clinicId?: number): Promise<ClinicSettingsResponse>;
    private createDefaultSettings;
    updateSettings(data: UpdateClinicSettingsRequest, clinicId?: number): Promise<ClinicSettingsResponse>;
    validateTimeFormat(time: string): boolean;
    validateTemplate(template: string, type: 'appointment' | 'vaccine'): {
        isValid: boolean;
        errors: string[];
    };
    testEmailSettings(clinicId?: number): Promise<{
        success: boolean;
        message: string;
    }>;
    resetToDefaults(clinicId?: number): Promise<ClinicSettingsResponse>;
    getReminderStats(clinicId?: number): Promise<{
        appointmentRemindersEnabled: boolean;
        vaccineRemindersEnabled: boolean;
        lastUpdated: Date;
    }>;
}
export declare const clinicSettingsService: ClinicSettingsService;
export default ClinicSettingsService;
//# sourceMappingURL=clinicSettingsService.d.ts.map