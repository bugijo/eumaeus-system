export interface MedicalRecord {
  id: number;
  petId: number;
  appointmentId: number;
  recordDate: string;
  notes: string;
  prescription: string;
}

export interface CreateMedicalRecordRequest {
  petId: number;
  appointmentId: number;
  notes: string;
  prescription: string;
}

export interface UpdateMedicalRecordRequest {
  notes?: string;
  prescription?: string;
}