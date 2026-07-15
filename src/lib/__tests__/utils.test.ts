import { describe, expect, it } from 'vitest';
import { combineAppointmentDateTime, formatDate, formatTime } from '../utils';

describe('date formatting utilities', () => {
  const validDate = '2026-07-15T14:30:00-03:00';

  it('formats a valid date', () => {
    expect(formatDate(validDate)).toBe('15/07/2026');
  });

  it('formats a valid time', () => {
    expect(formatTime(validDate)).toBe('14:30');
  });

  it('returns a safe fallback for an absent value', () => {
    expect(formatDate(undefined)).toBe('—');
    expect(formatTime(null)).toBe('—');
  });

  it('returns a safe fallback for an invalid value', () => {
    expect(formatDate('not-a-date')).toBe('—');
    expect(formatTime('not-a-date')).toBe('—');
  });

  it('combines the persisted ISO date with the explicit appointment time', () => {
    expect(combineAppointmentDateTime('2026-07-15T13:00:00.000Z', '10:00'))
      .toBe('2026-07-15T10:00:00');
  });

  it('does not create a calendar event from invalid date or time values', () => {
    expect(combineAppointmentDateTime('not-a-date', '10:00')).toBeNull();
    expect(combineAppointmentDateTime('2026-07-15T13:00:00.000Z', '25:00')).toBeNull();
  });
});
