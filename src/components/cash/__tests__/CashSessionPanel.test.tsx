import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CashSessionBar, ClosedCashDialog, parseBrl } from '../CashSessionPanel';

const closeMock = vi.fn();
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/api/cashApi', () => ({
  useCashHistory: () => ({ data: [] }),
  useOpenCash: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCashMovement: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useCloseCash: () => ({ mutateAsync: closeMock, isPending: false }),
}));

const SESSION: any = {
  id: 1, status: 'OPEN', openedAt: '2026-11-24T12:00:00.000Z', openedBy: 'Ana', closedAt: null, closedBy: null, countedCash: null, difference: null, closingNote: null, movements: [],
  summary: { salesCount: 2, cancelledCount: 0, salesTotal: '130.00', byMethod: { DINHEIRO: '50.00', PIX: '80.00' }, suprimentos: '0.00', sangrias: '20.00', opening: '100.00', expectedCash: '130.00' },
};

describe('parseBrl', () => {
  it('aceita formato brasileiro e com ponto', () => {
    expect(parseBrl('1.234,56')).toBe(1234.56);
    expect(parseBrl('130')).toBe(130);
    expect(parseBrl('12.5')).toBe(12.5);
    expect(Number.isNaN(parseBrl('abc'))).toBe(true);
  });
});

describe('CashSessionBar', () => {
  beforeEach(() => { closeMock.mockReset(); closeMock.mockResolvedValue({ ...SESSION, status: 'CLOSED', closedAt: '2026-11-24T21:00:00.000Z', closedBy: 'Ana', countedCash: '125.00', difference: '-5.00' }); });

  it('mostra a diferença ao vivo e exige observação quando não bate', () => {
    render(<CashSessionBar session={SESSION} />);
    fireEvent.click(screen.getByRole('button', { name: /Fechar caixa/ }));
    expect(screen.getByText('Dinheiro esperado na gaveta')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Dinheiro contado na gaveta (R$)'), { target: { value: '125,00' } });
    expect(screen.getByRole('status')).toHaveTextContent('Falta de R$');
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar fechamento' }));
    expect(closeMock).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/Observação/), { target: { value: 'troco errado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar fechamento' }));
    expect(closeMock).toHaveBeenCalledWith({ countedCash: 125, note: 'troco errado' });
  });

  it('fecha sem observação quando bate', () => {
    render(<CashSessionBar session={SESSION} />);
    fireEvent.click(screen.getByRole('button', { name: /Fechar caixa/ }));
    fireEvent.change(screen.getByLabelText('Dinheiro contado na gaveta (R$)'), { target: { value: '130' } });
    expect(screen.getByRole('status')).toHaveTextContent('Bateu');
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar fechamento' }));
    expect(closeMock).toHaveBeenCalledWith({ countedCash: 130, note: undefined });
  });

  it('entrega o caixa fechado para a página mostrar o resumo', async () => {
    const onClosed = vi.fn();
    render(<CashSessionBar session={SESSION} onClosed={onClosed} />);
    fireEvent.click(screen.getByRole('button', { name: /Fechar caixa/ }));
    fireEvent.change(screen.getByLabelText('Dinheiro contado na gaveta (R$)'), { target: { value: '130' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar fechamento' }));
    await vi.waitFor(() => expect(onClosed).toHaveBeenCalledWith(expect.objectContaining({ status: 'CLOSED', difference: '-5.00' })));
  });

  it('resumo do fechamento mostra diferença e botão de imprimir', () => {
    render(<ClosedCashDialog closed={{ ...SESSION, status: 'CLOSED', closedAt: '2026-11-24T21:00:00.000Z', closedBy: 'Ana', countedCash: '125.00', difference: '-5.00', closingNote: 'troco errado' }} onDone={vi.fn()} />);
    expect(screen.getByText('Caixa fechado')).toBeInTheDocument();
    expect(screen.getByText('troco errado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Imprimir' })).toBeInTheDocument();
  });
});
