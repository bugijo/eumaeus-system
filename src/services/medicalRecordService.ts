import apiClient from '../api/apiClient';
import type { MedicalRecord, CreateMedicalRecordData, UpdateMedicalRecordData } from '../types';

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
      const response = await apiClient.post('/records/direct', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar prontuário:', error);
      throw new Error('Falha ao criar prontuário');
    }
  }

  static async getRecordById(id: number): Promise<MedicalRecord | null> {
    try {
      const response = await apiClient.get(`/records/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Erro ao buscar prontuário:', error);
      throw new Error('Falha ao buscar prontuário');
    }
  }

  static async getAllRecords(): Promise<MedicalRecord[]> {
    try {
      const response = await apiClient.get('/records');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar todos os prontuários:', error);
      throw new Error('Falha ao buscar prontuários');
    }
  }

  static async updateMedicalRecord(id: number, data: { notes: string; prescription: string }): Promise<MedicalRecord> {
    try {
      const response = await apiClient.put(`/records/${id}`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Prontuário não encontrado');
      }
      console.error('Erro ao atualizar prontuário:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Falha ao atualizar prontuário');
    }
  }

  static async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/records/${id}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Prontuário não encontrado');
      }
      console.error('Erro ao excluir prontuário:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Falha ao excluir prontuário');
    }
  }
}