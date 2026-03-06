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

      // Suporta tanto o formato legado (array) quanto o formato paginado
      // vindo do backend ({ data, total, page, limit } ou { data, pagination }).
      if (Array.isArray(response.data)) {
        const tutors = response.data as Tutor[];
        const page = params?.page || 1;
        const limit = params?.limit || 10;

        return {
          data: tutors,
          total: tutors.length,
          page,
          limit,
          totalPages: Math.ceil(tutors.length / limit)
        };
      }

      const payload = response.data as {
        data?: Tutor[];
        total?: number;
        page?: number;
        limit?: number;
        totalPages?: number;
        pagination?: {
          total?: number;
          page?: number;
          limit?: number;
          totalPages?: number;
        };
      };

      const data = Array.isArray(payload?.data) ? payload.data : [];
      const page = payload.page ?? payload.pagination?.page ?? params?.page ?? 1;
      const limit = payload.limit ?? payload.pagination?.limit ?? params?.limit ?? 10;
      const total = payload.total ?? payload.pagination?.total ?? data.length;
      const totalPages = payload.totalPages
        ?? payload.pagination?.totalPages
        ?? Math.max(1, Math.ceil(total / Math.max(limit, 1)));

      return {
        data,
        total,
        page,
        limit,
        totalPages
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
    active: number;
  }> {
    try {
      const response = await apiClient.get('/tutors/stats');
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar estatísticas de tutores:', error);
      throw new Error('Falha ao buscar estatísticas');
    }
  }

  // Métodos para o portal do tutor
  static async getMyProfile(): Promise<Tutor> {
    try {
      const response = await apiClient.get('/portal/my-profile');
      return response.data.data;
    } catch (error) {
      console.error('Erro ao buscar perfil do tutor:', error);
      throw new Error('Falha ao buscar perfil');
    }
  }

  static async updateMyProfile(data: UpdateTutorData): Promise<Tutor> {
    try {
      const response = await apiClient.put('/portal/my-profile', data);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      console.error('Erro ao atualizar perfil do tutor:', error);
      throw new Error('Falha ao atualizar perfil');
    }
  }
}
