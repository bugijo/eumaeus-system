import apiClient from '../api/apiClient';
import type { MedicalRecord, CreateMedicalRecordData } from '../types';

export class MedicalRecordService {

  static async getRecordsByPetId(petId: number): Promise<MedicalRecord[]> {
    try {
      const response = await apiClient.get(`/records/pets/${petId}/records`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar prontuários do pet:', error);
      throw new Error('Falha ao buscar prontuários do pet');
    }
  }

  static async createRecord(appointmentId: number, data: CreateMedicalRecordData): Promise<MedicalRecord> {
    try {
      const response = await apiClient.post(`/records/${appointmentId}`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar prontuário:', error);
      throw new Error('Falha ao criar prontuário');
    }
  }

}
