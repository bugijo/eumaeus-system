import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppointmentWithRelations } from '../types';

const prisma = new PrismaClient();

// Cache simples para estatísticas (5 minutos)
let statsCache: any = null;
let statsCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export const dashboardController = {
  async getStats(req: Request, res: Response) {
    try {
      // Verificar cache
      const now = Date.now();
      if (statsCache && (now - statsCacheTime) < CACHE_DURATION) {
        return res.json(statsCache);
      }

      // Executar queries em paralelo para melhor performance
      const [tutorCount, petCount, appointmentCount, productCount, monthlyRevenue] = await Promise.all([
        prisma.tutor.count({
          where: { deletedAt: null }
        }),
        prisma.pet.count({
          where: { deletedAt: null }
        }),
        prisma.appointment.count(),
        prisma.product.count(),
        // Adicionar receita mensal
        prisma.invoice.aggregate({
          _sum: { total: true },
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        })
      ]);

      const stats = {
        tutorCount,
        petCount,
        appointmentCount,
        productCount,
        monthlyRevenue: monthlyRevenue._sum.total || 0
      };

      // Atualizar cache
      statsCache = stats;
      statsCacheTime = now;

      res.json(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas do dashboard:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async getUpcomingAppointments(req: Request, res: Response): Promise<Response | void> {
    try {
      const now = new Date();
      const upcomingAppointments: AppointmentWithRelations[] = await prisma.appointment.findMany({
        where: {
          appointmentDate: {
            gte: now,
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Próximos 7 dias apenas
          },
          status: {
            in: ['SCHEDULED', 'CONFIRMED'] // Apenas agendados e confirmados
          },
          pet: {
            deletedAt: null
          }
        },
        orderBy: {
          appointmentDate: 'asc'
        },
        take: 5,
        select: {
          id: true,
          appointmentDate: true,
          status: true,
          notes: true,
          pet: {
            select: {
              id: true,
              name: true,
              species: true
            }
          },
          tutor: {
            select: {
              id: true,
              name: true,
              phone: true
            }
          }
        }
      });
      return res.json(upcomingAppointments);
    } catch (error) {
      console.error("Erro ao buscar próximos agendamentos:", error);
      return res.status(500).json({ message: "Erro ao buscar agendamentos" });
    }
  },

  async getRecentActivities(req: Request, res: Response): Promise<Response | void> {
    try {
      // Buscar atividades dos últimos 30 dias apenas
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const [recentRecords, recentAppointments, recentInvoices] = await Promise.all([
        // Prontuários recentes
        prisma.medicalRecord.findMany({
          where: {
            createdAt: { gte: thirtyDaysAgo }
          },
          orderBy: { createdAt: 'desc' },
          take: 3,
          select: {
            id: true,
            createdAt: true,
            appointment: {
              select: {
                pet: { select: { name: true } }
              }
            }
          }
        }),
        // Agendamentos recentes
        prisma.appointment.findMany({
          where: {
            createdAt: { gte: thirtyDaysAgo },
            pet: { deletedAt: null }
          },
          orderBy: { createdAt: 'desc' },
          take: 2,
          select: {
            id: true,
            createdAt: true,
            status: true,
            pet: { select: { name: true } },
            tutor: { select: { name: true } }
          }
        }),
        // Faturas recentes
        prisma.invoice.findMany({
          where: {
            createdAt: { gte: thirtyDaysAgo }
          },
          orderBy: { createdAt: 'desc' },
          take: 2,
          select: {
            id: true,
            createdAt: true,
            total: true,
            status: true
          }
        })
      ]);

      // Combinar e formatar atividades
      const activities = [
        ...recentRecords.map(record => ({
          id: `record-${record.id}`,
          type: 'consultation',
          description: `Consulta finalizada para ${record.appointment.pet.name}`,
          timestamp: record.createdAt.toISOString()
        })),
        ...recentAppointments.map(appointment => ({
          id: `appointment-${appointment.id}`,
          type: 'appointment',
          description: `Agendamento ${appointment.status.toLowerCase()} para ${appointment.pet.name}`,
          timestamp: appointment.createdAt.toISOString()
        })),
        ...recentInvoices.map(invoice => ({
          id: `invoice-${invoice.id}`,
          type: 'payment',
          description: `Fatura de R$ ${invoice.total.toFixed(2)} - ${invoice.status}`,
          timestamp: invoice.createdAt.toISOString()
        }))
      ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

      return res.json(activities);
    } catch (error) {
      console.error("Erro ao buscar atividades recentes:", error);
      return res.status(500).json({ message: "Erro ao buscar atividades" });
    }
  },

  async getRecentActivity(req: Request, res: Response) {
    try {
      const recentAppointments: AppointmentWithRelations[] = await prisma.appointment.findMany({
        where: {
          pet: {
            deletedAt: null // Apenas pets não excluídos
          }
        },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          pet: true,
          tutor: true
        }
      });

      const activities = recentAppointments.map(appointment => ({
        id: appointment.id,
        type: 'appointment',
        title: `Agendamento para ${appointment.pet?.name || 'Pet não informado'}`,
        description: `Tutor: ${appointment.tutor?.name || 'Tutor não informado'}`,
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