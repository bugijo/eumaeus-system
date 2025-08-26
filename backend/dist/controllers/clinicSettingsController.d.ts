import { Request, Response } from 'express';
declare class ClinicSettingsController {
    static getSettings(req: Request, res: Response): Promise<void>;
    static updateSettings(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static testEmailSettings(req: Request, res: Response): Promise<void>;
    static resetToDefaults(req: Request, res: Response): Promise<void>;
    static getReminderStats(req: Request, res: Response): Promise<void>;
    static getTemplateVariables(req: Request, res: Response): Promise<void>;
}
export default ClinicSettingsController;
//# sourceMappingURL=clinicSettingsController.d.ts.map