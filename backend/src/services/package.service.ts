import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { getCurrentClinicId, getCurrentUserId } from '../tenantContext';
import { lockClinicCash } from './cash.service';
import { computeSaleTotals, SalePaymentInput } from './sale.service';

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

  /**
   * Compra de pacote = venda no caixa. Sem isso o contrato liberava sessões sem nenhum recebimento
   * registrado. Exige caixa aberto e pagamento do valor do pacote; a chave de idempotência evita contrato duplo.
   */
  static async purchase(packageId: number, tutorId: number, petId: number, payments: SalePaymentInput[] = [], idempotencyKey = '') {
    const clinicId = getCurrentClinicId();
    const userId = getCurrentUserId();
    if (!clinicId || !userId) throw new Error('Autoria autenticada obrigatória');
    const key = String(idempotencyKey || '').trim();
    if (!key) throw new Error('Chave de idempotência obrigatória');
    if (!Array.isArray(payments)) throw new Error('Informe a forma de pagamento');
    return prisma.$transaction(async (tx: any) => {
      await lockClinicCash(tx, clinicId);
      const duplicate = await tx.sale.findFirst({ where: { idempotencyKey: `package:${key}` }, select: { id: true } });
      if (duplicate) {
        const existing = await tx.packageContract.findFirst({ where: { saleId: duplicate.id } });
        if (existing) return existing;
        throw new Error('Chave de idempotência já usada em outra venda');
      }
      const packageRecord = await tx.servicePackage.findFirst({ where: { id: packageId, active: true } });
      const [tutor, pet] = await Promise.all([
        tx.tutor.findFirst({ where: { id: tutorId, deletedAt: null } }),
        tx.pet.findFirst({ where: { id: petId, deletedAt: null } }),
      ]);
      if (!packageRecord || !tutor || !pet || pet.tutorId !== tutor.id) throw new Error('Pacote, tutor e pet devem pertencer à clínica autenticada');
      const cashSession = await tx.cashSession.findFirst({ where: { status: 'OPEN' }, select: { id: true } });
      if (!cashSession) throw new Error('Abra o caixa antes de vender o pacote');
      const price = Number(packageRecord.price);
      const totals = computeSaleTotals([{ quantity: 1, unitPrice: price }], 0, payments);
      const last = await tx.sale.findFirst({ orderBy: { number: 'desc' }, select: { number: true } });
      const money = (cents: number) => new Prisma.Decimal((cents / 100).toFixed(2));
      const sale = await tx.sale.create({
        data: {
          number: (last?.number || 0) + 1,
          subtotal: money(totals.subtotal),
          discount: money(0),
          total: money(totals.total),
          change: money(totals.change),
          tutorId: tutor.id,
          soldByUserId: userId,
          idempotencyKey: `package:${key}`,
          cashSessionId: cashSession.id,
          items: { create: [{ clinicId, productId: null, description: `Pacote: ${packageRecord.name}`, barcode: null, quantity: 1, unitPrice: money(totals.subtotal), total: money(totals.subtotal) }] },
          payments: { create: payments.map((payment) => ({ clinicId, method: String(payment.method).toUpperCase(), amount: new Prisma.Decimal(Number(payment.amount).toFixed(2)) })) },
        },
      });
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + packageRecord.validityDays);
      return tx.packageContract.create({ data: { packageId, tutorId, petId, contractedPrice: packageRecord.price, totalSessions: packageRecord.totalSessions, remainingSessions: packageRecord.totalSessions, expiresAt, saleId: sale.id } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
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
      const found = await tx.packageSession.findFirst({ where: { id: sessionId, reversedAt: null }, select: { appointmentId: true } });
      if (!found) throw new Error('Sessão já estornada ou não encontrada');
      // Mesma trava do faturamento (linha do atendimento): estorno e fatura não se cruzam.
      await tx.$queryRaw`SELECT "id" FROM "Appointment" WHERE "id" = ${found.appointmentId} FOR UPDATE`;
      const session = await tx.packageSession.findFirst({ where: { id: sessionId, reversedAt: null } });
      if (!session) throw new Error('Sessão já estornada ou não encontrada');
      const invoiced = await tx.invoiceItem.findFirst({ where: { packageSessionId: sessionId } });
      if (invoiced) throw new Error('Sessão já refletida em fatura; faça um ajuste financeiro auditado antes do estorno');
      // Condicional: dois estornos simultâneos não devolvem o saldo em dobro.
      const reversed = await tx.packageSession.updateMany({ where: { id: sessionId, reversedAt: null }, data: { reversedAt: new Date(), reversalReason: reason.trim() } });
      if (reversed.count !== 1) throw new Error('Sessão já estornada ou não encontrada');
      await tx.packageContract.update({ where: { id: session.contractId }, data: { remainingSessions: { increment: 1 } } });
      return tx.packageSession.findFirst({ where: { id: sessionId } });
    });
  }

  static async getContract(id: number) {
    return prisma.packageContract.findFirst({ where: { id }, include: { package: true, sessions: true, pet: true, tutor: true } });
  }
}
