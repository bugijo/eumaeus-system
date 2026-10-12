import { prisma } from '../lib/prisma';
import { getCurrentClinicId } from '../tenantContext';

const clinic = () => getCurrentClinicId() ?? (() => { throw new Error('Contexto da clínica ausente'); })();

export class CareService {
  static listAdmissions() { return prisma.hospitalizationAdmission.findMany({ include: { pet: true, tasks: true, prescriptions: true, handoffs: true }, orderBy: { admittedAt: 'desc' } }); }
  static async admit(input: { petId: number; responsibleUserId: number; appointmentId?: number; observations?: string }) {
    if (!Number.isInteger(input.petId) || !Number.isInteger(input.responsibleUserId)) throw new Error('Pet e responsável são obrigatórios');
    const pet = await prisma.pet.findFirst({ where: { id: input.petId } });
    const user = await prisma.user.findFirst({ where: { id: input.responsibleUserId, active: true } });
    if (!pet || !user) throw new Error('Pet ou responsável não pertence à clínica');
    return prisma.hospitalizationAdmission.create({ data: { clinicId: clinic(), petId: input.petId, appointmentId: input.appointmentId, responsibleUserId: input.responsibleUserId, observations: input.observations?.trim() || null } });
  }
  static addTask(admissionId: number, input: { title: string; scheduledAt?: string; notes?: string }) {
    if (!input.title?.trim()) throw new Error('Tarefa obrigatória');
    return prisma.hospitalizationTask.create({ data: { clinicId: clinic(), admissionId, title: input.title.trim(), scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null, notes: input.notes?.trim() || null } });
  }
  static recordTask(id: number, input: { notes?: string; executedById: number }) { return prisma.hospitalizationTask.update({ where: { id }, data: { status: 'EXECUTED', executedAt: new Date(), executedById: input.executedById, notes: input.notes?.trim() || undefined } }); }
  static addPrescription(admissionId: number, input: { medication: string; instructions: string; createdById: number }) {
    if (!input.medication?.trim() || !input.instructions?.trim()) throw new Error('Medicamento e instruções são obrigatórios');
    return prisma.hospitalizationPrescription.create({ data: { clinicId: clinic(), admissionId, medication: input.medication.trim(), instructions: input.instructions.trim(), createdById: input.createdById } });
  }
  static discharge(id: number, input: { notes: string; reviewerId: number }) {
    if (!input.notes?.trim()) throw new Error('Justificativa de alta obrigatória');
    return prisma.hospitalizationAdmission.update({ where: { id }, data: { status: 'DISCHARGED', dischargedAt: new Date(), dischargeReviewedById: input.reviewerId, dischargeNotes: input.notes.trim() } });
  }
  static handoff(admissionId: number, input: { fromUserId: number; toUserId: number; notes: string }) {
    if (!Number.isInteger(input.fromUserId) || !Number.isInteger(input.toUserId) || !input.notes?.trim()) throw new Error('Responsáveis e observação da passagem são obrigatórios');
    return prisma.hospitalizationHandoff.create({ data: { clinicId: clinic(), admissionId, fromUserId: input.fromUserId, toUserId: input.toUserId, notes: input.notes.trim() } });
  }
  static listSurgeries() { return prisma.surgeryCase.findMany({ include: { pet: true, budgets: true, consents: true, checklist: true, instructions: true }, orderBy: { scheduledAt: 'asc' } }); }
  static createSurgery(input: { petId: number; veterinarianId: number; appointmentId?: number; scheduledAt?: string; notes?: string }) {
    return prisma.surgeryCase.create({ data: { clinicId: clinic(), petId: input.petId, veterinarianId: input.veterinarianId, appointmentId: input.appointmentId, scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null, notes: input.notes?.trim() || null } });
  }
  static addBudget(surgeryId: number, input: { description: string; amount: string; createdById: number }) {
    if (!input.description?.trim() || !input.amount || Number(input.amount) < 0) throw new Error('Orçamento inválido');
    return prisma.$transaction(async tx => { const last = await tx.surgeryBudgetVersion.findFirst({ where: { surgeryId }, orderBy: { version: 'desc' } }); return tx.surgeryBudgetVersion.create({ data: { clinicId: clinic(), surgeryId, version: (last?.version ?? 0) + 1, description: input.description.trim(), amount: input.amount, createdById: input.createdById } }); });
  }
  static addConsent(surgeryId: number, input: { budgetVersionId: number; recordedById: number; notes?: string }) { return prisma.surgeryConsent.create({ data: { clinicId: clinic(), surgeryId, budgetVersionId: input.budgetVersionId, recordedById: input.recordedById, notes: input.notes?.trim() || null } }); }
  static addChecklist(surgeryId: number, input: { label: string; notes?: string }) { if (!input.label?.trim()) throw new Error('Item obrigatório'); return prisma.surgeryChecklistItem.create({ data: { clinicId: clinic(), surgeryId, label: input.label.trim(), notes: input.notes?.trim() || null } }); }
  static completeChecklist(id: number, input: { userId: number; notes?: string }) { return prisma.surgeryChecklistItem.update({ where: { id }, data: { completedAt: new Date(), completedById: input.userId, notes: input.notes?.trim() || undefined } }); }
  static addInstruction(surgeryId: number, input: { instruction: string }) { if (!input.instruction?.trim()) throw new Error('Orientação obrigatória'); return prisma.surgeryInstruction.create({ data: { clinicId: clinic(), surgeryId, instruction: input.instruction.trim() } }); }
  static approveInstruction(id: number, userId: number) { return prisma.surgeryInstruction.update({ where: { id }, data: { approvedAt: new Date(), approvedById: userId } }); }
}
