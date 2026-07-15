import { describe, expect, it } from 'vitest';
import { formatDate, formatTime } from '../utils';

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
});
