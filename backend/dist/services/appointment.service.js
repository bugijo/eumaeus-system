"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class AppointmentService {
    static async getAllAppointments() {
        try {
            const appointments = await prisma.appointment.findMany({
                include: {
                    pet: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    tutor: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    services: {
                        select: {
                            name: true,
                            price: true
                        }
                    }
                },
                orderBy: {
                    appointmentDate: 'asc'
                }
            });
            return appointments.map(appointment => ({
                id: appointment.id,
                petId: appointment.petId,
                tutorId: appointment.tutorId,
                appointmentDate: appointment.appointmentDate,
                date: appointment.appointmentDate,
                time: appointment.appointmentDate.toTimeString().slice(0, 5),
                status: this.mapStatusToLegacy(appointment.status),
                createdAt: appointment.createdAt,
                updatedAt: appointment.updatedAt
            }));
        }
        catch (error) {
            console.error('Erro ao buscar agendamentos:', error);
            throw error;
        }
    }
    static async createAppointment(newAppointmentData) {
        try {
            console.log('Recebido para criação de agendamento:', newAppointmentData);
            const appointmentDateTime = new Date(`${newAppointmentData.date}T${newAppointmentData.time}:00`);
            const createdAppointment = await prisma.appointment.create({
                data: {
                    petId: newAppointmentData.petId,
                    tutorId: newAppointmentData.tutorId,
                    appointmentDate: appointmentDateTime,
                    date: appointmentDateTime,
                    time: newAppointmentData.time,
                    status: 'SCHEDULED',
                    notes: newAppointmentData.notes || null
                },
                include: {
                    pet: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    tutor: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });
            if (newAppointmentData.serviceType) {
                await prisma.service.create({
                    data: {
                        name: newAppointmentData.serviceType,
                        price: 50.0,
                        appointmentId: createdAppointment.id
                    }
                });
            }
            console.log('Agendamento criado no banco:', createdAppointment);
            return {
                id: createdAppointment.id,
                petId: createdAppointment.petId,
                tutorId: createdAppointment.tutorId,
                appointmentDate: createdAppointment.appointmentDate,
                date: createdAppointment.appointmentDate,
                time: createdAppointment.appointmentDate.toTimeString().slice(0, 5),
                status: this.mapStatusToLegacy(createdAppointment.status),
                createdAt: createdAppointment.createdAt,
                updatedAt: createdAppointment.updatedAt
            };
        }
        catch (error) {
            console.error('Erro ao criar agendamento:', error);
            throw error;
        }
    }
    static mapStatusToLegacy(status) {
        const statusMap = {
            'SCHEDULED': 'Agendado',
            'CONFIRMED': 'Confirmado',
            'COMPLETED': 'Concluído',
            'CANCELLED': 'Cancelado'
        };
        return statusMap[status] || 'Agendado';
    }
    static async getAppointmentById(id) {
        try {
            const appointment = await prisma.appointment.findUnique({
                where: { id },
                include: {
                    pet: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    tutor: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    services: {
                        select: {
                            name: true,
                            price: true
                        }
                    }
                }
            });
            if (!appointment)
                return null;
            return {
                id: appointment.id,
                petId: appointment.petId,
                tutorId: appointment.tutorId,
                appointmentDate: appointment.appointmentDate,
                date: appointment.appointmentDate,
                time: appointment.appointmentDate.toTimeString().slice(0, 5),
                status: this.mapStatusToLegacy(appointment.status),
                createdAt: appointment.createdAt,
                updatedAt: appointment.updatedAt
            };
        }
        catch (error) {
            console.error('Erro ao buscar agendamento por ID:', error);
            throw error;
        }
    }
    static async updateAppointment(id, updateData) {
        try {
            console.log(`Atualizando agendamento ${id}:`, updateData);
            const updatePayload = {};
            if (updateData.date && updateData.time) {
                updatePayload.appointmentDate = new Date(`${updateData.date}T${updateData.time}:00`);
            }
            if (updateData.status) {
                const statusMap = {
                    'Agendado': 'SCHEDULED',
                    'Confirmado': 'CONFIRMED',
                    'Concluído': 'COMPLETED',
                    'Cancelado': 'CANCELLED'
                };
                updatePayload.status = statusMap[updateData.status] || 'SCHEDULED';
            }
            const updatedAppointment = await prisma.appointment.update({
                where: { id },
                data: updatePayload,
                include: {
                    pet: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    tutor: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    services: {
                        select: {
                            name: true,
                            price: true
                        }
                    }
                }
            });
            return {
                id: updatedAppointment.id,
                petId: updatedAppointment.petId,
                tutorId: updatedAppointment.tutorId,
                appointmentDate: updatedAppointment.appointmentDate,
                date: updatedAppointment.appointmentDate,
                time: updatedAppointment.appointmentDate.toTimeString().slice(0, 5),
                status: this.mapStatusToLegacy(updatedAppointment.status),
                createdAt: updatedAppointment.createdAt,
                updatedAt: updatedAppointment.updatedAt
            };
        }
        catch (error) {
            console.error('Erro ao atualizar agendamento:', error);
            if (error?.code === 'P2025') {
                return null;
            }
            throw error;
        }
    }
    static async deleteAppointment(id) {
        try {
            console.log(`Deletando agendamento ${id}`);
            await prisma.service.deleteMany({
                where: { appointmentId: id }
            });
            await prisma.appointment.delete({
                where: { id }
            });
            return true;
        }
        catch (error) {
            console.error('Erro ao deletar agendamento:', error);
            if (error?.code === 'P2025') {
                return false;
            }
            throw error;
        }
    }
    static async updateAppointmentStatus(id, status) {
        try {
            console.log(`Atualizando status do agendamento ${id} para:`, status);
            const statusMap = {
                'Agendado': 'SCHEDULED',
                'Confirmado': 'CONFIRMED',
                'Concluído': 'COMPLETED',
                'Cancelado': 'CANCELLED'
            };
            const prismaStatus = statusMap[status] || 'SCHEDULED';
            const updatedAppointment = await prisma.appointment.update({
                where: { id },
                data: { status: prismaStatus },
                include: {
                    pet: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    tutor: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    services: {
                        select: {
                            name: true,
                            price: true
                        }
                    }
                }
            });
            return {
                id: updatedAppointment.id,
                petId: updatedAppointment.petId,
                tutorId: updatedAppointment.tutorId,
                appointmentDate: updatedAppointment.appointmentDate,
                date: updatedAppointment.appointmentDate,
                time: updatedAppointment.appointmentDate.toTimeString().slice(0, 5),
                status: this.mapStatusToLegacy(updatedAppointment.status),
                createdAt: updatedAppointment.createdAt,
                updatedAt: updatedAppointment.updatedAt
            };
        }
        catch (error) {
            console.error('Erro ao atualizar status do agendamento:', error);
            if (error?.code === 'P2025') {
                return null;
            }
            throw error;
        }
    }
}
exports.AppointmentService = AppointmentService;
//# sourceMappingURL=appointment.service.js.map