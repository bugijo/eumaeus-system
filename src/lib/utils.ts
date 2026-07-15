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
