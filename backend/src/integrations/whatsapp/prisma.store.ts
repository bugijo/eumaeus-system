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
    return runWithClinic(clinicId, () => prisma.communicationOutbox.findFirst({ where: { dedupeKey }, select: { id: true } }));
  },

  async persistInboundEvent(input) {
    return runWithClinic(input.clinicId, () => prisma.communicationOutbox.create({
      data: {
        clinicId: input.clinicId,
        tutorId: input.tutorId,
        eventType: input.eventType,
        category: 'WHATSAPP_INBOUND',
        dedupeKey: input.dedupeKey,
        payload: input.payload as Prisma.InputJsonObject,
        status: 'RECEIVED',
        maxAttempts: 0,
      },
      select: { id: true },
    }));
  },
};
