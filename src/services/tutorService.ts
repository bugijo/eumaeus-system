import type { 
  Tutor, 
  CreateTutorData, 
  UpdateTutorData, 
  TutorSearchParams,
  PaginatedResponse 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333';

export class TutorService {
  static async create(data: CreateTutorData): Promise<Tutor> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tutors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const tutor: Tutor = await response.json();
      return tutor;
    } catch (error) {
      console.error('Erro ao criar tutor:', error);
      throw new Error('Falha ao criar tutor');
    }
  }

  static async findAll(params?: TutorSearchParams): Promise<PaginatedResponse<Tutor>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tutors`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const tutors: Tutor[] = await response.json();
      
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
      const response = await fetch(`${API_BASE_URL}/api/tutors/${id}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const tutor: Tutor = await response.json();
      return tutor;
    } catch (error) {
      console.error('Erro ao buscar tutor:', error);
      throw new Error('Falha ao buscar tutor');
    }
  }

  static async update(id: number, data: UpdateTutorData): Promise<Tutor> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tutors/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const tutor: Tutor = await response.json();
      return tutor;
    } catch (error) {
      console.error('Erro ao atualizar tutor:', error);
      throw new Error('Falha ao atualizar tutor');
    }
  }

  static async delete(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tutors/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Tutor não encontrado');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao deletar tutor:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Falha ao deletar tutor');
    }
  }

  static async findByEmail(email: string): Promise<Tutor | null> {
    try {
      const tutor = await prisma.tutor.findUnique({
        where: { email },
        include: {
          pets: true
        }
      });
      return tutor;
    } catch (error) {
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
      const [total, withPets, withAppointments] = await Promise.all([
        prisma.tutor.count(),
        prisma.tutor.count({
          where: {
            pets: {
              some: {}
            }
          }
        }),
        prisma.tutor.count({
          where: {
            appointments: {
              some: {}
            }
          }
        })
      ]);

      return {
        total,
        withPets,
        withAppointments
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de tutores:', error);
      throw new Error('Falha ao buscar estatísticas');
    }
  }
}