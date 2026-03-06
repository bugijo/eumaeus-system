import apiClient from '../api/apiClient';
import type { 
  Tutor, 
  CreateTutorData, 
  UpdateTutorData, 
  TutorSearchParams,
  PaginatedResponse 
} from '../types';

export class TutorService {
  private static resolveTutorListPayload(raw: unknown): {
    data: Tutor[];
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
  } {
    if (Array.isArray(raw)) {
      return { data: raw as Tutor[] };
    }

    const root = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};
    const nested = (root.data && typeof root.data === 'object' && !Array.isArray(root.data))
      ? root.data as Record<string, unknown>
      : null;

    // Suporta payload direto ({ data, total... }) e envelope ({ success, data: { data, total... } }).
    const source = Array.isArray(root.data) || root.total !== undefined || root.page !== undefined || root.pagination !== undefined
      ? root
      : (nested ?? root);

    return {
      data: Array.isArray(source.data) ? source.data as Tutor[] : [],
      total: typeof source.total === 'number' ? source.total : undefined,
      page: typeof source.page === 'number' ? source.page : undefined,
      limit: typeof source.limit === 'number' ? source.limit : undefined,
      totalPages: typeof source.totalPages === 'number' ? source.totalPages : undefined,
      pagination: (source.pagination && typeof source.pagination === 'object')
        ? source.pagination as { total?: number; page?: number; limit?: number; totalPages?: number }
        : undefined,
    };
  }

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
      const payload = TutorService.resolveTutorListPayload(response.data);
      const data = payload.data;
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
