import { prisma } from '../lib/prisma';
import { CommunicationService } from './communication.service';

export class VaccinationService {
  static async listByPet(petId: number) {
    return prisma.vaccinationRecord.findMany({ where: { petId }, orderBy: { administeredAt: 'desc' }, include: { responsibleUser: true, medicalRecord: true } });
  }

  static async create(input: { petId: number; medicalRecordId?: number; responsibleUserId: number; vaccineName: string; manufacturer?: string; lotCode?: string; administeredAt?: string; nextDueAt?: string; notes?: string }) {
    if (!input.vaccineName?.trim() || !Number.isInteger(input.responsibleUserId)) throw new Error('Vacina e veterinária responsável são obrigatórias');
    return prisma.$transaction(async (tx: any) => {
      const pet = await tx.pet.findFirst({ where: { id: input.petId, deletedAt: null }, include: { tutor: true } });
      if (!pet) throw new Error('Pet não pertence à clínica autenticada');
      // O proxy de tenant não confere FKs escalares: o prontuário precisa ser desta clínica e deste pet.
      if (input.medicalRecordId !== undefined) {
        if (!Number.isInteger(input.medicalRecordId)) throw new Error('Prontuário inválido');
        const medicalRecord = await tx.medicalRecord.findFirst({ where: { id: input.medicalRecordId, appointment: { petId: input.petId } }, select: { id: true } });
        if (!medicalRecord) throw new Error('Prontuário não pertence a este pet na clínica autenticada');
      }
      const record = await tx.vaccinationRecord.create({ data: { petId: input.petId, medicalRecordId: input.medicalRecordId, responsibleUserId: input.responsibleUserId, vaccineName: input.vaccineName.trim(), manufacturer: input.manufacturer?.trim() || null, lotCode: input.lotCode?.trim() || null, administeredAt: input.administeredAt ? new Date(input.administeredAt) : new Date(), nextDueAt: input.nextDueAt ? new Date(input.nextDueAt) : null, notes: input.notes?.trim() || null } });
      if (record.nextDueAt) await CommunicationService.enqueue(tx, { tutorId: pet.tutorId, eventType: 'VACCINATION_DUE', category: 'HEALTH', payload: { petId: pet.id, vaccineName: record.vaccineName, nextDueAt: record.nextDueAt.toISOString() }, dedupeKey: `vaccination:${record.id}:due` });
      return record;
    });
  }
}
