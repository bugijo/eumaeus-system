import { prisma } from '../lib/prisma';
import { runWithClinic } from '../tenantContext';
import { PackageService } from '../services/package.service';


describe('package consumption and reversal invariants', () => {
  const db = prisma as any;

  beforeEach(() => {
    db.packageSession.findFirst.mockResolvedValue(null);
    db.packageSession.create.mockResolvedValue({ id: 20, contractId: 5, appointmentId: 8, serviceId: 3 });
    db.packageContract.findFirst.mockResolvedValue({ id: 5, status: 'ACTIVE', remainingSessions: 2, tutorId: 10, petId: 20, package: { coveredCatalogServiceId: 11 } });
    db.packageContract.updateMany.mockResolvedValue({ count: 1 });
    db.appointment.findFirst.mockResolvedValue({ id: 8, tutorId: 10, petId: 20 });
    db.service.findFirst.mockResolvedValue({ id: 3, appointmentId: 8, catalogServiceId: 11 });
  });

  it('consumes one session only for the contracted catalog service', async () => {
    await expect(runWithClinic(1, () => PackageService.consume(5, 8, 3))).resolves.toEqual(expect.objectContaining({ id: 20 }));
    expect(db.packageContract.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 5, remainingSessions: { gt: 0 } }), data: { remainingSessions: { decrement: 1 } } }));
    expect(db.packageSession.create).toHaveBeenCalledWith({ data: { contractId: 5, appointmentId: 8, serviceId: 3 } });
  });

  it('rejects a service outside the package coverage before decrementing', async () => {
    db.service.findFirst.mockResolvedValue({ id: 3, appointmentId: 8, catalogServiceId: 99 });
    await expect(runWithClinic(1, () => PackageService.consume(5, 8, 3))).rejects.toThrow('Serviço não é o serviço coberto');
    expect(db.packageContract.updateMany).not.toHaveBeenCalled();
    expect(db.packageSession.create).not.toHaveBeenCalled();
  });

  it('rejects a concurrent decrement when the conditional update affects no row', async () => {
    db.packageContract.updateMany.mockResolvedValue({ count: 0 });
    await expect(runWithClinic(1, () => PackageService.consume(5, 8, 3))).rejects.toThrow('Consumo concorrente recusado');
    expect(db.packageSession.create).not.toHaveBeenCalled();
  });

  it('rejects an appointment belonging to another pet even when the service matches', async () => {
    db.appointment.findFirst.mockResolvedValue(null);

    await expect(runWithClinic(1, () => PackageService.consume(5, 8, 3))).rejects.toThrow('Atendimento não pertence ao pet do contrato');
    expect(db.packageContract.updateMany).not.toHaveBeenCalled();
    expect(db.packageSession.create).not.toHaveBeenCalled();
  });

  it('blocks reversal after the session has entered an invoice', async () => {
    db.packageSession.findFirst.mockResolvedValue({ id: 20, contractId: 5, reversedAt: null });
    db.invoiceItem.findFirst.mockResolvedValue({ id: 40, packageSessionId: 20 });
    await expect(runWithClinic(1, () => PackageService.reverse(20, 'Correção sintética'))).rejects.toThrow('Sessão já refletida em fatura');
    expect(db.packageSession.update).not.toHaveBeenCalled();
  });

  it('reverses an unbilled session with an explicit reason and restores balance', async () => {
    db.packageSession.findFirst
      .mockResolvedValueOnce({ id: 20, contractId: 5, reversedAt: null })
      .mockResolvedValueOnce({ id: 20, contractId: 5, reversedAt: new Date(), reversalReason: 'Correção sintética' });
    db.invoiceItem.findFirst.mockResolvedValue(null);
    db.packageSession.update.mockResolvedValue({ id: 20 });
    db.packageContract.update.mockResolvedValue({ id: 5, remainingSessions: 2 });
    await expect(runWithClinic(1, () => PackageService.reverse(20, 'Correção sintética'))).resolves.toEqual(expect.objectContaining({ id: 20 }));
    expect(db.packageSession.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 20 }, data: expect.objectContaining({ reversalReason: 'Correção sintética' }) }));
    expect(db.packageContract.update).toHaveBeenCalledWith({ where: { id: 5 }, data: { remainingSessions: { increment: 1 } } });
  });
});
