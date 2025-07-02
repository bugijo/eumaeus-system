"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetService = void 0;
class PetService {
    static getAllPets() {
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
    static createPet(newPetData) {
        console.log('Recebido para criação:', newPetData);
        const createdPet = {
            id: Math.floor(Math.random() * 1000) + 100,
            ...newPetData
        };
        console.log('Pet criado:', createdPet);
        return createdPet;
    }
    static getPetById(id) {
        const pets = this.getAllPets();
        const pet = pets.find(pet => pet.id === id);
        return pet || null;
    }
    static updatePet(id, updateData) {
        const pets = this.getAllPets();
        const petIndex = pets.findIndex(pet => pet.id === id);
        if (petIndex === -1) {
            return null;
        }
        const updatedPet = {
            ...pets[petIndex],
            ...updateData
        };
        console.log('Pet atualizado:', updatedPet);
        return updatedPet;
    }
    static deletePet(id) {
        const pets = this.getAllPets();
        const petIndex = pets.findIndex(pet => pet.id === id);
        if (petIndex === -1) {
            return false;
        }
        const hasAssociatedRecords = Math.random() < 0.2;
        if (hasAssociatedRecords) {
            throw new Error('Este pet não pode ser excluído pois possui registros associados');
        }
        console.log('Pet deletado:', pets[petIndex]);
        return true;
    }
}
exports.PetService = PetService;
//# sourceMappingURL=pet.service.js.map