"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class PetService {
    static async getAllPets() {
        try {
            const pets = await prisma.pet.findMany({
                where: {
                    deletedAt: null
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
        }
        catch (error) {
            console.error('Erro ao buscar todos os pets:', error);
            throw new Error('Erro interno ao buscar pets');
        }
    }
    static async createPet(newPetData) {
        try {
            console.log('Recebido para criação:', newPetData);
            let formattedBirthDate = null;
            if (newPetData.birthDate && typeof newPetData.birthDate === 'string') {
                if (newPetData.birthDate.includes('/')) {
                    const [day, month, year] = newPetData.birthDate.split('/');
                    formattedBirthDate = new Date(`${year}-${month}-${day}`);
                }
                else {
                    formattedBirthDate = new Date(newPetData.birthDate);
                }
            }
            else if (newPetData.birthDate instanceof Date) {
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
        }
        catch (error) {
            console.error('Erro ao criar pet:', error);
            throw new Error('Erro interno ao criar pet');
        }
    }
    static async getPetById(id) {
        try {
            const pet = await prisma.pet.findFirst({
                where: {
                    id: id,
                    deletedAt: null
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
        }
        catch (error) {
            console.error('Erro ao buscar pet por ID:', error);
            throw new Error('Erro interno ao buscar pet');
        }
    }
    static async updatePet(id, updateData) {
        try {
            const existingPet = await prisma.pet.findFirst({
                where: {
                    id: id,
                    deletedAt: null
                }
            });
            if (!existingPet) {
                return null;
            }
            let formattedUpdateData = { ...updateData };
            if (updateData.birthDate && typeof updateData.birthDate === 'string') {
                if (updateData.birthDate.includes('/')) {
                    const [day, month, year] = updateData.birthDate.split('/');
                    formattedUpdateData.birthDate = new Date(`${year}-${month}-${day}`);
                }
                else {
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
        }
        catch (error) {
            console.error('Erro ao atualizar pet:', error);
            throw new Error('Erro interno ao atualizar pet');
        }
    }
    static async deletePet(id) {
        try {
            const pet = await prisma.pet.findFirst({
                where: {
                    id: id,
                    deletedAt: null
                }
            });
            if (!pet) {
                return false;
            }
            await prisma.pet.update({
                where: { id: id },
                data: {
                    deletedAt: new Date()
                }
            });
            console.log('Pet marcado como excluído (soft delete):', pet);
            return true;
        }
        catch (error) {
            console.error('Erro ao excluir pet:', error);
            throw new Error('Erro interno ao excluir pet');
        }
    }
    static async getPetsByTutorId(tutorId) {
        try {
            const pets = await prisma.pet.findMany({
                where: {
                    tutorId: tutorId,
                    deletedAt: null
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
        }
        catch (error) {
            console.error('Erro ao buscar pets do tutor:', error);
            throw new Error('Erro interno ao buscar pets do tutor');
        }
    }
}
exports.PetService = PetService;
//# sourceMappingURL=pet.service.js.map