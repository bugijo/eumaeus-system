import { prisma } from '../lib/prisma';
import { runWithClinic, runWithUser } from '../tenantContext';
import { DocumentShareService } from '../services/documentShare.service';

describe('DocumentShareService', () => {
  it('prepara, enfileira uma receita aprovada uma vez e recusa versão cancelada', async () => {
    (prisma as any).prescription.findFirst.mockResolvedValue({ id: 3, clinicId: 4, currentVersion: 2, status: 'APPROVED', clinicNameSnapshot: 'Clínica QA', items: [{ medication: 'TESTE' }] });
    (prisma as any).documentShare.findUnique.mockResolvedValue(null);
    (prisma as any).documentShare.create.mockResolvedValue({ id: 8, clinicId: 4, status: 'PREPARED', recipient: 'qa@example.invalid' });
    (prisma as any).documentShare.findUnique.mockImplementation(({ where }: any) => where.id === 8 ? Promise.resolve({ id: 8, clinicId: 4, documentType: 'PRESCRIPTION', documentId: 3, documentVersion: 2, status: 'PREPARED', recipient: 'qa@example.invalid' }) : Promise.resolve(null));
    (prisma as any).documentShare.update.mockResolvedValue({ id: 8, status: 'QUEUED' });
    (prisma as any).documentShareEvent.create.mockResolvedValue({ id: 1 });
    await runWithClinic(4, () => runWithUser(99, async () => {
      await expect(DocumentShareService.preparePrescription(3, 'qa@example.invalid')).resolves.toEqual(expect.objectContaining({ status: 'PREPARED' }));
      await expect(DocumentShareService.queue(8)).resolves.toEqual(expect.objectContaining({ status: 'QUEUED' }));
    }));
    expect((prisma as any).documentShareEvent.create).toHaveBeenCalledTimes(2);
    (prisma as any).prescription.findFirst.mockResolvedValue({ id: 3, clinicId: 4, currentVersion: 2, status: 'CANCELLED' });
    await expect(runWithClinic(4, () => runWithUser(99, () => DocumentShareService.preparePrescription(3, 'qa@example.invalid')))).rejects.toThrow('cancelada');
  });

  it('não expõe compartilhamento de outra clínica', async () => {
    (prisma as any).documentShare.findFirst.mockResolvedValue(null);
    await expect(runWithClinic(7, () => runWithUser(99, () => DocumentShareService.get(8)))).resolves.toBeNull();
  });
});
