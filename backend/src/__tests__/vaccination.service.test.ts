import { prisma } from '../lib/prisma';
import { runWithClinic } from '../tenantContext';
import { VaccinationService } from '../services/vaccination.service';

describe('vaccination reminders', () => {
  it('records the responsible veterinarian and queues a simulated health reminder transactionally', async () => {
    const db = prisma as any;
    db.pet.findFirst.mockResolvedValue({ id: 7, tutorId: 11 });
    db.vaccinationRecord.create.mockResolvedValue({ id: 21, petId: 7, responsibleUserId: 3, vaccineName: 'V10', nextDueAt: new Date('2027-01-10T00:00:00.000Z') });
    db.communicationOutbox.findFirst.mockResolvedValue(null);
    db.communicationOutbox.create.mockResolvedValue({ id: 31, status: 'QUEUED' });

    await runWithClinic(4, () => VaccinationService.create({
      petId: 7,
      responsibleUserId: 3,
      vaccineName: 'V10',
      nextDueAt: '2027-01-10',
    }));

    expect(db.vaccinationRecord.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ petId: 7, responsibleUserId: 3 }) }));
    expect(db.communicationOutbox.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ tutorId: 11, category: 'HEALTH', eventType: 'VACCINATION_DUE' }) }));
  });
});
