export function escapeCsvCell(value: unknown): string {
  const text = String(value ?? '');
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function buildCsv(rows: unknown[][]): string {
  return `\ufeff${rows.map(row => row.map(escapeCsvCell).join(';')).join('\n')}`;
}
