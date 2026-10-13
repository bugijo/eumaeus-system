import { prisma } from '../lib/prisma';
import { getCurrentClinicId, getCurrentUserId } from '../tenantContext';

const context = () => {
  const clinicId = getCurrentClinicId(); const userId = getCurrentUserId();
  if (!clinicId) throw new Error('Contexto da clínica obrigatório');
  if (!userId) throw new Error('Autoria autenticada obrigatória');
  return { clinicId, userId };
};

export class DocumentShareService {
  static async preparePrescription(prescriptionId: number, recipient: string) {
    const { clinicId, userId } = context();
    if (!recipient.trim()) throw new Error('Destinatário obrigatório');
    const prescription: any = await (prisma as any).prescription.findFirst({ where: { id: prescriptionId, clinicId }, include: { items: true } });
    if (!prescription) throw new Error('Receita não encontrada no contexto da clínica');
    if (prescription.status === 'CANCELLED') throw new Error('Receita cancelada não pode ser compartilhada');
    if (prescription.status !== 'APPROVED') throw new Error('Somente receitas aprovadas podem ser compartilhadas');
    const data = { clinicId, documentType: 'PRESCRIPTION', documentId: prescriptionId, documentVersion: prescription.currentVersion, recipient: recipient.trim(), preview: JSON.stringify({ prescriptionId, version: prescription.currentVersion, clinicId, status: prescription.status, items: prescription.items }), status: 'PREPARED', createdById: userId };
    const existing = await (prisma as any).documentShare.findUnique({ where: { clinicId_documentType_documentId_documentVersion_recipient: { clinicId, documentType: 'PRESCRIPTION', documentId: prescriptionId, documentVersion: prescription.currentVersion, recipient: recipient.trim() } } });
    if (existing) return existing;
    return (prisma as any).$transaction(async (tx: any) => {
      const share = await tx.documentShare.create({ data });
      await tx.documentShareEvent.create({ data: { clinicId, shareId: share.id, actorUserId: userId, fromStatus: 'DRAFT', toStatus: 'PREPARED', note: 'Conteúdo revisado localmente' } });
      return share;
    });
  }

  static async queue(id: number) {
    const { clinicId, userId } = context();
    return (prisma as any).$transaction(async (tx: any) => {
      const share = await tx.documentShare.findUnique({ where: { id }, include: { events: true } });
      if (!share) throw new Error('Compartilhamento não encontrado no contexto da clínica');
      const prescription: any = await tx.prescription.findFirst({ where: { id: share.documentId, clinicId } });
      if (share.documentType === 'PRESCRIPTION' && (!prescription || prescription.status !== 'APPROVED' || prescription.currentVersion !== share.documentVersion)) throw new Error('Documento alterado ou cancelado antes do envio');
      if (share.status === 'QUEUED' || share.status === 'SIMULATED') return share;
      const queued = await tx.documentShare.update({ where: { id }, data: { status: 'QUEUED', lastError: null } });
      await tx.documentShareEvent.create({ data: { clinicId, shareId: id, actorUserId: userId, fromStatus: share.status, toStatus: 'QUEUED', note: 'Transporte externo desativado; fila local preparada' } });
      return queued;
    });
  }

  static get(id: number) {
    const { clinicId } = context();
    return (prisma as any).documentShare.findFirst({ where: { id, clinicId }, include: { events: { orderBy: { createdAt: 'desc' } } } });
  }
}
