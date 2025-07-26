import { Tutor } from '../models/tutor.model';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class TutorService {
  static async getTutorStats(): Promise<{ total: number; active: number }> {
    try {
      const totalCount = await prisma.tutor.count({
        where: { deletedAt: null }
      });
      
      // Por enquanto, todos os tutores não deletados são considerados ativos
      const activeCount = totalCount;
      
      return { total: totalCount, active: activeCount };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de tutores:', error);
      throw new Error('Erro interno ao buscar estatísticas de tutores');
    }
  }

  static async getAllTutors(): Promise<Tutor[]> {
    try {
      const tutors = await prisma.tutor.findMany({
        where: {
          deletedAt: null, // Busca apenas os tutores que não foram "deletados"
        },
        orderBy: {
          name: 'asc', // Ordena por nome
        },
      });
      return tutors;
    } catch (error) {
      console.error('Erro ao buscar tutores:', error);
      throw new Error('Erro interno ao buscar tutores');
    }
  }

  static async createTutor(newTutorData: Omit<Tutor, 'id'>): Promise<Tutor> {
    try {
      console.log('Recebido para criação:', newTutorData);
      
      const createdTutor = await prisma.tutor.create({
        data: newTutorData
      });
      
      console.log('Tutor criado:', createdTutor);
      return createdTutor;
    } catch (error) {
      console.error('Erro ao criar tutor:', error);
      throw new Error('Erro interno ao criar tutor');
    }
  }

  static async getTutorById(id: number): Promise<Tutor | null> {
    try {
      const tutor = await prisma.tutor.findFirst({
        where: {
          id: id,
          deletedAt: null
        }
      });
      return tutor;
    } catch (error) {
      console.error('Erro ao buscar tutor:', error);
      throw new Error('Erro interno ao buscar tutor');
    }
  }

  static async updateTutor(id: number, updatedData: Omit<Tutor, 'id'>): Promise<Tutor | null> {
    try {
      console.log('Recebido para atualização:', { id, updatedData });
      
      // Verificar se o tutor existe e não está deletado
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
    } catch (error) {
      console.error('Erro ao atualizar tutor:', error);
      throw new Error('Erro interno ao atualizar tutor');
    }
  }

  static async deleteTutor(id: number): Promise<boolean> {
    try {
      console.log('Recebido para deleção:', { id });
      
      // Verificar se o tutor existe e não está deletado
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
      
      // Soft delete - marcar como deletado
      await prisma.tutor.update({
        where: { id: id },
        data: {
          deletedAt: new Date()
        }
      });
      
      console.log('Tutor deletado com sucesso:', existingTutor);
      return true;
    } catch (error) {
      console.error('Erro ao excluir tutor:', error);
      throw new Error('Erro interno ao excluir tutor');
    }
  }
}