export interface MedicalRecord {
    id: number;
    appointmentId: number;
    symptoms: string;
    diagnosis: string;
    treatment: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateMedicalRecordRequest {
    appointmentId: number;
    symptoms: string;
    diagnosis: string;
    treatment: string;
    notes?: string;
}
export interface UpdateMedicalRecordRequest {
    symptoms?: string;
    diagnosis?: string;
    treatment?: string;
    notes?: string;
}
//# sourceMappingURL=medicalRecord.model.d.ts.map