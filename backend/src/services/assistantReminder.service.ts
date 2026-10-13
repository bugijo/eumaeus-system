import { prisma } from '../lib/prisma';
import { getCurrentClinicId, getCurrentUserId } from '../tenantContext';

type ReminderInput = {
  reminderKey: string;
  kind: string;
  sourceType: string;
  sourceId: number;
  title: string;
  reason: string;
  dueAt?: Date;
};

const context = (requireUser = true) => {
  const clinicId = getCurrentClinicId();
  const userId = getCurrentUserId();
  if (!clinicId) throw new Error('Contexto da clínica obrigatório');
  if (requireUser && !userId) throw new Error('Autoria autenticada obrigatória');
  return { clinicId, userId };
};

export class AssistantReminderService {
  static async upsertOccurrence(input: ReminderInput) {
    const { clinicId, userId } = context(false);
    const existing = await (prisma as any).assistantReminder.findUnique({
      where: { clinicId_reminderKey: { clinicId, reminderKey: input.reminderKey } },
    });
    if (existing) return existing;
    return (prisma as any).assistantReminder.create({ data: { ...input, clinicId, createdByUserId: userId } });
  }

  static async list(now = new Date()) {
    const { clinicId, userId } = context();
    const expired = await (prisma as any).assistantReminder.findMany({ where: { clinicId, status: 'SNOOZED', snoozedUntil: { lte: now } }, select: { id: true, status: true } });
    if (expired.length) await (prisma as any).$transaction(async (tx: any) => {
      for (const reminder of expired) {
        await tx.assistantReminder.update({ where: { id: reminder.id }, data: { status: 'ACTIVE', snoozedUntil: null, snoozedReason: null } });
        await tx.assistantReminderAction.create({ data: { clinicId, reminderId: reminder.id, actorUserId: userId, action: 'REACTIVATED', fromStatus: reminder.status, toStatus: 'ACTIVE', reason: 'Prazo de adiamento expirado' } });
      }
    });
    return (prisma as any).assistantReminder.findMany({
      where: { clinicId, status: { in: ['ACTIVE', 'SNOOZED', 'DISMISSED', 'RESOLVED'] } },
      orderBy: { updatedAt: 'desc' },
      include: { actions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
  }

  private static async transition(id: number, action: string, toStatus: string, reason: string, snoozedUntil?: Date) {
    const { clinicId, userId } = context();
    if (!reason.trim()) throw new Error('Justificativa obrigatória');
    return (prisma as any).$transaction(async (tx: any) => {
      const current = await tx.assistantReminder.findUnique({ where: { id }, include: { actions: true } });
      if (!current) throw new Error('Lembrete não encontrado no contexto da clínica');
      const updated = await tx.assistantReminder.update({
        where: { id },
        data: {
          status: toStatus,
          snoozedUntil: toStatus === 'SNOOZED' ? snoozedUntil : null,
          snoozedReason: toStatus === 'SNOOZED' ? reason : null,
          dismissedReason: toStatus === 'DISMISSED' ? reason : null,
          resolvedByUserId: toStatus === 'RESOLVED' ? userId : undefined,
          resolvedAt: toStatus === 'RESOLVED' ? new Date() : undefined,
        },
      });
      await tx.assistantReminderAction.create({
        data: { clinicId, reminderId: id, actorUserId: userId, action, fromStatus: current.status, toStatus, reason, snoozedUntil },
      });
      return updated;
    });
  }

  static snooze(id: number, until: Date, reason: string) {
    if (!(until instanceof Date) || Number.isNaN(until.getTime()) || until <= new Date()) throw new Error('Prazo de adiamento inválido');
    return this.transition(id, 'SNOOZED', 'SNOOZED', reason, until);
  }

  static dismiss(id: number, reason: string) { return this.transition(id, 'DISMISSED', 'DISMISSED', reason); }
  static resolve(id: number, reason: string) { return this.transition(id, 'RESOLVED', 'RESOLVED', reason); }
}
