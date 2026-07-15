import { Appointment } from '../models/appointment.model';
import { prisma } from '../lib/prisma';
import {
  InvalidAppointmentStatusError,
  normalizeAppointmentStatus,
  requireAppointmentStatus,
} from '../utils/appointmentStatus';

export class AppointmentService {
  static async getAllAppointments(): Promise<Appointment[]> {
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

      // Converter para o formato esperado pelo frontend
      return appointments.map(appointment => ({
        id: appointment.id,
        petId: appointment.petId,
        tutorId: appointment.tutorId,
        appointmentDate: appointment.appointmentDate,
        date: appointment.appointmentDate,
        time: appointment.appointmentDate.toTimeString().slice(0, 5),
        status: this.mapStatusForResponse(appointment.status),
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt
      }));
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      throw error;
    }
  }

  static async createAppointment(newAppointmentData: any): Promise<Appointment> {
    try {
      console.log('Recebido para criação de agendamento:', newAppointmentData);
      
      // Converter data e hora para DateTime
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

      // Se há serviceType, criar o serviço associado
      if (newAppointmentData.serviceType) {
        await prisma.service.create({
          data: {
            name: newAppointmentData.serviceType,
            price: 50.0, // Preço padrão, pode ser ajustado
            appointmentId: createdAppointment.id
          }
        });
      }
      
      console.log('Agendamento criado no banco:', createdAppointment);
      
      // Retornar no formato esperado
      return {
        id: createdAppointment.id,
        petId: createdAppointment.petId,
        tutorId: createdAppointment.tutorId,
        appointmentDate: createdAppointment.appointmentDate,
        date: createdAppointment.appointmentDate,
        time: createdAppointment.appointmentDate.toTimeString().slice(0, 5),
        status: this.mapStatusForResponse(createdAppointment.status),
        createdAt: createdAppointment.createdAt,
        updatedAt: createdAppointment.updatedAt
      };
    } catch (error) {
      console.error('Erro ao criar agendamento:', error);
      throw error;
    }
  }

  private static mapStatusForResponse(status: string): string {
    return normalizeAppointmentStatus(status) ?? status;
  }

  static async getAppointmentById(id: number): Promise<Appointment | null> {
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

      if (!appointment) return null;

      return {
        id: appointment.id,
        petId: appointment.petId,
        tutorId: appointment.tutorId,
        appointmentDate: appointment.appointmentDate,
        date: appointment.appointmentDate,
        time: appointment.appointmentDate.toTimeString().slice(0, 5),
        status: this.mapStatusForResponse(appointment.status),
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt
      };
    } catch (error) {
      console.error('Erro ao buscar agendamento por ID:', error);
      throw error;
    }
  }

  static async updateAppointment(id: number, updateData: Partial<Omit<Appointment, 'id'>>): Promise<Appointment | null> {
    try {
      const updatePayload: any = {};
      
      if (updateData.date && updateData.time) {
        updatePayload.appointmentDate = new Date(`${updateData.date}T${updateData.time}:00`);
      }
      
      if (updateData.status) {
        updatePayload.status = requireAppointmentStatus(updateData.status);
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
        status: this.mapStatusForResponse(updatedAppointment.status),
        createdAt: updatedAppointment.createdAt,
        updatedAt: updatedAppointment.updatedAt
      };
    } catch (error: any) {
      if (!(error instanceof InvalidAppointmentStatusError)) {
        console.error('Erro ao atualizar agendamento:', error);
      }
      if (error?.code === 'P2025') {
        return null; // Registro não encontrado
      }
      throw error;
    }
  }

  static async deleteAppointment(id: number): Promise<boolean> {
    try {
      console.log(`Deletando agendamento ${id}`);
      
      // Primeiro deletar os serviços associados
      await prisma.service.deleteMany({
        where: { appointmentId: id }
      });
      
      // Depois deletar o agendamento
      await prisma.appointment.delete({
        where: { id }
      });
      
      return true;
    } catch (error: any) {
      console.error('Erro ao deletar agendamento:', error);
      if (error?.code === 'P2025') {
        return false; // Registro não encontrado
      }
      throw error;
    }
  }

  static async updateAppointmentStatus(id: number, status: string): Promise<Appointment | null> {
    try {
      const prismaStatus = requireAppointmentStatus(status);
      
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
        status: this.mapStatusForResponse(updatedAppointment.status),
        createdAt: updatedAppointment.createdAt,
        updatedAt: updatedAppointment.updatedAt
      };
    } catch (error: any) {
      if (!(error instanceof InvalidAppointmentStatusError)) {
        console.error('Erro ao atualizar status do agendamento:', error);
      }
      if (error?.code === 'P2025') {
        return null; // Registro não encontrado
      }
      throw error;
    }
  }
}
