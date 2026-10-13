import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';
import { runWithClinic } from '../../tenantContext';
import { WhatsAppWebhookStore } from '../../controllers/whatsappWebhook.controller';

const normalizePhone = (value: string): string => value.replace(/\D/g, '');

export const whatsappPrismaStore: WhatsAppWebhookStore = {
  async findTutorByPhone(clinicId, phone) {
    return runWithClinic(clinicId, async () => {
      const tutors = await prisma.tutor.findMany({ select: { id: true, phone: true } });
      const normalized = normalizePhone(phone);
      return tutors.find((tutor) => normalizePhone(tutor.phone) === normalized) || null;
    });
  },

  async findExistingEvent(clinicId, dedupeKey) {
    return runWithClinic(clinicId, () => prisma.whatsAppInboundEvent.findFirst({ where: { correlationKey: dedupeKey }, select: { id: true } }));
  },

  async persistInboundEvent(input) {
    const payload = input.payload as Prisma.InputJsonObject;
    const source = payload.source && typeof payload.source === 'object' && !Array.isArray(payload.source)
      ? payload.source as Record<string, unknown> : {};
    return runWithClinic(input.clinicId, () => prisma.whatsAppInboundEvent.create({
      data: {
        clinicId: input.clinicId,
        tutorId: input.tutorId,
        provider: 'WHATSAPP',
        channelId: String(payload.channelId || 'unknown'),
        externalEventId: String(payload.eventId || input.dedupeKey),
        eventType: input.eventType,
        contactPhone: typeof source.from === 'string' ? source.from : null,
        payload,
        correlationKey: input.dedupeKey,
        correlationId: typeof payload.correlationId === 'string' ? payload.correlationId : null,
        aggregateKey: typeof payload.aggregateKey === 'string' ? payload.aggregateKey : `tutor:${input.tutorId}`,
        sequence: typeof payload.sequence === 'number' ? payload.sequence : null,
        occurredAt: typeof payload.occurredAt === 'string' ? new Date(payload.occurredAt) : null,
        status: 'RECEIVED',
      },
      select: { id: true },
    }));
  },
};
