import { describe, expect, it } from 'vitest';
import { buildAssistantReminderMutationInput } from '../Dashboard';

describe('Dashboard assistant reminders', () => {
  it('builds an explicit reason payload without relying on native dialogs', () => {
    const now = new Date('2026-10-15T12:00:00.000Z');

    expect(buildAssistantReminderMutationInput('dismiss', 12, 'Conferido na origem', now)).toEqual({
      action: 'dismiss', id: 12, reason: 'Conferido na origem',
    });
    expect(buildAssistantReminderMutationInput('snooze', 13, 'Aguardar retorno', now)).toEqual({
      action: 'snooze', id: 13, reason: 'Aguardar retorno', until: '2026-10-16T12:00:00.000Z',
    });
  });
});
