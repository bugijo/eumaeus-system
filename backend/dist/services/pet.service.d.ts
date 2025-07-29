import { Pet } from '../models/pet.model';
export declare class PetService {
    static getAllPets(): Promise<Pet[]>;
    static createPet(newPetData: Omit<Pet, 'id' | 'createdAt' | 'updatedAt' | 'tutor'>): Promise<Pet>;
    static getPetById(id: number): Promise<Pet | null>;
    static updatePet(id: number, updateData: Partial<Omit<Pet, 'id' | 'createdAt' | 'updatedAt' | 'tutor'>>): Promise<Pet | null>;
    static deletePet(id: number): Promise<boolean>;
    static getPetsByTutorId(tutorId: number): Promise<Pet[]>;
}
//# sourceMappingURL=pet.service.d.ts.map