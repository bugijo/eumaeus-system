/** Presentation helpers. The API/database remain authoritative for money. */
export type DecimalLike = number | string | null | undefined;

export const decimalToNumber = (value: DecimalLike): number => {
  const parsed = typeof value === 'string' ? Number(value.replace(',', '.')) : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const normalizeDecimalInput = (value: string): string | null => {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized) || Number(normalized) <= 0) return null;
  return normalized;
};

export const formatBRL = (value: DecimalLike): string => new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL',
}).format(decimalToNumber(value));
