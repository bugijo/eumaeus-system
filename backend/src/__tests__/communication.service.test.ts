import { prisma } from '../lib/prisma';
import { runWithClinic } from '../tenantContext';
import { CommunicationService } from '../services/communication.service';

describe('communication outbox invariants', () => {
  const db = prisma as any;
  const baseMessage = { id: 30, tutorId: 11, category: 'BASIC', attempts: 0, maxAttempts: 3, status: 'QUEUED', availableAt: new Date() };

  it('preserves omitted preference fields instead of reactivating consent', async () => {
    const pausedUntil = new Date('2030-01-01T00:00:00.000Z');
    db.tutorCommunicationPreference.findFirst.mockResolvedValue({ id: 40, enabled: false, stopAll: true, pausedUntil });
    db.tutorCommunicationPreference.update.mockResolvedValue({ id: 40, enabled: false, stopAll: true, pausedUntil });

    await runWithClinic(1, () => CommunicationService.upsertPreference(11, { sender: 'SYSTEM', category: 'BASIC' }));

    expect(db.tutorCommunicationPreference.update).toHaveBeenCalledWith({
      where: { id: 40 },
      data: { enabled: false, stopAll: true, pausedUntil },
    });
  });

  beforeEach(() => {
    db.communicationOutbox.findFirst.mockResolvedValue(null);
    db.communicationOutbox.create.mockResolvedValue({ id: 30, clinicId: 1, dedupeKey: 'appointment:8:created' });
    db.communicationOutbox.findMany.mockResolvedValue([]);
    db.communicationOutbox.updateMany.mockResolvedValue({ count: 1 });
    db.communicationOutbox.update.mockResolvedValue({ id: 30 });
    db.communicationAttempt.create.mockResolvedValue({ id: 31 });
    db.tutorCommunicationPreference.findFirst.mockResolvedValue({ enabled: true, stopAll: false, pausedUntil: null });
  });

  it('deduplicates enqueue by key inside the tenant transaction', async () => {
    const existing = { id: 30, dedupeKey: 'appointment:8:created' };
    db.communicationOutbox.findFirst.mockResolvedValue(existing);
    await expect(runWithClinic(1, () => CommunicationService.enqueue(db, { tutorId: 11, appointmentId: 8, eventType: 'APPOINTMENT_CREATED', category: 'BASIC', payload: {}, dedupeKey: existing.dedupeKey }))).resolves.toBe(existing);
    expect(db.communicationOutbox.create).not.toHaveBeenCalled();
  });

  it('cancels a queued message when preference is revoked after enqueue', async () => {
    db.communicationOutbox.findMany.mockResolvedValue([baseMessage]);
    db.tutorCommunicationPreference.findFirst.mockResolvedValue({ enabled: false, stopAll: false, pausedUntil: null });
    const result = await runWithClinic(1, () => CommunicationService.dispatchPending());
    expect(result).toEqual({ simulated: 0, cancelled: 1, failed: 0 });
    expect(db.communicationAttempt.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ outboxId: 30, status: 'CANCELLED' }) }));
    expect(db.communicationOutbox.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 30 }, data: expect.objectContaining({ status: 'CANCELLED' }) }));
  });

  it('lets only one concurrent worker claim the same message', async () => {
    db.communicationOutbox.findMany.mockResolvedValue([baseMessage]);
    db.communicationOutbox.updateMany.mockResolvedValue({ count: 0 });
    const result = await runWithClinic(1, () => CommunicationService.dispatchPending());
    expect(result).toEqual({ simulated: 0, cancelled: 0, failed: 0 });
    expect(db.communicationAttempt.create).not.toHaveBeenCalled();
  });

  it('records a failed attempt and requeues below the retry limit', async () => {
    const before = Date.now();
    db.communicationOutbox.findMany.mockResolvedValue([{ ...baseMessage, attempts: 1 }]);
    const result = await runWithClinic(1, () => CommunicationService.dispatchPending(50, async () => { throw new Error('falha simulada'); }));
    expect(result).toEqual({ simulated: 0, cancelled: 0, failed: 1 });
    expect(db.communicationAttempt.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ attemptNo: 2, status: 'FAILED' }) }));
    const update = (db.communicationOutbox.update as jest.Mock).mock.calls[0][0];
    expect(update).toEqual(expect.objectContaining({ data: expect.objectContaining({ status: 'QUEUED', attempts: 2 }) }));
    expect(update.data.availableAt).toBeInstanceOf(Date);
    expect(update.data.availableAt.getTime()).toBeGreaterThan(before);
  });

  it('simulates delivery only after revalidating an enabled preference', async () => {
    db.communicationOutbox.findMany.mockResolvedValue([baseMessage]);
    const adapter = jest.fn().mockResolvedValue(undefined);
    const result = await runWithClinic(1, () => CommunicationService.dispatchPending(50, adapter));
    expect(result).toEqual({ simulated: 1, cancelled: 0, failed: 0 });
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(db.communicationAttempt.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'SIMULATED' }) }));
  });
});
