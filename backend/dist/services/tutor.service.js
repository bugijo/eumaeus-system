"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TutorService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class TutorService {
    static async getTutorStats() {
        try {
            const totalCount = await prisma.tutor.count({
                where: { deletedAt: null }
            });
            const activeCount = totalCount;
            return { total: totalCount, active: activeCount };
        }
        catch (error) {
            console.error('Erro ao buscar estatísticas de tutores:', error);
            throw new Error('Erro interno ao buscar estatísticas de tutores');
        }
    }
    static async getAllTutors() {
        try {
            const tutors = await prisma.tutor.findMany({
                where: {
                    deletedAt: null,
                },
                orderBy: {
                    name: 'asc',
                },
            });
            return tutors;
        }
        catch (error) {
            console.error('Erro ao buscar tutores:', error);
            throw new Error('Erro interno ao buscar tutores');
        }
    }
    static async createTutor(newTutorData) {
        try {
            console.log('Recebido para criação:', newTutorData);
            const createdTutor = await prisma.tutor.create({
                data: newTutorData
            });
            console.log('Tutor criado:', createdTutor);
            return createdTutor;
        }
        catch (error) {
            console.error('Erro ao criar tutor:', error);
            throw new Error('Erro interno ao criar tutor');
        }
    }
    static async getTutorById(id) {
        try {
            const tutor = await prisma.tutor.findFirst({
                where: {
                    id: id,
                    deletedAt: null
                }
            });
            return tutor;
        }
        catch (error) {
            console.error('Erro ao buscar tutor:', error);
            throw new Error('Erro interno ao buscar tutor');
        }
    }
    static async updateTutor(id, updatedData) {
        try {
            console.log('Recebido para atualização:', { id, updatedData });
            const existingTutor = await prisma.tutor.findFirst({
                where: {
                    id: id,
                    deletedAt: null
                }
            });
            if (!existingTutor) {
                return null;
            }
            const updatedTutor = await prisma.tutor.update({
                where: { id: id },
                data: updatedData
            });
            console.log('Tutor atualizado:', updatedTutor);
            return updatedTutor;
        }
        catch (error) {
            console.error('Erro ao atualizar tutor:', error);
            throw new Error('Erro interno ao atualizar tutor');
        }
    }
    static async deleteTutor(id) {
        try {
            console.log('Recebido para deleção:', { id });
            const existingTutor = await prisma.tutor.findFirst({
                where: {
                    id: id,
                    deletedAt: null
                }
            });
            if (!existingTutor) {
                console.log('Tutor não encontrado:', id);
                return false;
            }
            await prisma.tutor.update({
                where: { id: id },
                data: {
                    deletedAt: new Date()
                }
            });
            console.log('Tutor deletado com sucesso:', existingTutor);
            return true;
        }
        catch (error) {
            console.error('Erro ao excluir tutor:', error);
            throw new Error('Erro interno ao excluir tutor');
        }
    }
}
exports.TutorService = TutorService;
//# sourceMappingURL=tutor.service.js.map