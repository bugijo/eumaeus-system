import { prisma } from '../lib/prisma';

export class SpecialistService {
  static list() { return prisma.specialistProfile.findMany({ include: { availabilities: true, user: true }, orderBy: { createdAt: 'desc' } }); }
  static async create(input: { userId: number; specialty: string; registration?: string; repasseRate?: number }) {
    if (!Number.isInteger(input.userId) || !input.specialty?.trim()) throw new Error('Usuário e especialidade informada são obrigatórios');
    const user = await prisma.user.findFirst({ where: { id: input.userId, active: true } });
    if (!user) throw new Error('Usuário não pertence à clínica');
    return (prisma.specialistProfile as any).create({ data: { userId: input.userId, specialty: input.specialty.trim(), registration: input.registration?.trim() || null, repasseRate: input.repasseRate } });
  }
  static async addAvailability(id: number, input: { weekday: number; startTime: string; endTime: string }) {
    if (!Number.isInteger(input.weekday) || input.weekday < 0 || input.weekday > 6 || !input.startTime || !input.endTime) throw new Error('Disponibilidade inválida');
    const specialist: any = await prisma.specialistProfile.findFirst({ where: { id, active: true } });
    if (!specialist) throw new Error('Especialista não pertence à clínica');
    return (prisma.specialistAvailability as any).create({ data: { specialistId: id, weekday: input.weekday, startTime: input.startTime, endTime: input.endTime } });
  }
  static async assign(input: { appointmentId: number; specialistId: number }) {
    const specialist: any = await prisma.specialistProfile.findFirst({ where: { id: input.specialistId, active: true } });
    const appointment = await prisma.appointment.findFirst({ where: { id: input.appointmentId } });
    if (!specialist || !appointment) throw new Error('Especialista ou agendamento não pertence à clínica');
    const existing = await (prisma.specialistAssignment as any).findFirst({ where: { appointmentId: input.appointmentId, specialistId: input.specialistId } });
    if (existing) throw new Error('Especialista já associado a este agendamento');
    return (prisma.specialistAssignment as any).create({ data: { appointmentId: input.appointmentId, specialistId: input.specialistId, repasseSnapshot: specialist.repasseRate } });
  }
  static async confirm(id: number) {
    const assignment: any = await (prisma.specialistAssignment as any).findFirst({ where: { id } });
    if (!assignment) throw new Error('Associação não pertence à clínica');
    if (assignment.status === 'CONFIRMED') return assignment;
    return prisma.specialistAssignment.update({ where: { id }, data: { status: 'CONFIRMED', confirmedAt: new Date() } });
  }
}
