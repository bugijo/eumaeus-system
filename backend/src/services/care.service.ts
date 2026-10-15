import { prisma } from '../lib/prisma';
import { getCurrentClinicId, getCurrentUserId } from '../tenantContext';

const clinic = () => getCurrentClinicId() ?? (() => { throw new Error('Contexto da clínica ausente'); })();
const actor = () => getCurrentUserId() ?? (() => { throw new Error('Autoria autenticada obrigatória'); })();

export class CareService {
  private static async requireAdmission(id: number) {
    const admission = await prisma.hospitalizationAdmission.findFirst({ where: { id } });
    if (!admission) throw new Error('Internação não pertence à clínica autenticada');
    return admission;
  }

  private static async requireSurgery(id: number) {
    const surgery = await prisma.surgeryCase.findFirst({ where: { id } });
    if (!surgery) throw new Error('Cirurgia não pertence à clínica autenticada');
    return surgery;
  }

  private static async requireActiveUser(id: number) {
    const user = await prisma.user.findFirst({ where: { id, active: true } });
    if (!user) throw new Error('Usuário não pertence à clínica autenticada');
    return user;
  }

  private static async requireAppointmentForPet(appointmentId: number, petId: number, tutorId?: number) {
    const appointment = await prisma.appointment.findFirst({ where: { id: appointmentId, petId } });
    if (!appointment || (tutorId !== undefined && appointment.tutorId !== tutorId)) {
      throw new Error('Agendamento não pertence ao pet informado');
    }
    return appointment;
  }

  static listAdmissions() { return prisma.hospitalizationAdmission.findMany({ include: { pet: true, tasks: true, prescriptions: true, handoffs: true }, orderBy: { admittedAt: 'desc' } }); }
  static async admit(input: { petId: number; responsibleUserId: number; appointmentId?: number; observations?: string }) {
    if (!Number.isInteger(input.petId) || !Number.isInteger(input.responsibleUserId)) throw new Error('Pet e responsável são obrigatórios');
    const pet = await prisma.pet.findFirst({ where: { id: input.petId } });
    const user = await this.requireActiveUser(input.responsibleUserId);
    if (!pet || !user) throw new Error('Pet ou responsável não pertence à clínica');
    if (input.appointmentId) {
      await this.requireAppointmentForPet(input.appointmentId, input.petId, pet.tutorId);
    }
    return prisma.hospitalizationAdmission.create({ data: { clinicId: clinic(), petId: input.petId, appointmentId: input.appointmentId, responsibleUserId: input.responsibleUserId, observations: input.observations?.trim() || null } });
  }
  static async addTask(admissionId: number, input: { title: string; scheduledAt?: string; notes?: string }) {
    if (!input.title?.trim()) throw new Error('Tarefa obrigatória');
    await this.requireAdmission(admissionId);
    return prisma.hospitalizationTask.create({ data: { clinicId: clinic(), admissionId, title: input.title.trim(), scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null, notes: input.notes?.trim() || null } });
  }
  static async recordTask(id: number, input: { notes?: string; executedById: number }) {
    const task = await prisma.hospitalizationTask.findFirst({ where: { id } });
    if (!task) throw new Error('Tarefa não pertence à clínica autenticada');
    await this.requireAdmission(task.admissionId);
    await this.requireActiveUser(input.executedById);
    return prisma.hospitalizationTask.update({ where: { id }, data: { status: 'EXECUTED', executedAt: new Date(), executedById: input.executedById, notes: input.notes?.trim() || undefined } });
  }
  static async addPrescription(admissionId: number, input: { medication: string; instructions: string }) {
    if (!input.medication?.trim() || !input.instructions?.trim()) throw new Error('Medicamento e instruções são obrigatórios');
    await this.requireAdmission(admissionId);
    return prisma.hospitalizationPrescription.create({ data: { clinicId: clinic(), admissionId, medication: input.medication.trim(), instructions: input.instructions.trim(), createdById: actor() } });
  }
  static async discharge(id: number, input: { notes: string; reviewerId: number }) {
    if (!input.notes?.trim()) throw new Error('Justificativa de alta obrigatória');
    await this.requireAdmission(id);
    await this.requireActiveUser(input.reviewerId);
    return prisma.hospitalizationAdmission.update({ where: { id }, data: { status: 'DISCHARGED', dischargedAt: new Date(), dischargeReviewedById: input.reviewerId, dischargeNotes: input.notes.trim() } });
  }
  static async handoff(admissionId: number, input: { fromUserId: number; toUserId: number; notes: string }) {
    if (!Number.isInteger(input.fromUserId) || !Number.isInteger(input.toUserId) || !input.notes?.trim()) throw new Error('Responsáveis e observação da passagem são obrigatórios');
    await this.requireAdmission(admissionId);
    await this.requireActiveUser(input.fromUserId);
    await this.requireActiveUser(input.toUserId);
    return prisma.hospitalizationHandoff.create({ data: { clinicId: clinic(), admissionId, fromUserId: input.fromUserId, toUserId: input.toUserId, notes: input.notes.trim() } });
  }
  static listSurgeries() { return prisma.surgeryCase.findMany({ include: { pet: true, budgets: true, consents: true, checklist: true, instructions: true }, orderBy: { scheduledAt: 'asc' } }); }
  static async createSurgery(input: { petId: number; veterinarianId: number; appointmentId?: number; scheduledAt?: string; notes?: string }) {
    const pet = await prisma.pet.findFirst({ where: { id: input.petId } });
    if (!pet) throw new Error('Pet não pertence à clínica autenticada');
    await this.requireActiveUser(input.veterinarianId);
    if (input.appointmentId) await this.requireAppointmentForPet(input.appointmentId, input.petId, pet.tutorId);
    return prisma.surgeryCase.create({ data: { clinicId: clinic(), petId: input.petId, veterinarianId: input.veterinarianId, appointmentId: input.appointmentId, scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null, notes: input.notes?.trim() || null } });
  }
  static async addBudget(surgeryId: number, input: { description: string; amount: string }) {
    if (!input.description?.trim() || !input.amount || Number(input.amount) < 0) throw new Error('Orçamento inválido');
    await this.requireSurgery(surgeryId);
    return prisma.$transaction(async tx => { const last = await tx.surgeryBudgetVersion.findFirst({ where: { surgeryId }, orderBy: { version: 'desc' } }); return tx.surgeryBudgetVersion.create({ data: { clinicId: clinic(), surgeryId, version: (last?.version ?? 0) + 1, description: input.description.trim(), amount: input.amount, createdById: actor() } }); });
  }
  static async addConsent(surgeryId: number, input: { budgetVersionId: number; recordedById: number; notes?: string }) {
    await this.requireSurgery(surgeryId);
    const budget = await prisma.surgeryBudgetVersion.findFirst({ where: { id: input.budgetVersionId, surgeryId } });
    if (!budget) throw new Error('Versão de orçamento não pertence à cirurgia autenticada');
    await this.requireActiveUser(input.recordedById);
    return prisma.surgeryConsent.create({ data: { clinicId: clinic(), surgeryId, budgetVersionId: input.budgetVersionId, recordedById: input.recordedById, notes: input.notes?.trim() || null } });
  }
  static async addChecklist(surgeryId: number, input: { label: string; notes?: string }) { if (!input.label?.trim()) throw new Error('Item obrigatório'); await this.requireSurgery(surgeryId); return prisma.surgeryChecklistItem.create({ data: { clinicId: clinic(), surgeryId, label: input.label.trim(), notes: input.notes?.trim() || null } }); }
  static async completeChecklist(id: number, input: { userId: number; notes?: string }) {
    const item = await prisma.surgeryChecklistItem.findFirst({ where: { id } });
    if (!item) throw new Error('Checklist não pertence à clínica autenticada');
    await this.requireSurgery(item.surgeryId);
    await this.requireActiveUser(input.userId);
    return prisma.surgeryChecklistItem.update({ where: { id }, data: { completedAt: new Date(), completedById: input.userId, notes: input.notes?.trim() || undefined } });
  }
  static async addInstruction(surgeryId: number, input: { instruction: string }) { if (!input.instruction?.trim()) throw new Error('Orientação obrigatória'); await this.requireSurgery(surgeryId); return prisma.surgeryInstruction.create({ data: { clinicId: clinic(), surgeryId, instruction: input.instruction.trim() } }); }
  static async approveInstruction(id: number, userId: number) {
    const instruction = await prisma.surgeryInstruction.findFirst({ where: { id } });
    if (!instruction) throw new Error('Orientação não pertence à clínica autenticada');
    await this.requireSurgery(instruction.surgeryId);
    await this.requireActiveUser(userId);
    return prisma.surgeryInstruction.update({ where: { id }, data: { approvedAt: new Date(), approvedById: userId } });
  }
}
