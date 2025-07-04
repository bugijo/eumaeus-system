import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default {
  async getStats(req: Request, res: Response): Promise<Response | void> {
    try {
      const tutorCount = await prisma.tutor.count();
      const petCount = await prisma.pet.count();
      const appointmentCount = await prisma.appointment.count();

      // Vamos adicionar mais stats aqui no futuro!
      // Nota: productCount removido temporariamente até o modelo Product ser criado

      return res.json({ tutorCount, petCount, appointmentCount, productCount: 0 });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return res.status(500).json({ message: 'Erro ao buscar estatísticas' });
    }
  }
};