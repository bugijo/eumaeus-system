import { prisma } from '../../lib/prisma';
import { getCurrentClinicId } from '../../tenantContext';
import { InboundEvent, InboundRepository, WhatsAppInboundProcessor } from '../../services/whatsappInboundProcessor';

const repository: InboundRepository = {
  async claimReady({ limit, now, workerId, leaseUntil }) {
    const rows = await prisma.whatsAppInboundEvent.findMany({
      where: { OR: [
        { status: { in: ['RECEIVED', 'RETRY', 'QUEUED'] }, availableAt: { lte: now } },
        { status: 'PROCESSING', leaseUntil: { lt: now } },
      ] }, orderBy: { createdAt: 'asc' }, take: limit,
    });
    const claimed: InboundEvent[] = [];
    for (const row of rows) {
      const result = await prisma.whatsAppInboundEvent.updateMany({
        where: { id: row.id, OR: [
          { status: { in: ['RECEIVED', 'RETRY', 'QUEUED'] }, availableAt: { lte: now } },
          { status: 'PROCESSING', leaseUntil: { lt: now } },
        ] },
        data: { status: 'PROCESSING', claimedAt: now, leaseUntil, workerId, attempts: row.attempts + 1 },
      });
      if (result.count !== 1) continue;
      claimed.push({
        id: row.id, clinicId: row.clinicId, eventId: row.externalEventId,
        dedupeKey: row.correlationKey || `${row.channelId}:${row.externalEventId}`,
        eventType: row.eventType, aggregateKey: row.aggregateKey, sequence: row.sequence,
        occurredAt: row.occurredAt, correlationId: row.correlationId,
        payload: row.payload as Record<string, unknown>, status: 'PROCESSING',
        attempts: row.attempts + 1, maxAttempts: row.maxAttempts, availableAt: row.availableAt,
        leaseUntil, workerId,
      } as any);
    }
    return claimed as any;
  },
  async applyEvent({ event, workerId }) {
    return prisma.$transaction(async (tx: any) => {
      const current = await tx.whatsAppInboundEvent.findFirst({ where: { id: event.id, workerId, status: 'PROCESSING' } });
      if (!current) throw new Error('claim inbound perdido');
      const previous = event.aggregateKey && event.sequence !== null && event.sequence !== undefined
        ? await tx.whatsAppInboundEvent.findFirst({ where: { clinicId: event.clinicId, aggregateKey: event.aggregateKey, status: 'PROCESSED', id: { not: event.id }, sequence: { not: null } }, orderBy: { sequence: 'desc' }, select: { sequence: true } })
        : null;
      const stale = previous?.sequence !== null && previous?.sequence !== undefined && event.sequence !== null && event.sequence !== undefined && event.sequence <= previous.sequence;
      await tx.whatsAppInboundEvent.update({ where: { id: event.id }, data: { status: 'PROCESSED', processedAt: new Date(), leaseUntil: null, workerId: null, lastError: null } });
      return { applied: !stale, stale };
    });
  },
  async markRetry({ id, workerId, availableAt, error }) {
    await prisma.whatsAppInboundEvent.updateMany({ where: { id, workerId, status: 'PROCESSING' }, data: { status: 'RETRY', availableAt, leaseUntil: null, workerId: null, lastError: error } });
  },
  async markFailed({ id, workerId, error }) {
    await prisma.whatsAppInboundEvent.updateMany({ where: { id, workerId, status: 'PROCESSING' }, data: { status: 'FAILED', leaseUntil: null, workerId: null, lastError: error } });
  },
};

export async function processWhatsAppInbound(limit = 50) {
  if (!getCurrentClinicId()) throw new Error('Contexto da clínica ausente');
  return new WhatsAppInboundProcessor(repository).processBatch({ workerId: `communication-${process.pid}`, limit });
}
