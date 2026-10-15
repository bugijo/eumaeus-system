import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { getCurrentClinicId } from '../tenantContext';

export class PackageService {
  static async listPackages() {
    return prisma.servicePackage.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
  }

  static async createPackage(data: { name: string; description?: string; price: number; totalSessions: number; validityDays: number; coveredCatalogServiceId?: number }) {
    if (!data.name?.trim() || !Number.isFinite(data.price) || data.price < 0 || !Number.isInteger(data.totalSessions) || data.totalSessions <= 0 || !Number.isInteger(data.validityDays) || data.validityDays <= 0) {
      throw new Error('Dados do pacote inválidos');
    }
    const clinicId = getCurrentClinicId();
    if (!clinicId) throw new Error('Contexto da clínica ausente');
    if (!Number.isInteger(data.coveredCatalogServiceId) || !data.coveredCatalogServiceId) throw new Error('O pacote deve identificar o serviço de catálogo coberto');
    const coveredService = await prisma.catalogService.findFirst({ where: { id: data.coveredCatalogServiceId, active: true } });
    if (!coveredService) throw new Error('Serviço de catálogo coberto não encontrado');
    return prisma.servicePackage.create({ data: { clinicId, name: data.name.trim(), description: data.description?.trim() || null, price: new Prisma.Decimal(data.price), totalSessions: data.totalSessions, validityDays: data.validityDays, coveredCatalogServiceId: data.coveredCatalogServiceId } });
  }

  static async purchase(packageId: number, tutorId: number, petId: number) {
    return prisma.$transaction(async (tx: any) => {
      const packageRecord = await tx.servicePackage.findFirst({ where: { id: packageId, active: true } });
      const [tutor, pet] = await Promise.all([
        tx.tutor.findFirst({ where: { id: tutorId, deletedAt: null } }),
        tx.pet.findFirst({ where: { id: petId, deletedAt: null } }),
      ]);
      if (!packageRecord || !tutor || !pet || pet.tutorId !== tutor.id) throw new Error('Pacote, tutor e pet devem pertencer à clínica autenticada');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + packageRecord.validityDays);
      return tx.packageContract.create({ data: { packageId, tutorId, petId, contractedPrice: packageRecord.price, totalSessions: packageRecord.totalSessions, remainingSessions: packageRecord.totalSessions, expiresAt } });
    });
  }

  static async consume(contractId: number, appointmentId: number, serviceId: number) {
    return prisma.$transaction(async (tx: any) => {
      const appointmentSession = await tx.packageSession.findFirst({ where: { appointmentId } });
      if (appointmentSession) {
        if (appointmentSession.contractId === contractId && appointmentSession.reversedAt === null) return appointmentSession;
        throw new Error('Atendimento já possui uma sessão de pacote; não é possível duplicar o consumo');
      }
      const contract = await tx.packageContract.findFirst({ where: { id: contractId, status: 'ACTIVE', expiresAt: { gte: new Date() }, remainingSessions: { gt: 0 } }, include: { package: true } });
      if (!contract) throw new Error('Pacote sem saldo, expirado ou inativo');
      const appointment = await tx.appointment.findFirst({ where: { id: appointmentId, tutorId: contract.tutorId, petId: contract.petId } });
      if (!appointment) throw new Error('Atendimento não pertence ao pet do contrato');
      const service = await tx.service.findFirst({ where: { id: serviceId, appointmentId } });
      if (!service || !service.catalogServiceId || service.catalogServiceId !== contract.package.coveredCatalogServiceId) throw new Error('Serviço não é o serviço coberto pelo pacote neste atendimento');
      const decremented = await tx.packageContract.updateMany({ where: { id: contractId, status: 'ACTIVE', expiresAt: { gte: new Date() }, remainingSessions: { gt: 0 } }, data: { remainingSessions: { decrement: 1 } } });
      if (decremented.count !== 1) throw new Error('Consumo concorrente recusado: saldo indisponível');
      return tx.packageSession.create({ data: { contractId, appointmentId, serviceId } });
    });
  }

  static async reverse(sessionId: number, reason: string) {
    if (!reason?.trim()) throw new Error('Justificativa do estorno é obrigatória');
    return prisma.$transaction(async (tx: any) => {
      const session = await tx.packageSession.findFirst({ where: { id: sessionId, reversedAt: null } });
      if (!session) throw new Error('Sessão já estornada ou não encontrada');
      const invoiced = await tx.invoiceItem.findFirst({ where: { packageSessionId: sessionId } });
      if (invoiced) throw new Error('Sessão já refletida em fatura; faça um ajuste financeiro auditado antes do estorno');
      await tx.packageSession.update({ where: { id: sessionId }, data: { reversedAt: new Date(), reversalReason: reason.trim() } });
      await tx.packageContract.update({ where: { id: session.contractId }, data: { remainingSessions: { increment: 1 } } });
      return tx.packageSession.findFirst({ where: { id: sessionId } });
    });
  }

  static async getContract(id: number) {
    return prisma.packageContract.findFirst({ where: { id }, include: { package: true, sessions: true, pet: true, tutor: true } });
  }
}
