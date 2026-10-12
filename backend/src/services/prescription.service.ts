import { CreatePrescriptionRequest, UpdatePrescriptionRequest, PrescriptionResponse } from '../models/prescription.model';
import { prisma } from '../lib/prisma';

const includeCurrent = (version: number) => ({
  items: { where: { version } },
  medicalRecord: { include: { appointment: { include: { pet: { include: { tutor: true } } } } } },
});

export class PrescriptionService {
  static async createPrescription(data: CreatePrescriptionRequest, veterinarianUserId: number): Promise<PrescriptionResponse> {
    if (!data.items.length) throw new Error('Itens da receita são obrigatórios');
    return prisma.$transaction(async (tx: any) => {
      const record = await tx.medicalRecord.findFirst({ where: { id: data.medicalRecordId }, include: { appointment: { include: { pet: { include: { tutor: true } } } } } });
      if (!record) throw new Error('Prontuário médico não encontrado');
      const veterinarian = await tx.user.findFirst({ where: { id: veterinarianUserId }, include: { role: true } });
      if (!veterinarian || veterinarian.roleName !== 'VETERINARIO') throw new Error('Apenas usuário veterinário pode criar receita');
      const settings = await tx.clinicSettings.findFirst({});
      const prescription = await tx.prescription.create({ data: { medicalRecordId: data.medicalRecordId, veterinarianUserId, clinicNameSnapshot: settings?.clinicName || 'Clínica não informada', veterinarianNameSnapshot: veterinarian.name, tutorNameSnapshot: record.appointment.pet.tutor.name, petNameSnapshot: record.appointment.pet.name, status: 'PENDING_REVIEW', signatureMode: 'VISUAL_ONLY' } });
      await tx.prescriptionItem.createMany({ data: data.items.map(item => ({ prescriptionId: prescription.id, version: 1, medication: item.medication.trim(), dosage: item.dosage.trim(), frequency: item.frequency.trim(), duration: item.duration.trim(), instructions: item.instructions?.trim() || null })) });
      return tx.prescription.findFirst({ where: { id: prescription.id }, include: includeCurrent(1) });
    }) as Promise<PrescriptionResponse>;
  }

  static async getPrescriptionById(id: number): Promise<PrescriptionResponse | null> { const found: any = await prisma.prescription.findFirst({ where: { id } }); return found ? prisma.prescription.findFirst({ where: { id }, include: includeCurrent(found.currentVersion) }) : null; }
  static async getPrescriptionByMedicalRecordId(medicalRecordId: number): Promise<PrescriptionResponse | null> { const found: any = await prisma.prescription.findFirst({ where: { medicalRecordId }, orderBy: { createdAt: 'desc' } }); return found ? prisma.prescription.findFirst({ where: { id: found.id }, include: includeCurrent(found.currentVersion) }) : null; }

  static async updatePrescription(id: number, data: UpdatePrescriptionRequest): Promise<PrescriptionResponse | null> {
    return prisma.$transaction(async (tx: any) => {
      const current = await tx.prescription.findFirst({ where: { id } });
      if (!current) return null;
      if (current.status === 'APPROVED') throw new Error('Receita aprovada é imutável; crie uma nova versão');
      const version = current.currentVersion + 1;
      await tx.prescription.update({ where: { id }, data: { currentVersion: version, status: 'PENDING_REVIEW', reviewedAt: null, reviewedByUserId: null } });
      await tx.prescriptionItem.createMany({ data: data.items.map(item => ({ prescriptionId: id, version, medication: item.medication.trim(), dosage: item.dosage.trim(), frequency: item.frequency.trim(), duration: item.duration.trim(), instructions: item.instructions?.trim() || null })) });
      return tx.prescription.findFirst({ where: { id }, include: includeCurrent(version) });
    });
  }

  static async review(id: number, reviewerUserId: number, status: 'APPROVED' | 'REJECTED', reviewNotes?: string) {
    if (!['APPROVED', 'REJECTED'].includes(status)) throw new Error('Revisão inválida');
    const reviewer: any = await prisma.user.findFirst({ where: { id: reviewerUserId }, include: { role: true } });
    if (!reviewer || reviewer.roleName !== 'VETERINARIO') throw new Error('Apenas usuário veterinário pode revisar receita');
    const current = await prisma.prescription.findFirst({ where: { id } });
    if (!current) throw new Error('Receita não encontrada');
    if (current.status === 'CANCELLED') throw new Error('Receita cancelada não pode ser revisada');
    return prisma.prescription.update({ where: { id }, data: { status, reviewedByUserId: reviewerUserId, reviewedAt: new Date(), reviewNotes: reviewNotes?.trim() || null }, include: includeCurrent(current.currentVersion) });
  }

  static async cancel(id: number, cancelledByUserId: number, reason: string): Promise<boolean> {
    if (!reason?.trim()) throw new Error('Justificativa do cancelamento é obrigatória');
    const current: any = await prisma.prescription.findFirst({ where: { id } });
    if (!current) return false;
    if (current.status === 'CANCELLED') return true;
    await prisma.prescription.update({ where: { id }, data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledByUserId, cancelReason: reason.trim() } });
    return true;
  }

  static async getVersions(id: number) {
    const current: any = await prisma.prescription.findFirst({ where: { id } });
    if (!current) return null;
    return prisma.prescriptionItem.findMany({ where: { prescriptionId: id }, orderBy: [{ version: 'desc' }, { id: 'asc' }] });
  }
  static async getAllPrescriptions(): Promise<PrescriptionResponse[]> { return prisma.prescription.findMany({ orderBy: { createdAt: 'desc' }, include: { items: true, medicalRecord: { include: { appointment: { include: { pet: { include: { tutor: true } } } } } } } }) as Promise<PrescriptionResponse[]>; }
}
