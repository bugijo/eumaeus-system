import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { AvailabilityService } from '../services/availability.service';
import { ServiceService } from '../services/service.service';

const prisma = new PrismaClient();

export default {
  // GET /api/portal/my-pets/:petId
  async getMyPetById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const tutorId = req.user?.id;
      const { petId } = req.params;

      if (!tutorId || req.user?.type !== 'tutor') {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      if (!petId) {
        return res.status(400).json({
          success: false,
          message: 'ID do pet é obrigatório'
        });
      }

      // Verificar se o pet pertence ao tutor logado
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

      return res.status(200).json({
        success: true,
        data: pet
      });

    } catch (error) {
      console.error('Erro ao buscar pet:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor' 
      });
    }
  },

  // GET /api/portal/my-pets
  async getMyPets(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const tutorId = req.user?.id;

      if (!tutorId || req.user?.type !== 'tutor') {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const pets = await prisma.pet.findMany({
        where: {
          tutorId: tutorId,
          deletedAt: null // Filtrar apenas pets não excluídos
        },
        select: {
          id: true,
          name: true,
          species: true,
          breed: true,
          age: true,
          weight: true,
          color: true,
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
    } catch (error) {
      console.error('Erro ao buscar pets do tutor:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor' 
      });
    }
  },

  // GET /api/portal/my-appointments
  async getMyAppointments(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const tutorId = req.user?.id;

      if (!tutorId || req.user?.type !== 'tutor') {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const appointments = await prisma.appointment.findMany({
        where: {
          pet: {
            tutorId: tutorId,
            deletedAt: null // Filtrar apenas pets não excluídos
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
          dateTime: 'desc'
        },
        take: 10 // Limita aos últimos 10 agendamentos
      });

      // Separar agendamentos futuros e passados
      const now = new Date();
      const upcomingAppointments = appointments.filter(apt => new Date(apt.dateTime) > now);
      const pastAppointments = appointments.filter(apt => new Date(apt.dateTime) <= now);

      return res.status(200).json({
        success: true,
        data: {
          upcoming: upcomingAppointments.slice(0, 5), // Próximos 5
          recent: pastAppointments.slice(0, 5) // Últimos 5
        },
        count: {
          upcoming: upcomingAppointments.length,
          recent: pastAppointments.length,
          total: appointments.length
        }
      });
    } catch (error) {
      console.error('Erro ao buscar agendamentos do tutor:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor' 
      });
    }
  },

  // POST /api/portal/my-appointments
  async createAppointment(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const tutorId = req.user?.id;

      if (!tutorId || req.user?.type !== 'tutor') {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const { petId, serviceId, date, time } = req.body;

      // Validação dos campos obrigatórios
      if (!petId || !serviceId || !date || !time) {
        return res.status(400).json({
          success: false,
          message: 'Campos obrigatórios: petId, serviceId, date, time'
        });
      }

      // Verificar se o pet pertence ao tutor
      const pet = await prisma.pet.findFirst({
        where: {
          id: petId,
          tutorId: tutorId,
          deletedAt: null // Verificar apenas pets não excluídos
        }
      });

      if (!pet) {
        return res.status(404).json({
          success: false,
          message: 'Pet não encontrado ou não pertence ao tutor'
        });
      }

      // Verificar se o serviço existe
      const service = ServiceService.getServiceById(serviceId);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Serviço não encontrado'
        });
      }

      // Verificar se o horário ainda está disponível
      const isAvailable = AvailabilityService.isSlotAvailable(date, time);
      if (!isAvailable) {
        return res.status(409).json({
          success: false,
          message: 'Horário não está mais disponível'
        });
      }

      // Criar o agendamento
      const appointmentDateTime = new Date(`${date}T${time}:00`);
      
      const appointment = await prisma.appointment.create({
        data: {
          petId: petId,
          tutorId: tutorId,
          appointmentDate: appointmentDateTime,
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

      // Criar o registro do serviço associado ao agendamento
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

    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor ao criar agendamento'
      });
    }
  },

  // GET /api/portal/pets/:petId/records
  async getPetMedicalHistory(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const tutorId = req.user?.id;
      const { petId } = req.params;

      if (!tutorId || req.user?.type !== 'tutor') {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      if (!petId) {
        return res.status(400).json({
          success: false,
          message: 'ID do pet é obrigatório'
        });
      }

      // Verificar se o pet pertence ao tutor logado
      const pet = await prisma.pet.findFirst({
        where: {
          id: petId,
          tutorId: tutorId,
          deletedAt: null // Verificar apenas pets não excluídos
        }
      });

      if (!pet) {
        return res.status(404).json({
          success: false,
          message: 'Pet não encontrado ou não pertence ao tutor'
        });
      }

      // Buscar todos os registros médicos do pet
      const medicalRecords = await prisma.medicalRecord.findMany({
        where: {
          appointment: {
            petId: petId
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
              name: true,
              quantity: true,
              unitPrice: true
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

    } catch (error) {
      console.error('Erro ao buscar histórico médico do pet:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor' 
      });
    }
  },

  // PUT /api/portal/my-profile
  async updateMyProfile(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const tutorId = req.user?.id;

      if (!tutorId || req.user?.type !== 'tutor') {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      const { name, email, phone, address } = req.body;

      // Validação dos campos obrigatórios
      if (!name || !email) {
        return res.status(400).json({
          success: false,
          message: 'Nome e email são obrigatórios'
        });
      }

      // Verificar se o tutor existe e não está excluído
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

      // Verificar se o email já está em uso por outro tutor
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

      // Atualizar os dados do tutor
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

    } catch (error) {
      console.error('Erro ao atualizar perfil do tutor:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor' 
      });
    }
  },

  // GET /api/portal/my-profile
  async getMyProfile(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const tutorId = req.user?.id;

      if (!tutorId || req.user?.type !== 'tutor') {
        return res.status(403).json({ message: 'Acesso negado' });
      }

      // Buscar os dados do tutor
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

    } catch (error) {
      console.error('Erro ao buscar perfil do tutor:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Erro interno do servidor' 
      });
    }
  }
};