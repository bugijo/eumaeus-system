import { computeCashSummary, parseMoney } from '../services/cash.service';

const sale = (status: string, total: number, change: number, payments: Array<[string, number]>) => ({
  status, total, change, payments: payments.map(([method, amount]) => ({ method, amount })),
});

describe('computeCashSummary', () => {
  it('dinheiro esperado = troco inicial + dinheiro − troco + suprimento − sangria', () => {
    const summary = computeCashSummary('100.00', [
      sale('COMPLETED', 30, 20, [['DINHEIRO', 50]]),            // entra 50, devolve 20
      sale('COMPLETED', 80, 0, [['PIX', 80]]),                  // não mexe na gaveta
      sale('COMPLETED', 45.5, 0, [['DINHEIRO', 20], ['DEBITO', 25.5]]),
      sale('CANCELLED', 99, 0, [['DINHEIRO', 99]]),             // cancelada: ignorada
    ], [
      { type: 'SUPRIMENTO', amount: '50' },
      { type: 'SANGRIA', amount: '120.00' },
    ]);
    expect(summary.expectedCash).toBe('80.00'); // 100 + 50 − 20 + 20 + 50 − 120
    expect(summary.expectedCashCents).toBe(8000);
    expect(summary.byMethod).toEqual({ DINHEIRO: '50.00', PIX: '80.00', DEBITO: '25.50' });
    expect(summary.salesTotal).toBe('155.50');
    expect(summary.salesCount).toBe(3);
    expect(summary.cancelledCount).toBe(1);
  });

  it('sem vendas, esperado é o troco inicial', () => {
    expect(computeCashSummary(0, [], []).expectedCash).toBe('0.00');
    expect(computeCashSummary('12.34', [], []).expectedCash).toBe('12.34');
  });
});

describe('parseMoney', () => {
  it('converte para centavos e recusa negativo, zero (quando não permitido) e texto', () => {
    expect(parseMoney('10.105', 'Valor')).toBe(1011);
    expect(parseMoney(0, 'Troco', { allowZero: true })).toBe(0);
    expect(() => parseMoney(0, 'Valor')).toThrow('Valor inválido');
    expect(() => parseMoney(-5, 'Valor')).toThrow('Valor inválido');
    expect(() => parseMoney('abc', 'Valor')).toThrow('Valor inválido');
    expect(() => parseMoney(2_000_000, 'Valor')).toThrow('acima do permitido');
  });
});
