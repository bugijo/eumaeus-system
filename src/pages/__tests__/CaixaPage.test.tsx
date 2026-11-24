import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CaixaPage from '../CaixaPage';
import { useProducts } from '../../api/productApi';
import { useResultCenters } from '../../api/financialApi';
import { saleApi, useCancelSale, useCreateSale, useSales } from '../../api/saleApi';

vi.mock('@/api/userApi', async (importOriginal) => ({ ...(await importOriginal<any>()), useMyAccess: () => ({ data: undefined }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/components/barcode/CameraBarcodeScanner', () => ({ default: () => null }));
vi.mock('../../api/productApi', () => ({ useProducts: vi.fn() }));
vi.mock('../../api/financialApi', () => ({ useResultCenters: vi.fn() }));
vi.mock('../../api/saleApi', () => ({
  saleApi: { byBarcode: vi.fn() },
  useSales: vi.fn(),
  useCreateSale: vi.fn(),
  useCancelSale: vi.fn(),
}));

const racao = { id: 1, name: 'Ração Premium 1kg', supplier: '', quantity: 10, costPrice: 30, salePrice: 49.9, barcode: '7891000100103', expirationDate: '' };
const petisco = { id: 2, name: 'Petisco Bifinho', supplier: '', quantity: 1, costPrice: 5, salePrice: 9.5, barcode: '7891000200200', expirationDate: '' };

describe('Caixa (PDV)', () => {
  const mutateAsync = vi.fn();

  beforeEach(() => {
    vi.mocked(useProducts).mockReturnValue({ data: [racao, petisco], isLoading: false } as any);
    vi.mocked(useResultCenters).mockReturnValue({ data: [] } as any);
    vi.mocked(useSales).mockReturnValue({ data: [] } as any);
    vi.mocked(useCancelSale).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any);
    mutateAsync.mockResolvedValue({ id: 9, number: 1, createdAt: new Date().toISOString(), status: 'COMPLETED', subtotal: '99.80', discount: '0', total: '99.80', change: '0.20', items: [], payments: [] });
    vi.mocked(useCreateSale).mockReturnValue({ mutateAsync, isPending: false } as any);
  });

  it('adiciona ao carrinho ao bipar o código (leitor USB = digitar + Enter) e soma o total', async () => {
    const user = userEvent.setup();
    render(<CaixaPage />);
    const scan = screen.getByLabelText('Código de barras ou nome do produto');
    await user.type(scan, '7891000100103{enter}');
    await user.type(scan, '7891000100103{enter}');
    expect(screen.getByText('Ração Premium 1kg')).toBeInTheDocument();
    expect(screen.getByText('Carrinho (2 itens)')).toBeInTheDocument();
    expect(screen.getAllByText(/99,80/).length).toBeGreaterThan(0);
    expect(saleApi.byBarcode).not.toHaveBeenCalled();
  });

  it('não deixa passar do estoque disponível', async () => {
    const user = userEvent.setup();
    render(<CaixaPage />);
    const scan = screen.getByLabelText('Código de barras ou nome do produto');
    await user.type(scan, '7891000200200{enter}');
    await user.type(scan, '7891000200200{enter}');
    expect(screen.getByText('Carrinho (1 itens)')).toBeInTheDocument();
  });

  it('finaliza com dinheiro e envia itens, pagamento e chave de idempotência', async () => {
    const user = userEvent.setup();
    render(<CaixaPage />);
    await user.type(screen.getByLabelText('Código de barras ou nome do produto'), '7891000100103{enter}');
    await user.click(screen.getByRole('button', { name: /Dinheiro/ }));
    const cash = screen.getByLabelText('Valor em Dinheiro');
    await user.clear(cash);
    await user.type(cash, '50');
    expect(screen.getByText('Troco')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Finalizar venda/ }));
    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      items: [{ productId: 1, quantity: 1, unitPrice: 49.9 }],
      payments: [{ method: 'DINHEIRO', amount: 50 }],
      idempotencyKey: expect.any(String),
    }));
  });
});
