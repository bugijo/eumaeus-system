import { prisma } from '../lib/prisma';
import { getCurrentClinicId } from '../tenantContext';

export interface AssistantAlert {
  id: string;
  source: string;
  kind: string;
  title: string;
  reason: string;
  dueAt?: string;
  href: string;
}

export class AssistantService {
  static async summary(now = new Date()) {
    const clinicId = getCurrentClinicId();
    if (!clinicId) throw new Error('Contexto da clínica obrigatório');
    const dayStart = new Date(now); dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart); dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
    const horizon = new Date(dayEnd); horizon.setUTCDate(horizon.getUTCDate() + 30);
    const [appointments, invoices, products, lots, packages, tasks, communication] = await Promise.all([
      prisma.appointment.findMany({ where: { clinicId, appointmentDate: { gte: dayStart, lt: dayEnd }, status: { in: ['SCHEDULED', 'CONFIRMED'] } }, select: { id: true, appointmentDate: true, status: true, pet: { select: { name: true } } } }),
      prisma.invoice.findMany({ where: { clinicId, status: 'PENDING' }, select: { id: true, totalAmount: true, status: true } }),
      prisma.product.findMany({ where: { clinicId, quantity: { lte: 5 } }, select: { id: true, name: true, quantity: true } }),
      prisma.productLot.findMany({ where: { clinicId, expiresAt: { gte: dayStart, lte: horizon }, quantity: { gt: 0 } }, select: { id: true, productId: true, lotCode: true, expiresAt: true, product: { select: { name: true } } } }),
      prisma.packageContract.findMany({ where: { clinicId, status: 'ACTIVE', OR: [{ expiresAt: { lte: horizon } }, { remainingSessions: { lte: 1 } }] }, select: { id: true, expiresAt: true, remainingSessions: true, package: { select: { name: true } }, pet: { select: { name: true } } } }),
      prisma.hospitalizationTask.findMany({ where: { clinicId, status: 'PENDING', scheduledAt: { lt: now } }, select: { id: true, title: true, scheduledAt: true } }),
      prisma.communicationOutbox.findMany({ where: { clinicId, status: 'FAILED' }, select: { id: true, eventType: true, lastError: true } }),
    ]);
    const alerts: AssistantAlert[] = [];
    for (const item of appointments) alerts.push({ id: `appointment:${item.id}`, source: `appointment:${item.id}`, kind: 'APPOINTMENT', title: `Confirmação do atendimento de ${item.pet?.name || 'pet'}`, reason: `Status ${item.status} requer acompanhamento`, dueAt: item.appointmentDate.toISOString(), href: '/agendamentos' });
    for (const item of invoices) alerts.push({ id: `invoice:${item.id}`, source: `invoice:${item.id}`, kind: 'RECEIVABLE', title: `Conta a receber #${item.id}`, reason: `Fatura pendente de ${String(item.totalAmount)}`, href: '/financeiro' });
    for (const item of products) alerts.push({ id: `product:${item.id}`, source: `product:${item.id}`, kind: 'STOCK', title: `Estoque baixo: ${item.name}`, reason: `Quantidade atual ${item.quantity}`, href: '/estoque' });
    for (const item of lots) alerts.push({ id: `lot:${item.id}`, source: `lot:${item.id}`, kind: 'EXPIRY', title: `Lote próximo do vencimento: ${item.product?.name || item.productId}`, reason: `Lote ${item.lotCode}`, dueAt: item.expiresAt?.toISOString(), href: '/estoque' });
    for (const item of packages) alerts.push({ id: `package:${item.id}`, source: `package:${item.id}`, kind: 'PACKAGE', title: `Pacote próximo do fim: ${item.package.name}`, reason: `${item.remainingSessions} sessão(ões) restantes`, dueAt: item.expiresAt.toISOString(), href: '/operacao' });
    for (const item of tasks) alerts.push({ id: `task:${item.id}`, source: `task:${item.id}`, kind: 'TASK', title: `Tarefa atrasada: ${item.title}`, reason: 'Execução ainda pendente', dueAt: item.scheduledAt?.toISOString(), href: '/assistencia' });
    for (const item of communication) alerts.push({ id: `communication:${item.id}`, source: `communication:${item.id}`, kind: 'COMMUNICATION', title: `Falha de comunicação ${item.eventType}`, reason: item.lastError || 'Transporte simulado falhou', href: '/operacao' });
    return { generatedAt: now.toISOString(), clinicId, alerts };
  }
}
