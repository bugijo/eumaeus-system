import { MedicalRecord, CreateMedicalRecordRequest } from '../models/medicalRecord.model';
export declare class MedicalRecordService {
    private static records;
    static getRecordsByPetId(petId: number): MedicalRecord[];
    static createRecord(appointmentId: number, data: CreateMedicalRecordRequest): MedicalRecord;
    static getRecordById(id: number): MedicalRecord | undefined;
    static getAllRecords(): MedicalRecord[];
    static updateRecord(recordId: number, updateData: {
        notes: string;
        prescription: string;
    }): MedicalRecord | null;
    static deleteRecord(recordId: number): boolean;
}
//# sourceMappingURL=medicalRecord.service.d.ts.map