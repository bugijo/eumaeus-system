import apiClient from '../api/apiClient';
import type { 
  Pet, 
  CreatePetData, 
  UpdatePetData, 
  PetSearchParams,
  PaginatedResponse 
} from '../types';

export class PetService {
  static async create(data: CreatePetData): Promise<Pet> {
    try {
      const response = await apiClient.post('/pets', data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar pet:', error);
      throw new Error('Falha ao criar pet');
    }
  }

  static async createForTutor(tutorId: number, data: Omit<CreatePetData, 'tutorId'>): Promise<Pet> {
    try {
      const response = await apiClient.post(`/tutors/${tutorId}/pets`, data);
      return response.data;
    } catch (error) {
      console.error('Erro ao criar pet para tutor:', error);
      throw new Error('Falha ao criar pet para tutor');
    }
  }

  static async findAll(params?: PetSearchParams): Promise<PaginatedResponse<Pet>> {
    try {
      const response = await apiClient.get('/pets', { params });
      const pets: Pet[] = response.data;
      
      // Para manter compatibilidade com a interface PaginatedResponse
      // Por enquanto retornamos todos os dados sem paginação real
      const page = params?.page || 1;
      const limit = params?.limit || 10;

      return {
        data: pets,
        total: pets.length,
        page,
        limit,
        totalPages: Math.ceil(pets.length / limit)
      };
    } catch (error) {
      console.error('Erro ao buscar pets:', error);
      throw new Error('Falha ao buscar pets');
    }
  }

  static async findById(id: number): Promise<Pet | null> {
    try {
      const response = await apiClient.get(`/pets/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Erro ao buscar pet:', error);
      throw new Error('Falha ao buscar pet');
    }
  }

  static async findByTutorId(tutorId: number): Promise<Pet[]> {
    try {
      const response = await apiClient.get(`/tutors/${tutorId}/pets`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar pets do tutor:', error);
      throw new Error('Falha ao buscar pets do tutor');
    }
  }

  static async update(id: number, data: UpdatePetData): Promise<Pet> {
    try {
      const response = await apiClient.put(`/pets/${id}`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Pet não encontrado');
      }
      console.error('Erro ao atualizar pet:', error);
      throw new Error('Falha ao atualizar pet');
    }
  }

  static async delete(id: number): Promise<void> {
    try {
      await apiClient.delete(`/pets/${id}`);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('Pet não encontrado');
      }
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        throw new Error(errorData.error || 'Erro ao excluir pet');
      }
      console.error('Erro ao excluir pet:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Falha ao excluir pet');
    }
  }

  static async getSpeciesStats(): Promise<Array<{ species: string; count: number }>> {
    try {
      const response = await apiClient.get('/pets');
      const pets: Pet[] = response.data;
      const speciesCount: { [key: string]: number } = {};
      
      pets.forEach(pet => {
        speciesCount[pet.species] = (speciesCount[pet.species] || 0) + 1;
      });
      
      return Object.entries(speciesCount).map(([species, count]) => ({
        species,
        count
      }));
    } catch (error) {
      console.error('Erro ao buscar estatísticas de espécies:', error);
      throw new Error('Falha ao buscar estatísticas de espécies');
    }
  }

  static async getAgeStats(): Promise<{
    puppies: number;
    adults: number;
    seniors: number;
    unknown: number;
  }> {
    try {
      // Implementação simplificada para esta fase
      return {
        puppies: 0,
        adults: 0,
        seniors: 0,
        unknown: 0
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de idade:', error);
      throw new Error('Falha ao buscar estatísticas de idade');
    }
  }
}