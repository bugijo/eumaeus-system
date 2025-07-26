import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dashboardController = {
  async getStats(req: Request, res: Response) {
    try {
      const tutorCount = await prisma.tutor.count({
        where: { deletedAt: null }
      });
      const petCount = await prisma.pet.count({
        where: { deletedAt: null }
      });
      const appointmentCount = await prisma.appointment.count();
      const productCount = await prisma.product.count();

      res.json({
        tutorCount,
        petCount,
        appointmentCount,
        productCount
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async getUpcomingAppointments(req: Request, res: Response): Promise<Response | void> {
    try {
      const now = new Date();
      const upcomingAppointments = await prisma.appointment.findMany({
        where: {
          appointmentDate: {
            gte: now, // gte = "greater than or equal to" (maior ou igual a)
          },
          status: {
            not: 'CANCELLED', // Ignorar agendamentos cancelados
          },
          pet: {
            deletedAt: null // Apenas pets não excluídos
          }
        },
        orderBy: {
          appointmentDate: 'asc', // Ordenar pelos mais próximos
        },
        take: 5, // Pegar apenas os próximos 5
        include: { // Incluir dados do pet para exibir o nome
          pet: {
            select: { name: true },
          },
        },
      });
      return res.json(upcomingAppointments);
    } catch (error) {
      console.error("Erro ao buscar próximos agendamentos:", error);
      return res.status(500).json({ message: "Erro ao buscar agendamentos" });
    }
  },

  async getRecentActivities(req: Request, res: Response): Promise<Response | void> {
    try {
      const recentRecords = await prisma.medicalRecord.findMany({
        orderBy: {
          createdAt: 'desc', // Ordenar pelos mais recentes
        },
        take: 5,
        include: {
          appointment: {
            include: {
              pet: { select: { name: true } },
            },
          },
        },
      });

      // Podemos formatar os dados aqui para criar uma descrição da atividade
      const activities = recentRecords.map(record => ({
        id: record.id,
        description: `Consulta finalizada para ${record.appointment.pet.name}`,
        date: record.createdAt,
        type: 'CONSULTA',
      }));

      return res.json(activities);
    } catch (error) {
      console.error("Erro ao buscar atividades recentes:", error);
      return res.status(500).json({ message: "Erro ao buscar atividades" });
    }
  },

  async getRecentActivity(req: Request, res: Response) {
    try {
      const recentAppointments = await prisma.appointment.findMany({
        where: {
          pet: {
            deletedAt: null // Apenas pets não excluídos
          }
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          pet: { 
            include: { 
              tutor: {
                where: { deletedAt: null } // Apenas tutores não excluídos
              }
            }
          }
        }
      });

      const activities = recentAppointments.map(appointment => ({
        id: appointment.id,
        type: 'appointment',
        title: `Agendamento para ${appointment.pet.name}`,
        description: `Tutor: ${appointment.pet.tutor.name}`,
        date: appointment.appointmentDate,
        status: appointment.status
      }));

      res.json(activities);
    } catch (error) {
      console.error('Erro ao buscar atividades recentes:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
};