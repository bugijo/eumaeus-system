import { prisma } from '../lib/prisma';
import { runWithClinic, runWithUser } from '../tenantContext';
import { AssistantReminderService } from '../services/assistantReminder.service';

describe('AssistantReminderService', () => {
  it('deduplica ocorrências, registra ações, reativa adiamentos e mantém o escopo da clínica', async () => {
    const reminder = { id: 10, clinicId: 4, reminderKey: 'invoice:12', status: 'ACTIVE', snoozedUntil: null };
    (prisma as any).assistantReminder.findUnique.mockResolvedValue(reminder);
    (prisma as any).assistantReminder.update.mockResolvedValue({ ...reminder, status: 'SNOOZED' });
    (prisma as any).assistantReminderAction.create.mockResolvedValue({ id: 1 });
    (prisma as any).assistantReminder.findMany
      .mockResolvedValueOnce([{ ...reminder, status: 'SNOOZED' }])
      .mockResolvedValueOnce([{ ...reminder, status: 'ACTIVE', actions: [{ id: 1, action: 'REACTIVATED' }] }]);

    await runWithClinic(4, () => runWithUser(99, async () => {
      await expect(AssistantReminderService.upsertOccurrence({
        reminderKey: 'invoice:12', kind: 'RECEIVABLE', sourceType: 'invoice', sourceId: 12,
        title: 'Conta a receber #12', reason: 'Fatura pendente',
      })).resolves.toEqual(reminder);

      await AssistantReminderService.snooze(10, new Date('2026-10-20T00:00:00Z'), 'Acompanhar no fechamento');
      await AssistantReminderService.dismiss(10, 'Tratado fora do sistema');
      await expect(AssistantReminderService.list(new Date('2026-10-21T00:00:00Z'))).resolves.toEqual(expect.any(Array));
    }));

    expect((prisma as any).assistantReminder.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { clinicId_reminderKey: { clinicId: 4, reminderKey: 'invoice:12' } } }));
    expect((prisma as any).assistantReminderAction.create).toHaveBeenCalled();
    expect((prisma as any).assistantReminderAction.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'REACTIVATED' }) }));
    expect((prisma as any).assistantReminder.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ clinicId: 4 }) }));
  });

  it('não permite operar lembrete de outra clínica', async () => {
    (prisma as any).assistantReminder.findUnique.mockResolvedValue(null);
    await expect(runWithClinic(7, () => runWithUser(99, () => AssistantReminderService.dismiss(10, 'Teste')))
    ).rejects.toThrow('Lembrete não encontrado no contexto da clínica');
  });
});
