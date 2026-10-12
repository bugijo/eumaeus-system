import { prisma } from '../lib/prisma';
import { getCurrentClinicId } from '../tenantContext';

export type CommunicationPreferenceInput = {
  sender: string;
  category: string;
  enabled?: boolean;
  pausedUntil?: Date | null;
  stopAll?: boolean;
};

const preferenceAllows = (preference: any, now = new Date()) => (
  preference !== null &&
  preference.enabled !== false &&
  preference.stopAll !== true &&
  (!preference.pausedUntil || preference.pausedUntil <= now)
);

export class CommunicationService {
  static async upsertPreference(tutorId: number, input: CommunicationPreferenceInput) {
    const current = await prisma.tutorCommunicationPreference.findFirst({ where: { tutorId, sender: input.sender, category: input.category } });
    if (current) {
      return prisma.tutorCommunicationPreference.update({ where: { id: current.id }, data: {
        enabled: input.enabled ?? current.enabled,
        pausedUntil: input.pausedUntil !== undefined ? input.pausedUntil : current.pausedUntil,
        stopAll: input.stopAll ?? current.stopAll,
      } });
    }
    if (!getCurrentClinicId()) throw new Error('Contexto da clínica ausente');
    return prisma.tutorCommunicationPreference.create({ data: { clinicId: getCurrentClinicId() as number, tutorId, sender: input.sender, category: input.category, enabled: input.enabled ?? true, pausedUntil: input.pausedUntil ?? null, stopAll: input.stopAll ?? false } });
  }

  static async enqueue(tx: any, data: { tutorId: number; appointmentId?: number; eventType: string; category: string; payload: Record<string, unknown>; dedupeKey: string }) {
    const existing = await tx.communicationOutbox.findFirst({ where: { dedupeKey: data.dedupeKey } });
    if (existing) return existing;
    return tx.communicationOutbox.create({
      data: { tutorId: data.tutorId, appointmentId: data.appointmentId ?? null, eventType: data.eventType, category: data.category, payload: data.payload, dedupeKey: data.dedupeKey },
    });
  }

  static async cancelForAppointment(appointmentId: number) {
    return prisma.communicationOutbox.updateMany({ where: { appointmentId, status: 'QUEUED' }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
  }

  static async cancelForAppointmentTx(tx: any, appointmentId: number) {
    if (!tx.communicationOutbox) return { count: 0 };
    return tx.communicationOutbox.updateMany({ where: { appointmentId, status: { in: ['QUEUED', 'PROCESSING'] } }, data: { status: 'CANCELLED', cancelledAt: new Date() } });
  }

  static async listPreferences(tutorId: number) {
    return prisma.tutorCommunicationPreference.findMany({ where: { tutorId }, orderBy: [{ sender: 'asc' }, { category: 'asc' }] });
  }

  static async listHistory(tutorId: number) {
    return prisma.communicationOutbox.findMany({ where: { tutorId }, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  static async dispatchPending(limit = 50, adapter: () => Promise<void> = async () => undefined) {
    const pending = await prisma.communicationOutbox.findMany({ where: { status: 'QUEUED', availableAt: { lte: new Date() } }, orderBy: { createdAt: 'asc' }, take: limit });
    const results = { simulated: 0, cancelled: 0, failed: 0 };
    for (const message of pending) {
      const claimed = await prisma.communicationOutbox.updateMany({ where: { id: message.id, status: 'QUEUED', attempts: { lt: message.maxAttempts } }, data: { status: 'PROCESSING' } });
      if (claimed.count !== 1) continue;
      const attemptNo = message.attempts + 1;
      try {
        const preference = await prisma.tutorCommunicationPreference.findFirst({ where: { tutorId: message.tutorId, category: message.category, sender: 'SYSTEM' } });
        if (!preferenceAllows(preference)) {
          await prisma.communicationAttempt.create({ data: { outboxId: message.id, attemptNo, status: 'CANCELLED' } });
          await prisma.communicationOutbox.update({ where: { id: message.id }, data: { status: 'CANCELLED', attempts: attemptNo, cancelledAt: new Date() } });
          results.cancelled += 1;
          continue;
        }
        await adapter();
        await prisma.communicationAttempt.create({ data: { outboxId: message.id, attemptNo, status: 'SIMULATED' } });
        await prisma.communicationOutbox.update({ where: { id: message.id }, data: { status: 'SIMULATED', attempts: attemptNo, sentAt: new Date() } });
        results.simulated += 1;
      } catch (error) {
        const exhausted = attemptNo >= message.maxAttempts;
        await prisma.communicationAttempt.create({ data: { outboxId: message.id, attemptNo, status: 'FAILED', error: error instanceof Error ? error.message : 'Falha simulada' } });
        const backoffMs = Math.min(60_000, 1_000 * (2 ** Math.max(0, attemptNo - 1)));
        await prisma.communicationOutbox.update({ where: { id: message.id }, data: {
          status: exhausted ? 'FAILED' : 'QUEUED',
          attempts: attemptNo,
          lastError: error instanceof Error ? error.message : 'Falha simulada',
          ...(exhausted ? {} : { availableAt: new Date(Date.now() + backoffMs) }),
        } });
        results.failed += 1;
      }
    }
    return results;
  }
}
