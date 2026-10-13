import { prisma } from '../lib/prisma';
import { runWithClinic } from '../tenantContext';
import { AssistantService } from '../services/assistant.service';

describe('deterministic administrative assistant', () => {
  it('builds alerts from current clinic-owned sources with traceable links', async () => {
    const db = prisma as any;
    db.appointment.findMany.mockResolvedValue([{ id: 10, appointmentDate: new Date('2026-10-13T12:00:00Z'), status: 'CONFIRMED', pet: { name: 'Luna' } }]);
    db.invoice.findMany.mockResolvedValue([{ id: 11, totalAmount: '45.90', status: 'PENDING' }]);
    db.product.findMany.mockResolvedValue([{ id: 12, name: 'Insumo', quantity: 1 }]);
    db.productLot.findMany.mockResolvedValue([{ id: 13, productId: 12, lotCode: 'L1', expiresAt: new Date('2026-10-20T00:00:00Z'), quantity: 2, product: { name: 'Insumo' } }]);
    db.packageContract.findMany.mockResolvedValue([{ id: 14, expiresAt: new Date('2026-10-20T00:00:00Z'), remainingSessions: 1, status: 'ACTIVE', package: { name: 'Pacote QA' }, pet: { name: 'Luna' } }]);
    db.hospitalizationTask.findMany.mockResolvedValue([{ id: 15, title: 'Tarefa sintética', status: 'PENDING', scheduledAt: new Date('2026-10-12T00:00:00Z') }]);
    db.communicationOutbox.findMany.mockResolvedValue([{ id: 16, eventType: 'APPOINTMENT_CREATED', status: 'FAILED', lastError: 'simulado' }]);
    const summary = await runWithClinic(4, () => AssistantService.summary(new Date('2026-10-13T00:00:00Z')));
    expect(summary.alerts).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: 'appointment:10', href: '/agendamentos' }),
      expect.objectContaining({ source: 'invoice:11', href: '/financeiro' }),
      expect.objectContaining({ source: 'product:12', href: '/estoque' }),
      expect.objectContaining({ source: 'communication:16', href: '/operacao' }),
    ]));
  });
});
