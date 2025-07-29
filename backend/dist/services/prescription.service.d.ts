import { CreatePrescriptionRequest, UpdatePrescriptionRequest, PrescriptionResponse } from '../models/prescription.model';
export declare class PrescriptionService {
    static createPrescription(data: CreatePrescriptionRequest): Promise<PrescriptionResponse>;
    static getPrescriptionById(id: number): Promise<PrescriptionResponse | null>;
    static getPrescriptionByMedicalRecordId(medicalRecordId: number): Promise<PrescriptionResponse | null>;
    static updatePrescription(id: number, data: UpdatePrescriptionRequest): Promise<PrescriptionResponse | null>;
    static deletePrescription(id: number): Promise<boolean>;
    static getAllPrescriptions(): Promise<PrescriptionResponse[]>;
}
//# sourceMappingURL=prescription.service.d.ts.map