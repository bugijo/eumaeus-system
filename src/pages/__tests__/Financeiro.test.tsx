import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Financeiro from '../Financeiro';
import { useApplyInvoiceDiscount, useFinancialStats, useInvoices } from '../../api/invoiceApi';
import { ACCOUNTS_PAYABLE_DATA_SOURCE } from '../../constants';
import { useCreateExpense, useExpenses, useReceivePayment, useResultCenters, useReversePayment } from '../../api/financialApi';
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
  useResultCenters: vi.fn(),
}));

describe('Financeiro', () => {
  it('uses only backend invoice values in real totals and hides demo expenses', () => {
    vi.mocked(useApplyInvoiceDiscount).mockReturnValue({ mutate: vi.fn() } as any);
    vi.mocked(useAuthStore).mockImplementation((selector: any) => selector({ user: { role: 'DONO' } }));
    vi.mocked(useReceivePayment).mockReturnValue({ mutate: vi.fn() } as any);
    vi.mocked(useReversePayment).mockReturnValue({ mutate: vi.fn() } as any);
    vi.mocked(useCreateExpense).mockReturnValue({ mutate: vi.fn(), isPending: false, isError: false } as any);
    vi.mocked(useExpenses).mockReturnValue({ data: [] } as any);
    vi.mocked(useResultCenters).mockReturnValue({ data: [] } as any);
    vi.mocked(useFinancialStats).mockReturnValue({
      data: {
        paid: { amount: 100, count: 1 },
        pending: { amount: 50, count: 1 },
        cancelled: { amount: 10, count: 1 },
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
});
