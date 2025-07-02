import { Request, Response } from 'express';
export declare class MedicalRecordController {
    static getRecordsByPetId(req: Request, res: Response): Response<any, Record<string, any>> | undefined;
    static createRecord(req: Request, res: Response): Response<any, Record<string, any>> | undefined;
    static getRecordById(req: Request, res: Response): Response<any, Record<string, any>> | undefined;
    static getAllRecords(req: Request, res: Response): void;
    static updateRecord(req: Request, res: Response): Response<any, Record<string, any>> | undefined;
    static deleteRecord(req: Request, res: Response): Response<any, Record<string, any>> | undefined;
}
//# sourceMappingURL=medicalRecord.controller.d.ts.map