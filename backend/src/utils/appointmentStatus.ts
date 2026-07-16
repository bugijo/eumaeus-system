export const APPOINTMENT_STATUSES = [
  'SCHEDULED',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

const STATUS_ALIASES: Record<string, AppointmentStatus> = {
  SCHEDULED: 'SCHEDULED',
  AGENDADO: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED',
  CONFIRMADO: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
  CANCELADO: 'CANCELLED',
  COMPLETED: 'COMPLETED',
  CONCLUIDO: 'COMPLETED',
};

const normalizeAlias = (status: string): string => status
  .trim()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toUpperCase();

export const normalizeAppointmentStatus = (status: unknown): AppointmentStatus | null => {
  if (typeof status !== 'string') return null;
  return STATUS_ALIASES[normalizeAlias(status)] ?? null;
};

export class InvalidAppointmentStatusError extends Error {
  constructor() {
    super('Status de agendamento inválido');
    this.name = 'InvalidAppointmentStatusError';
  }
}

export const requireAppointmentStatus = (status: unknown): AppointmentStatus => {
  const normalizedStatus = normalizeAppointmentStatus(status);
  if (!normalizedStatus) {
    throw new InvalidAppointmentStatusError();
  }
  return normalizedStatus;
};
