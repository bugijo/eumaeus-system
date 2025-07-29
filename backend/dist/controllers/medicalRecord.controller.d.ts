import { Request, Response } from 'express';
export declare class MedicalRecordController {
    static getRecordsByPetId(req: Request, res: Response): Promise<Response | void>;
    static createRecord(req: Request, res: Response): Promise<Response | void>;
    static getRecordById(req: Request, res: Response): Promise<Response | void>;
    static getAllRecords(req: Request, res: Response): Promise<Response | void>;
    static updateRecord(req: Request, res: Response): Response | void;
}
//# sourceMappingURL=medicalRecord.controller.d.ts.map