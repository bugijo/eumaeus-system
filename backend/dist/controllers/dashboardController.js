"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dashboardController = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.dashboardController = {
    async getStats(req, res) {
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
        }
        catch (error) {
            console.error('Erro ao buscar estatísticas do dashboard:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    },
    async getUpcomingAppointments(req, res) {
        try {
            const now = new Date();
            const upcomingAppointments = await prisma.appointment.findMany({
                where: {
                    appointmentDate: {
                        gte: now,
                    },
                    status: {
                        not: 'CANCELLED',
                    },
                    pet: {
                        deletedAt: null
                    }
                },
                orderBy: {
                    appointmentDate: 'asc',
                },
                take: 5,
                include: {
                    pet: true,
                    tutor: true
                },
            });
            return res.json(upcomingAppointments);
        }
        catch (error) {
            console.error("Erro ao buscar próximos agendamentos:", error);
            return res.status(500).json({ message: "Erro ao buscar agendamentos" });
        }
    },
    async getRecentActivities(req, res) {
        try {
            const recentRecords = await prisma.medicalRecord.findMany({
                orderBy: {
                    createdAt: 'desc',
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
            const activities = recentRecords.map(record => ({
                id: record.id,
                description: `Consulta finalizada para ${record.appointment.pet.name}`,
                date: record.createdAt,
                type: 'CONSULTA',
            }));
            return res.json(activities);
        }
        catch (error) {
            console.error("Erro ao buscar atividades recentes:", error);
            return res.status(500).json({ message: "Erro ao buscar atividades" });
        }
    },
    async getRecentActivity(req, res) {
        try {
            const recentAppointments = await prisma.appointment.findMany({
                where: {
                    pet: {
                        deletedAt: null
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
        }
        catch (error) {
            console.error('Erro ao buscar atividades recentes:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
};
//# sourceMappingURL=dashboardController.js.map