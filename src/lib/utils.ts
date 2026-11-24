import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

type DateInput = string | Date | null | undefined;

const parseValidDate = (value: DateInput): Date | null => {
  if (!value) return null;

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export function formatDate(value: DateInput): string {
  const date = parseValidDate(value);
  if (!date) return '—';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}

export function formatTime(value: DateInput): string {
  const date = parseValidDate(value);
  if (!date) return '—';

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}

export function combineAppointmentDateTime(value: DateInput, time: string | null | undefined): string | null {
  if (!value || typeof time !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return null;
  }

  const datePart = typeof value === 'string'
    ? value.match(/^\d{4}-\d{2}-\d{2}/)?.[0]
    : [
        value.getFullYear(),
        String(value.getMonth() + 1).padStart(2, '0'),
        String(value.getDate()).padStart(2, '0'),
      ].join('-');

  if (!datePart || !parseValidDate(`${datePart}T${time}:00`)) {
    return null;
  }

  return `${datePart}T${time}:00`;
}

// Função para formatar valores monetários
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/** Idade do pet a partir da data de nascimento ("3 anos", "8 meses"); usa a idade informada se não houver data. */
export function petAgeLabel(birthDate?: string | Date | null, age?: number | null, now: Date = new Date()): string {
  const birth = birthDate ? new Date(birthDate) : null;
  if (birth && !Number.isNaN(birth.getTime())) {
    let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (now.getDate() < birth.getDate()) months -= 1;
    if (months < 0) return 'Não informada';
    if (months < 12) return months === 1 ? '1 mês' : `${months} meses`;
    const years = Math.floor(months / 12);
    return years === 1 ? '1 ano' : `${years} anos`;
  }
  if (typeof age === 'number' && age >= 0) return age === 1 ? '1 ano' : `${age} anos`;
  return 'Não informada';
}
