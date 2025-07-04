import apiClient from '../api/apiClient';
import type { 
  Tutor, 
  CreateTutorData, 
  UpdateTutorData, 
  TutorSearchParams,
  PaginatedResponse 
} from '../types';

export class TutorService {
  static async create(data: CreateTutorData): Promise<Tutor> {
    try {
      const response = await apiClient.post('/tutors', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar tutor:', error);
      throw new Error('Falha ao criar tutor');
    }
  }

  static async findAll(params?: TutorSearchParams): Promise<PaginatedResponse<Tutor>> {
    try {
      const response = await apiClient.get('/tutors', { params });
      const tutors: Tutor[] = response.data;
      
      // Para manter compatibilidade com a interface PaginatedResponse
      // Por enquanto retornamos todos os dados sem paginação real
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      
      return {
        data: tutors,
        total: tutors.length,
        page,
        limit,
        totalPages: Math.ceil(tutors.length / limit)
      };
    } catch (error) {
      console.error('Erro ao buscar tutores:', error);
      throw new Error('Falha ao buscar tutores');
    }
  }

  static async findById(id: number): Promise<Tutor | null> {
    try {
      const response = await apiClient.get(`/tutors/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Erro ao buscar tutor:', error);
      throw new Error('Falha ao buscar tutor');
    }
  }

  static async update(id: number, data: UpdateTutorData): Promise<Tutor> {
    try {
      const response = await apiClient.put(`/tutors/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar tutor:', error);
      throw new Error('Falha ao atualizar tutor');
    }
  }

  static async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/tutors/${id}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Tutor não encontrado');
      }
      console.error('Erro ao deletar tutor:', error);
      throw new Error('Falha ao deletar tutor');
    }
  }

  static async findByEmail(email: string): Promise<Tutor | null> {
    try {
      const response = await apiClient.get(`/tutors/email/${email}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Erro ao buscar tutor por email:', error);
      throw new Error('Falha ao buscar tutor por email');
    }
  }

  static async getStats(): Promise<{
    total: number;
    withPets: number;
    withAppointments: number;
  }> {
    try {
      const response = await apiClient.get('/tutors/stats');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas de tutores:', error);
      throw new Error('Falha ao buscar estatísticas');
    }
  }
}