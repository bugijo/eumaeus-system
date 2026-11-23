import { computeSaleTotals } from '../services/sale.service';
import { splitAllocation } from '../services/financial.service';

describe('PDV: cálculo da venda', () => {
  it('soma itens, aplica desconto e calcula troco em dinheiro', () => {
    const totals = computeSaleTotals([{ quantity: 2, unitPrice: 49.9 }, { quantity: 1, unitPrice: 10.05 }], 5, [{ method: 'DINHEIRO', amount: 110 }]);
    expect(totals.subtotal).toBe(10985);
    expect(totals.total).toBe(10485);
    expect(totals.change).toBe(515);
  });

  it('aceita pagamento dividido e exato', () => {
    const totals = computeSaleTotals([{ quantity: 1, unitPrice: 100 }], 0, [{ method: 'pix', amount: 60 }, { method: 'CREDITO', amount: 40 }]);
    expect(totals.change).toBe(0);
  });

  it('recusa pagamento insuficiente, troco sem dinheiro, desconto acima do subtotal e carrinho vazio', () => {
    expect(() => computeSaleTotals([{ quantity: 1, unitPrice: 10 }], 0, [{ method: 'PIX', amount: 9 }])).toThrow('Pagamento insuficiente');
    expect(() => computeSaleTotals([{ quantity: 1, unitPrice: 10 }], 0, [{ method: 'PIX', amount: 20 }])).toThrow('Troco só é permitido');
    expect(() => computeSaleTotals([{ quantity: 1, unitPrice: 10 }], 11, [{ method: 'PIX', amount: 1 }])).toThrow('Desconto');
    expect(() => computeSaleTotals([], 0, [])).toThrow('ao menos um item');
    expect(() => computeSaleTotals([{ quantity: 1.5, unitPrice: 10 }], 0, [{ method: 'PIX', amount: 15 }])).toThrow('inteiro');
    expect(() => computeSaleTotals([{ quantity: 1, unitPrice: 10 }], 0, [{ method: 'CHEQUE', amount: 10 }])).toThrow('Forma de pagamento inválida');
  });
});

describe('Rateio de contas compartilhadas', () => {
  it('divide o aluguel 50/50', () => {
    const parts = splitAllocation(300000, [{ resultCenterId: 1, percent: 50 }, { resultCenterId: 2, percent: 50 }]);
    expect(parts.map((part) => part.cents)).toEqual([150000, 150000]);
  });

  it('manda a sobra de centavos para a maior fatia e fecha o total', () => {
    const parts = splitAllocation(100001, [{ resultCenterId: 1, percent: 25 }, { resultCenterId: 2, percent: 75 }]);
    expect(parts[0].cents + parts[1].cents).toBe(100001);
    expect(parts[0].cents).toBe(25000);
    expect(parts[1].cents).toBe(75001);
  });

  it('exige soma 100%, centros distintos e ao menos dois centros', () => {
    expect(() => splitAllocation(1000, [{ resultCenterId: 1, percent: 30 }, { resultCenterId: 2, percent: 60 }])).toThrow('100%');
    expect(() => splitAllocation(1000, [{ resultCenterId: 1, percent: 50 }, { resultCenterId: 1, percent: 50 }])).toThrow('repetido');
    expect(() => splitAllocation(1000, [{ resultCenterId: 1, percent: 100 }])).toThrow('dois centros');
    expect(() => splitAllocation(0, [{ resultCenterId: 1, percent: 50 }, { resultCenterId: 2, percent: 50 }])).toThrow('positivo');
  });
});
