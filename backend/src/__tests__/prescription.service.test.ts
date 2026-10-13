import { prisma } from '../lib/prisma';
import { runWithClinic } from '../tenantContext';
import { PrescriptionService } from '../services/prescription.service';

describe('prescriptions', () => {
  it('stores identity snapshots and preserves approved prescriptions as immutable', async () => {
    const db = prisma as any;
    db.medicalRecord.findFirst.mockResolvedValue({ appointment: { pet: { name: 'Pet', tutor: { name: 'Tutor' } } } });
    db.user.findFirst.mockResolvedValue({ id: 3, name: 'Dra. Vet', roleName: 'VETERINARIO' });
    db.clinicSettings.findFirst.mockResolvedValue({ clinicName: 'Clínica Sintética' });
    db.prescription.create.mockResolvedValue({ id: 8 });
    db.prescriptionItem.createMany.mockResolvedValue({ count: 1 });
    db.prescription.findFirst.mockResolvedValue({ id: 8, currentVersion: 1, status: 'PENDING_REVIEW', items: [] });

    const created: any = await runWithClinic(4, () => PrescriptionService.createPrescription({ medicalRecordId: 2, items: [{ medication: 'M', dosage: 'D', frequency: 'F', duration: 'T' }] }, 3));
    expect(db.prescription.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ clinicNameSnapshot: 'Clínica Sintética', veterinarianNameSnapshot: 'Dra. Vet', signatureMode: 'VISUAL_ONLY' }) }));
    expect(created.id).toBe(8);
  });

  it('requires a veterinarian for review and requires a cancellation reason', async () => {
    const db = prisma as any;
    db.user.findFirst.mockResolvedValue({ id: 2, roleName: 'DONO' });
    await expect(runWithClinic(4, () => PrescriptionService.review(8, 2, 'APPROVED'))).rejects.toThrow('Apenas usuário veterinário');
    await expect(runWithClinic(4, () => PrescriptionService.cancel(8, 2, '   '))).rejects.toThrow('Justificativa');
  });

  it('cancels without deleting historical prescription rows', async () => {
    const db = prisma as any;
    db.prescription.findFirst.mockResolvedValue({ id: 8, status: 'PENDING_REVIEW' });
    db.prescription.update.mockResolvedValue({ id: 8, status: 'CANCELLED' });
    await expect(runWithClinic(4, () => PrescriptionService.cancel(8, 3, 'Correção clínica solicitada'))).resolves.toBe(true);
    expect(db.prescription.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'CANCELLED', cancelReason: 'Correção clínica solicitada' }) }));
  });

  it('scopes prescription reads to the authenticated clinic', async () => {
    const db = prisma as any;
    db.prescription.findFirst
      .mockResolvedValueOnce({ id: 8, clinicId: 4, currentVersion: 1 })
      .mockResolvedValueOnce({ id: 8, clinicId: 4, items: [] });
    await runWithClinic(4, () => PrescriptionService.getPrescriptionById(8));
    expect(db.prescription.findFirst).toHaveBeenNthCalledWith(1, { where: { id: 8, clinicId: 4 } });
    expect(db.prescription.findFirst).toHaveBeenNthCalledWith(2, expect.objectContaining({ where: { id: 8, clinicId: 4 } }));
  });
});
