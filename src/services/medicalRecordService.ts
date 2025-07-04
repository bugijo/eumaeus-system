import apiClient from '../api/apiClient';
import type { MedicalRecord, CreateMedicalRecordData, UpdateMedicalRecordData } from '../types';

export class MedicalRecordService {

  static async findByPetId(petId: number): Promise<MedicalRecord[]> {
    try {
      const response = await apiClient.get(`/pets/${petId}/medical-records`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar prontuários do pet:', error);
      throw new Error('Falha ao buscar prontuários do pet');
    }
  }

  static async create(data: CreateMedicalRecordData): Promise<MedicalRecord> {
    try {
      const response = await apiClient.post('/medical-records', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar prontuário:', error);
      throw new Error('Falha ao criar prontuário');
    }
  }

  static async findById(id: number): Promise<MedicalRecord | null> {
    try {
      const response = await apiClient.get(`/medical-records/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Erro ao buscar prontuário:', error);
      throw new Error('Falha ao buscar prontuário');
    }
  }

  static async findAll(): Promise<MedicalRecord[]> {
    try {
      const response = await apiClient.get('/medical-records');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar todos os prontuários:', error);
      throw new Error('Falha ao buscar prontuários');
    }
  }

  static async update(id: number, data: UpdateMedicalRecordData): Promise<MedicalRecord> {
    try {
      const response = await apiClient.put(`/medical-records/${id}`, data);
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
      await apiClient.delete(`/medical-records/${id}`);
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