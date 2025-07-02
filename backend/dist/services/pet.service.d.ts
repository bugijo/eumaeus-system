import { Pet } from '../models/pet.model';
export declare class PetService {
    static getAllPets(): Pet[];
    static createPet(newPetData: Omit<Pet, 'id'>): Pet;
    static getPetById(id: number): Pet | null;
    static updatePet(id: number, updateData: Partial<Omit<Pet, 'id'>>): Pet | null;
    static deletePet(id: number): boolean;
}
//# sourceMappingURL=pet.service.d.ts.map