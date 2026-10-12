import { prisma } from '../lib/prisma';
import { runWithClinic } from '../tenantContext';
import { SpecialistService } from '../services/specialist.service';

describe('specialist scheduling tenant and idempotency invariants', () => {
  const db = prisma as any;

  beforeEach(() => {
    db.specialistProfile.findMany.mockResolvedValue([]);
    db.specialistProfile.findFirst.mockResolvedValue({ id: 7, active: true, repasseRate: null });
    db.specialistAvailability.create.mockResolvedValue({ id: 10, clinicId: 1, specialistId: 7 });
    db.specialistAssignment.findFirst.mockResolvedValue(null);
    db.specialistAssignment.create.mockResolvedValue({ id: 11, clinicId: 1, appointmentId: 8, specialistId: 7, status: 'REQUESTED' });
    db.specialistAssignment.update.mockResolvedValue({ id: 11, status: 'CONFIRMED' });
    db.appointment.findFirst.mockResolvedValue({ id: 8, clinicId: 1 });
  });

  it('rejects availability for a specialist outside the active clinic', async () => {
    db.specialistProfile.findFirst.mockResolvedValue(null);
    await expect(runWithClinic(2, () => SpecialistService.addAvailability(7, { weekday: 1, startTime: '09:00', endTime: '10:00' }))).rejects.toThrow('não pertence à clínica');
    expect(db.specialistAvailability.create).not.toHaveBeenCalled();
  });

  it('associates only same-clinic records and rejects duplicate assignment', async () => {
    await expect(runWithClinic(1, () => SpecialistService.assign({ appointmentId: 8, specialistId: 7 }))).resolves.toEqual(expect.objectContaining({ id: 11 }));
    db.specialistAssignment.findFirst.mockResolvedValue({ id: 11, appointmentId: 8, specialistId: 7 });
    await expect(runWithClinic(1, () => SpecialistService.assign({ appointmentId: 8, specialistId: 7 }))).rejects.toThrow('já associado');
  });

  it('does not update or confirm an assignment from another clinic', async () => {
    db.specialistAssignment.findFirst.mockResolvedValue(null);
    await expect(runWithClinic(2, () => SpecialistService.confirm(11))).rejects.toThrow('não pertence à clínica');
    expect(db.specialistAssignment.update).not.toHaveBeenCalled();
  });

  it('makes confirmation idempotent once already confirmed', async () => {
    const confirmed = { id: 11, status: 'CONFIRMED', confirmedAt: new Date() };
    db.specialistAssignment.findFirst.mockResolvedValue(confirmed);
    await expect(runWithClinic(1, () => SpecialistService.confirm(11))).resolves.toBe(confirmed);
    expect(db.specialistAssignment.update).not.toHaveBeenCalled();
  });
});
