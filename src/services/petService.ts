import type { 
  Pet, 
  CreatePetData, 
  UpdatePetData, 
  PetSearchParams,
  PaginatedResponse 
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3333';

export class PetService {
  static async create(data: CreatePetData): Promise<Pet> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const pet: Pet = await response.json();
      return pet;
    } catch (error) {
      console.error('Erro ao criar pet:', error);
      throw new Error('Falha ao criar pet');
    }
  }

  static async findAll(params?: PetSearchParams): Promise<PaginatedResponse<Pet>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pets`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const pets: Pet[] = await response.json();
      
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
      const response = await fetch(`${API_BASE_URL}/api/pets/${id}`);
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const pet: Pet = await response.json();
      return pet;
    } catch (error) {
      console.error('Erro ao buscar pet:', error);
      throw new Error('Falha ao buscar pet');
    }
  }

  static async findByTutorId(tutorId: number): Promise<Pet[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pets`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const pets: Pet[] = await response.json();
      return pets.filter(pet => pet.tutorId === tutorId);
    } catch (error) {
      console.error('Erro ao buscar pets do tutor:', error);
      throw new Error('Falha ao buscar pets do tutor');
    }
  }

  static async update(id: number, data: UpdatePetData): Promise<Pet> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Pet não encontrado');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedPet: Pet = await response.json();
      return updatedPet;
    } catch (error) {
      console.error('Erro ao atualizar pet:', error);
      throw new Error('Falha ao atualizar pet');
    }
  }

  static async delete(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pets/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Pet não encontrado');
        }
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao excluir pet');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Erro ao excluir pet:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Falha ao excluir pet');
    }
  }

  static async getSpeciesStats(): Promise<Array<{ species: string; count: number }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pets`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const pets: Pet[] = await response.json();
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