import {
  InvalidAppointmentStatusError,
  normalizeAppointmentStatus,
  requireAppointmentStatus,
} from '../utils/appointmentStatus';

describe('appointment status normalization', () => {
  it.each([
    ['SCHEDULED', 'SCHEDULED'],
    ['CONFIRMED', 'CONFIRMED'],
    ['CANCELLED', 'CANCELLED'],
    ['COMPLETED', 'COMPLETED'],
    ['AGENDADO', 'SCHEDULED'],
    ['CONFIRMADO', 'CONFIRMED'],
    ['CANCELADO', 'CANCELLED'],
    ['CONCLUIDO', 'COMPLETED'],
    ['CONCLUÍDO', 'COMPLETED'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeAppointmentStatus(input)).toBe(expected);
  });

  it('rejects an invalid status instead of defaulting to SCHEDULED', () => {
    expect(normalizeAppointmentStatus('WAITING')).toBeNull();
    expect(() => requireAppointmentStatus('WAITING')).toThrow(InvalidAppointmentStatusError);
  });
});
