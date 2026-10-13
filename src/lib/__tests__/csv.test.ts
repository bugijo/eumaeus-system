import { buildCsv, escapeCsvCell } from '../csv';

describe('CSV export safety', () => {
  it('neutralizes spreadsheet formulas while preserving accents and quoting', () => {
    expect(escapeCsvCell('=SUM(A1:A2)')).toBe('"\'=SUM(A1:A2)"');
    expect(escapeCsvCell('Descrição; R$ 10,00')).toBe('"Descrição; R$ 10,00"');
    expect(buildCsv([['cabeçalho'], ['@risco']])).toBe('\ufeff"cabeçalho"\n"\'@risco"');
  });
});
