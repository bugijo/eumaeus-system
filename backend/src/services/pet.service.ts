import { Pet } from '../models/pet.model';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PetService {
  static async getAllPets(): Promise<Pet[]> {
    try {
      const pets = await prisma.pet.findMany({
        where: {
          deletedAt: null // Filtrar apenas pets não excluídos
        },
        include: {
          tutor: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      return pets;
    } catch (error) {
      console.error('Erro ao buscar todos os pets:', error);
      throw new Error('Erro interno ao buscar pets');
    }
  }

  static async createPet(newPetData: Omit<Pet, 'id' | 'createdAt' | 'updatedAt' | 'tutor'>): Promise<Pet> {
    try {
      console.log('Recebido para criação:', newPetData);
      
      // Tratar formatação da data de nascimento
      let formattedBirthDate: Date | null = null;
      
      if (newPetData.birthDate && typeof newPetData.birthDate === 'string') {
        // Verifica se está no formato brasileiro DD/MM/YYYY
        if (newPetData.birthDate.includes('/')) {
          const [day, month, year] = newPetData.birthDate.split('/');
          // Cria um objeto Date no formato YYYY-MM-DD
          formattedBirthDate = new Date(`${year}-${month}-${day}`);
        } else {
          // Se não está no formato brasileiro, tenta converter diretamente
          formattedBirthDate = new Date(newPetData.birthDate);
        }
      } else if (newPetData.birthDate instanceof Date) {
        formattedBirthDate = newPetData.birthDate;
      }
      
      const createdPet = await prisma.pet.create({
        data: {
          ...newPetData,
          birthDate: formattedBirthDate,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          tutor: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });
      
      console.log('Pet criado:', createdPet);
      return createdPet;
    } catch (error) {
      console.error('Erro ao criar pet:', error);
      throw new Error('Erro interno ao criar pet');
    }
  }

  static async getPetById(id: number): Promise<Pet | null> {
    try {
      const pet = await prisma.pet.findFirst({
        where: {
          id: id,
          deletedAt: null // Filtrar apenas pets não excluídos
        },
        include: {
          tutor: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });
      
      return pet;
    } catch (error) {
      console.error('Erro ao buscar pet por ID:', error);
      throw new Error('Erro interno ao buscar pet');
    }
  }

  static async updatePet(id: number, updateData: Partial<Omit<Pet, 'id' | 'createdAt' | 'updatedAt' | 'tutor'>>): Promise<Pet | null> {
    try {
      // Verificar se o pet existe e não está excluído
      const existingPet = await prisma.pet.findFirst({
        where: {
          id: id,
          deletedAt: null
        }
      });
      
      if (!existingPet) {
        return null;
      }
      
      // Tratar formatação da data de nascimento se estiver sendo atualizada
      let formattedUpdateData = { ...updateData };
      
      if (updateData.birthDate && typeof updateData.birthDate === 'string') {
        // Verifica se está no formato brasileiro DD/MM/YYYY
        if (updateData.birthDate.includes('/')) {
          const [day, month, year] = updateData.birthDate.split('/');
          // Cria um objeto Date no formato YYYY-MM-DD
          formattedUpdateData.birthDate = new Date(`${year}-${month}-${day}`);
        } else {
          // Se não está no formato brasileiro, tenta converter diretamente
          formattedUpdateData.birthDate = new Date(updateData.birthDate);
        }
      }
      
      const updatedPet = await prisma.pet.update({
        where: { id: id },
        data: {
          ...formattedUpdateData,
          updatedAt: new Date()
        },
        include: {
          tutor: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });
      
      console.log('Pet atualizado:', updatedPet);
      return updatedPet;
    } catch (error) {
      console.error('Erro ao atualizar pet:', error);
      throw new Error('Erro interno ao atualizar pet');
    }
  }

  static async deletePet(id: number): Promise<boolean> {
    try {
      // Verificar se o pet existe e não está já excluído
      const pet = await prisma.pet.findFirst({
        where: {
          id: id,
          deletedAt: null
        }
      });
      
      if (!pet) {
        return false;
      }
      
      // Implementar soft delete: marcar como excluído em vez de deletar
      await prisma.pet.update({
        where: { id: id },
        data: {
          deletedAt: new Date()
        }
      });
      
      console.log('Pet marcado como excluído (soft delete):', pet);
      return true;
    } catch (error) {
      console.error('Erro ao excluir pet:', error);
      throw new Error('Erro interno ao excluir pet');
    }
  }

  static async getPetsByTutorId(tutorId: number): Promise<Pet[]> {
    try {
      const pets = await prisma.pet.findMany({
        where: {
          tutorId: tutorId,
          deletedAt: null // Filtrar apenas pets não excluídos
        },
        include: {
          tutor: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        }
      });
      
      return pets;
    } catch (error) {
      console.error('Erro ao buscar pets do tutor:', error);
      throw new Error('Erro interno ao buscar pets do tutor');
    }
  }
}