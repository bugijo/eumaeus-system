import { Pet } from '../models/pet.model';

export class PetService {
  static getAllPets(): Pet[] {
    return [
      {
        id: 1,
        name: 'Rex',
        species: 'Cão',
        breed: 'Golden Retriever',
        weight: 25.5,
        tutorId: 1
      },
      {
        id: 2,
        name: 'Mimi',
        species: 'Gato',
        breed: 'Persa',
        weight: 4.2,
        tutorId: 2
      },
      {
        id: 3,
        name: 'Thor',
        species: 'Cão',
        breed: 'Pastor Alemão',
        weight: 32.0,
        tutorId: 1
      },
      {
        id: 4,
        name: 'Luna',
        species: 'Gato',
        breed: 'Siamês',
        weight: 3.8,
        tutorId: 3
      }
    ];
  }

  static createPet(newPetData: Omit<Pet, 'id'>): Pet {
    console.log('Recebido para criação:', newPetData);
    
    const createdPet: Pet = {
      id: Math.floor(Math.random() * 1000) + 100,
      ...newPetData
    };
    
    console.log('Pet criado:', createdPet);
    return createdPet;
  }

  static getPetById(id: number): Pet | null {
    const pets = this.getAllPets();
    const pet = pets.find(pet => pet.id === id);
    return pet || null;
  }

  static updatePet(id: number, updateData: Partial<Omit<Pet, 'id'>>): Pet | null {
    const pets = this.getAllPets();
    const petIndex = pets.findIndex(pet => pet.id === id);
    
    if (petIndex === -1) {
      return null;
    }
    
    const updatedPet: Pet = {
      ...pets[petIndex],
      ...updateData
    };
    
    console.log('Pet atualizado:', updatedPet);
    return updatedPet;
  }

  static deletePet(id: number): boolean {
    const pets = this.getAllPets();
    const petIndex = pets.findIndex(pet => pet.id === id);
    
    if (petIndex === -1) {
      return false;
    }
    
    // Simulação de verificação de registros associados
    // Em um sistema real, verificaria agendamentos e prontuários
    const hasAssociatedRecords = Math.random() < 0.2; // 20% chance de ter registros
    
    if (hasAssociatedRecords) {
      throw new Error('Este pet não pode ser excluído pois possui registros associados');
    }
    
    console.log('Pet deletado:', pets[petIndex]);
    return true;
  }
}