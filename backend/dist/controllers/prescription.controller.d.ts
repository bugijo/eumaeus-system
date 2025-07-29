import { Request, Response } from 'express';
export declare class PrescriptionController {
    static createPrescription(req: Request, res: Response): Promise<Response>;
    static getPrescriptionById(req: Request, res: Response): Promise<Response>;
    static getPrescriptionByMedicalRecord(req: Request, res: Response): Promise<Response>;
    static updatePrescription(req: Request, res: Response): Promise<Response>;
    static deletePrescription(req: Request, res: Response): Promise<Response>;
    static getAllPrescriptions(req: Request, res: Response): Promise<Response>;
}
//# sourceMappingURL=prescription.controller.d.ts.map