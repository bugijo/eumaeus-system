"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const availability_service_1 = require("../services/availability.service");
const service_service_1 = require("../services/service.service");
const prisma = new client_1.PrismaClient();
exports.default = {
    async getMyPetById(req, res) {
        try {
            const tutorId = req.user?.id;
            const { petId } = req.params;
            const petIdNum = parseInt(petId);
            if (!tutorId || req.user?.type !== 'tutor') {
                return res.status(403).json({ message: 'Acesso negado' });
            }
            if (!petId || isNaN(petIdNum)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do pet deve ser um número válido'
                });
            }
            const pet = await prisma.pet.findFirst({
                where: {
                    id: petIdNum,
                    tutorId: tutorId,
                    deletedAt: null
                }
            });
            if (!pet) {
                return res.status(404).json({
                    success: false,
                    message: 'Pet não encontrado ou não pertence ao tutor'
                });
            }
            return res.status(200).json({
                success: true,
                data: pet
            });
        }
        catch (error) {
            console.error('Erro ao buscar pet:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    },
    async getMyPets(req, res) {
        try {
            const tutorId = req.user?.id;
            if (!tutorId || req.user?.type !== 'tutor') {
                return res.status(403).json({ message: 'Acesso negado' });
            }
            const pets = await prisma.pet.findMany({
                where: {
                    tutorId: tutorId,
                    deletedAt: null
                },
                select: {
                    id: true,
                    name: true,
                    species: true,
                    breed: true,
                    createdAt: true,
                    updatedAt: true
                },
                orderBy: {
                    name: 'asc'
                }
            });
            return res.status(200).json({
                success: true,
                data: pets,
                count: pets.length
            });
        }
        catch (error) {
            console.error('Erro ao buscar pets do tutor:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    },
    async getMyAppointments(req, res) {
        try {
            const tutorId = req.user?.id;
            if (!tutorId || req.user?.type !== 'tutor') {
                return res.status(403).json({ message: 'Acesso negado' });
            }
            const appointments = await prisma.appointment.findMany({
                where: {
                    pet: {
                        tutorId: tutorId,
                        deletedAt: null
                    }
                },
                include: {
                    pet: {
                        select: {
                            id: true,
                            name: true,
                            species: true
                        }
                    }
                },
                orderBy: {
                    appointmentDate: 'desc'
                },
                take: 10
            });
            const now = new Date();
            const upcomingAppointments = appointments.filter(apt => new Date(apt.appointmentDate) > now);
            const pastAppointments = appointments.filter(apt => new Date(apt.appointmentDate) <= now);
            return res.status(200).json({
                success: true,
                data: {
                    upcoming: upcomingAppointments.slice(0, 5),
                    recent: pastAppointments.slice(0, 5)
                },
                count: {
                    upcoming: upcomingAppointments.length,
                    recent: pastAppointments.length,
                    total: appointments.length
                }
            });
        }
        catch (error) {
            console.error('Erro ao buscar agendamentos do tutor:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    },
    async createAppointment(req, res) {
        try {
            const tutorId = req.user?.id;
            if (!tutorId || req.user?.type !== 'tutor') {
                return res.status(403).json({ message: 'Acesso negado' });
            }
            const { petId, serviceId, date, time } = req.body;
            if (!petId || !serviceId || !date || !time) {
                return res.status(400).json({
                    success: false,
                    message: 'Campos obrigatórios: petId, serviceId, date, time'
                });
            }
            const pet = await prisma.pet.findFirst({
                where: {
                    id: petId,
                    tutorId: tutorId,
                    deletedAt: null
                }
            });
            if (!pet) {
                return res.status(404).json({
                    success: false,
                    message: 'Pet não encontrado ou não pertence ao tutor'
                });
            }
            const service = service_service_1.ServiceService.getServiceById(serviceId);
            if (!service) {
                return res.status(404).json({
                    success: false,
                    message: 'Serviço não encontrado'
                });
            }
            const isAvailable = availability_service_1.AvailabilityService.isSlotAvailable(date, time);
            if (!isAvailable) {
                return res.status(409).json({
                    success: false,
                    message: 'Horário não está mais disponível'
                });
            }
            const appointmentDateTime = new Date(`${date}T${time}:00`);
            const appointment = await prisma.appointment.create({
                data: {
                    petId: petId,
                    tutorId: tutorId,
                    appointmentDate: appointmentDateTime,
                    date: date,
                    time: time,
                    status: 'SCHEDULED',
                    notes: `Agendamento online - ${service.name}`
                },
                include: {
                    pet: {
                        select: {
                            id: true,
                            name: true,
                            species: true
                        }
                    }
                }
            });
            await prisma.service.create({
                data: {
                    name: service.name,
                    price: service.price,
                    appointmentId: appointment.id
                }
            });
            return res.status(201).json({
                success: true,
                data: {
                    ...appointment,
                    service: {
                        id: service.id,
                        name: service.name,
                        price: service.price
                    }
                },
                message: 'Agendamento criado com sucesso'
            });
        }
        catch (error) {
            console.error('Erro ao criar agendamento:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor ao criar agendamento'
            });
        }
    },
    async getPetMedicalHistory(req, res) {
        try {
            const tutorId = req.user?.id;
            const { petId } = req.params;
            const petIdNum = parseInt(petId);
            if (!tutorId || req.user?.type !== 'tutor') {
                return res.status(403).json({ message: 'Acesso negado' });
            }
            if (!petId || isNaN(petIdNum)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID do pet é obrigatório e deve ser um número válido'
                });
            }
            const pet = await prisma.pet.findFirst({
                where: {
                    id: petIdNum,
                    tutorId: tutorId,
                    deletedAt: null
                }
            });
            if (!pet) {
                return res.status(404).json({
                    success: false,
                    message: 'Pet não encontrado ou não pertence ao tutor'
                });
            }
            const medicalRecords = await prisma.medicalRecord.findMany({
                where: {
                    appointment: {
                        petId: petIdNum
                    }
                },
                include: {
                    appointment: {
                        select: {
                            id: true,
                            appointmentDate: true,
                            status: true,
                            notes: true
                        }
                    },
                    products: {
                        select: {
                            id: true,
                            product: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });
            return res.status(200).json({
                success: true,
                data: {
                    pet: {
                        id: pet.id,
                        name: pet.name,
                        species: pet.species,
                        breed: pet.breed
                    },
                    records: medicalRecords
                },
                count: medicalRecords.length
            });
        }
        catch (error) {
            console.error('Erro ao buscar histórico médico do pet:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    },
    async updateMyProfile(req, res) {
        try {
            const tutorId = req.user?.id;
            if (!tutorId || req.user?.type !== 'tutor') {
                return res.status(403).json({ message: 'Acesso negado' });
            }
            const { name, email, phone, address } = req.body;
            if (!name || !email) {
                return res.status(400).json({
                    success: false,
                    message: 'Nome e email são obrigatórios'
                });
            }
            const existingTutor = await prisma.tutor.findFirst({
                where: {
                    id: tutorId,
                    deletedAt: null
                }
            });
            if (!existingTutor) {
                return res.status(404).json({
                    success: false,
                    message: 'Tutor não encontrado'
                });
            }
            if (email !== existingTutor.email) {
                const emailExists = await prisma.tutor.findFirst({
                    where: {
                        email: email,
                        id: { not: tutorId },
                        deletedAt: null
                    }
                });
                if (emailExists) {
                    return res.status(409).json({
                        success: false,
                        message: 'Este email já está em uso por outro tutor'
                    });
                }
            }
            const updatedTutor = await prisma.tutor.update({
                where: { id: tutorId },
                data: {
                    name,
                    email,
                    phone: phone || null,
                    address: address || null
                }
            });
            return res.status(200).json({
                success: true,
                data: updatedTutor,
                message: 'Perfil atualizado com sucesso'
            });
        }
        catch (error) {
            console.error('Erro ao atualizar perfil do tutor:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    },
    async getMyProfile(req, res) {
        try {
            const tutorId = req.user?.id;
            if (!tutorId || req.user?.type !== 'tutor') {
                return res.status(403).json({ message: 'Acesso negado' });
            }
            const tutor = await prisma.tutor.findFirst({
                where: {
                    id: tutorId,
                    deletedAt: null
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    address: true
                }
            });
            if (!tutor) {
                return res.status(404).json({
                    success: false,
                    message: 'Tutor não encontrado'
                });
            }
            return res.status(200).json({
                success: true,
                data: tutor
            });
        }
        catch (error) {
            console.error('Erro ao buscar perfil do tutor:', error);
            return res.status(500).json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
};
//# sourceMappingURL=portal.controller.js.map