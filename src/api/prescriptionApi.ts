import apiClient from './apiClient';

export interface PrescriptionItem {
  id?: number;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface Prescription {
  id: number;
  createdAt: string;
  updatedAt: string;
  medicalRecordId: number;
  status?: string;
  currentVersion?: number;
  signatureMode?: string;
  clinicNameSnapshot?: string | null;
  veterinarianNameSnapshot?: string | null;
  tutorNameSnapshot?: string | null;
  petNameSnapshot?: string | null;
  cancelReason?: string | null;
  cancelledAt?: string | null;
  items: PrescriptionItem[];
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

export interface CreatePrescriptionRequest {
  items: Omit<PrescriptionItem, 'id'>[];
}

export interface UpdatePrescriptionRequest {
  items: Omit<PrescriptionItem, 'id'>[];
}

export const prescriptionApi = {
  // Criar nova receita para um prontuário
  async createPrescription(medicalRecordId: number, data: CreatePrescriptionRequest): Promise<Prescription> {
    const response = await apiClient.post(`/records/${medicalRecordId}/prescriptions`, data);
    return response.data;
  },

  // Buscar receita por ID
  async getPrescriptionById(id: number): Promise<Prescription> {
    const response = await apiClient.get(`/prescriptions/${id}`);
    return response.data;
  },

  // Buscar receita por prontuário
  async getPrescriptionByMedicalRecord(medicalRecordId: number): Promise<Prescription> {
    const response = await apiClient.get(`/records/${medicalRecordId}/prescriptions`);
    return response.data;
  },

  // Atualizar receita
  async updatePrescription(id: number, data: UpdatePrescriptionRequest): Promise<Prescription> {
    const response = await apiClient.put(`/prescriptions/${id}`, data);
    return response.data;
  },

  async reviewPrescription(id: number, status: 'APPROVED' | 'REJECTED', reviewNotes?: string): Promise<Prescription> {
    const response = await apiClient.patch(`/prescriptions/${id}/review`, { status, reviewNotes });
    return response.data;
  },

  async cancelPrescription(id: number, reason: string): Promise<void> {
    await apiClient.delete(`/prescriptions/${id}`, { data: { reason } });
  },

  async getVersions(id: number): Promise<PrescriptionItem[]> {
    const response = await apiClient.get(`/prescriptions/${id}/versions`);
    return response.data;
  },

  async getPrintableHtml(id: number): Promise<string> {
    const response = await apiClient.get<string>(`/prescriptions/${id}/print`);
    return response.data;
  },

  // Deletar receita
  async deletePrescription(id: number): Promise<void> {
    await apiClient.delete(`/prescriptions/${id}`);
  },

  // Buscar todas as receitas
  async getAllPrescriptions(): Promise<Prescription[]> {
    const response = await apiClient.get('/prescriptions');
    return response.data;
  }
};
