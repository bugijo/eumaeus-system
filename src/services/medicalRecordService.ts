import { MedicalRecord, CreateMedicalRecordData } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333';

export class MedicalRecordService {
  private static baseUrl = `${API_BASE_URL}/api`;

  static async getRecordsByPetId(petId: number): Promise<MedicalRecord[]> {
    try {
      const response = await fetch(`${this.baseUrl}/pets/${petId}/records`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar prontuários: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao buscar prontuários do pet:', error);
      throw error;
    }
  }

  static async createRecord(appointmentId: number, data: CreateMedicalRecordData): Promise<MedicalRecord> {
    try {
      const response = await fetch(`${this.baseUrl}/appointments/${appointmentId}/records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Erro ao criar prontuário: ${response.statusText}`);
      }
      
      const newRecord = await response.json();
      return newRecord;
    } catch (error) {
      console.error('Erro ao criar prontuário:', error);
      throw error;
    }
  }

  static async getRecordById(id: number): Promise<MedicalRecord> {
    try {
      const response = await fetch(`${this.baseUrl}/records/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Prontuário não encontrado');
        }
        throw new Error(`Erro ao buscar prontuário: ${response.statusText}`);
      }
      
      const record = await response.json();
      return record;
    } catch (error) {
      console.error('Erro ao buscar prontuário:', error);
      throw error;
    }
  }

  static async getAllRecords(): Promise<MedicalRecord[]> {
    try {
      const response = await fetch(`${this.baseUrl}/records`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar prontuários: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao buscar todos os prontuários:', error);
      throw error;
    }
  }

  static async updateMedicalRecord(recordId: number, data: { notes: string; prescription: string }): Promise<MedicalRecord> {
    try {
      const response = await fetch(`${this.baseUrl}/records/${recordId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Prontuário não encontrado');
        }
        throw new Error(`Erro ao atualizar prontuário: ${response.statusText}`);
      }
      
      const updatedRecord = await response.json();
      return updatedRecord;
    } catch (error) {
      console.error('Erro ao atualizar prontuário:', error);
      throw error;
    }
  }
}