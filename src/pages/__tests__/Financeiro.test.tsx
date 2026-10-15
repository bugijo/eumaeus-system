import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Financeiro from '../Financeiro';
import { useApplyInvoiceDiscount, useFinancialStats, useInvoices } from '../../api/invoiceApi';
import { ACCOUNTS_PAYABLE_DATA_SOURCE } from '../../constants';
import { useCreateExpense, useCreateResultCenter, useExpenses, useReceivePayment, useResultCenters, useReversePayment } from '../../api/financialApi';
import { useAuthStore } from '../../stores/authStore';

vi.mock('../../stores/authStore', () => ({ useAuthStore: vi.fn() }));

vi.mock('../../api/invoiceApi', () => ({
  useFinancialStats: vi.fn(),
  useInvoices: vi.fn(),
  useApplyInvoiceDiscount: vi.fn(),
}));
vi.mock('../../api/financialApi', () => ({
  useCreateExpense: vi.fn(),
  useExpenses: vi.fn(),
  useReceivePayment: vi.fn(),
  useReversePayment: vi.fn(),
  useCreateResultCenter: vi.fn(),
  useResultCenters: vi.fn(),
}));

describe('Financeiro', () => {
  it('uses only backend invoice values in real totals and hides demo expenses', () => {
    vi.mocked(useApplyInvoiceDiscount).mockReturnValue({ mutate: vi.fn() } as any);
    vi.mocked(useAuthStore).mockImplementation((selector: any) => selector({ user: { role: 'DONO' } }));
    vi.mocked(useReceivePayment).mockReturnValue({ mutate: vi.fn() } as any);
    vi.mocked(useReversePayment).mockReturnValue({ mutate: vi.fn() } as any);
    vi.mocked(useCreateExpense).mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false } as any);
    vi.mocked(useCreateResultCenter).mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false } as any);
    vi.mocked(useExpenses).mockReturnValue({ data: [] } as any);
    vi.mocked(useResultCenters).mockReturnValue({ data: [] } as any);
    vi.mocked(useFinancialStats).mockReturnValue({
      data: {
        paid: { amount: '100.00', count: 1 },
        pending: { amount: '50.00', count: 1 },
        cancelled: { amount: '10.00', count: 1 },
      },
      isLoading: false,
      error: null,
    } as any);
    vi.mocked(useInvoices).mockReturnValue({
      data: [{
        id: 1,
        totalAmount: 100,
        status: 'PAID',
        createdAt: '2026-07-15T12:00:00Z',
        appointment: {
          pet: {
            name: 'Pet Sintético',
            tutor: { name: 'Tutor Sintético' },
          },
        },
      }],
      isLoading: false,
      error: null,
    } as any);

    render(<Financeiro />);

    const totalCard = screen.getByText('Total de Receitas').closest('[class*="rounded"]');
    expect(totalCard).not.toBeNull();
    expect(within(totalCard as HTMLElement).getByText('R$ 150,00')).toBeInTheDocument();
    expect(screen.queryByText('Contas a Pagar')).not.toBeInTheDocument();
    expect(screen.queryByText('Nova Despesa')).not.toBeInTheDocument();
    expect(screen.queryByText('Aluguel da Clínica')).not.toBeInTheDocument();
    expect(ACCOUNTS_PAYABLE_DATA_SOURCE).toEqual({
      type: 'demo',
      visible: false,
      includedInRealTotals: false,
    });
  });

  it('hides discount for veterinarian and rejects invalid receipt values in the visual form', async () => {
    const receive = vi.fn();
    vi.mocked(useApplyInvoiceDiscount).mockReturnValue({ mutate: vi.fn() } as any);
    vi.mocked(useAuthStore).mockImplementation((selector: any) => selector({ user: { role: 'VETERINARIO' } }));
    vi.mocked(useReceivePayment).mockReturnValue({ mutate: receive, isPending: false } as any);
    vi.mocked(useReversePayment).mockReturnValue({ mutate: vi.fn(), isPending: false } as any);
    vi.mocked(useCreateExpense).mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false } as any);
    vi.mocked(useCreateResultCenter).mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false } as any);
    vi.mocked(useExpenses).mockReturnValue({ data: [] } as any);
    vi.mocked(useResultCenters).mockReturnValue({ data: [] } as any);
    vi.mocked(useFinancialStats).mockReturnValue({ data: { paid: { amount: 0, count: 0 }, pending: { amount: 5, count: 1 }, cancelled: { amount: 0, count: 0 } }, isLoading: false, error: null } as any);
    vi.mocked(useInvoices).mockReturnValue({ data: [{ id: 2, totalAmount: '5.00', status: 'PENDING', createdAt: '2026-07-15T12:00:00Z', appointment: { pet: { name: 'Pet', tutor: { name: 'Tutor' } } }, payments: [] } as any], isLoading: false, error: null } as any);

    const user = userEvent.setup();
    render(<Financeiro />);
    expect(screen.queryByRole('button', { name: 'Desconto' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Registrar recebimento da fatura 2' }));
    const amount = screen.getByRole('textbox', { name: 'Valor recebido' });
    await user.type(amount, '0');
    expect(screen.getByRole('button', { name: 'Registrar recebimento' })).toBeDisabled();
    await user.clear(amount);
    await user.type(amount, '5,00');
    expect(screen.getByRole('button', { name: 'Registrar recebimento' })).toBeEnabled();
    expect(receive).not.toHaveBeenCalled();
  });
});
