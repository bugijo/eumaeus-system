export interface CreatePrescriptionRequest {
  medicalRecordId: number;
  items: PrescriptionItemData[];
}

export interface PrescriptionItemData {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface UpdatePrescriptionRequest {
  items: PrescriptionItemData[];
}

export interface PrescriptionResponse {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  medicalRecordId: number;
  items: PrescriptionItemResponse[];
  medicalRecord?: {
    id: number;
    appointment: {
      id: number;
      pet: {
        id: number;
        name: string;
        species: string;
        breed: string;
        tutor: {
          id: number;
          name: string;
        };
      };
    };
  };
}

export interface PrescriptionItemResponse {
  id: number;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}