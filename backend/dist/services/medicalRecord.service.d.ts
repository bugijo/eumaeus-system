import { MedicalRecord, CreateMedicalRecordRequest } from '../models/medicalRecord.model';
export declare class MedicalRecordService {
    static getRecordsByPetId(petId: number): Promise<MedicalRecord[]>;
    static createRecord(appointmentId: number, data: CreateMedicalRecordRequest): Promise<MedicalRecord>;
    static getRecordById(id: number): Promise<MedicalRecord | null>;
    static getAllRecords(): Promise<MedicalRecord[]>;
    static updateRecord(recordId: number, updateData: {
        symptoms: string;
        diagnosis: string;
        treatment: string;
        notes?: string;
    }): Promise<MedicalRecord | null>;
}
//# sourceMappingURL=medicalRecord.service.d.ts.map