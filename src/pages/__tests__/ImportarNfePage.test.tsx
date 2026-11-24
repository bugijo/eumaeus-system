import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ImportarNfePage, { initialDecisions, lineProblem, stockUnits } from '../ImportarNfePage';
import type { NfePreview } from '@/api/purchaseInvoiceApi';

const previewMock = vi.fn();
const importMock = vi.fn();
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/api/productApi', () => ({ useProducts: () => ({ data: [{ id: 7, name: 'Ração Premium 15kg', barcode: '7891000100103' }, { id: 8, name: 'Shampoo', barcode: null }] }) }));
vi.mock('@/api/financialApi', () => ({ useResultCenters: () => ({ data: [{ id: 1, name: 'Pet shop', code: 'PET', active: true }] }) }));
vi.mock('@/api/userApi', () => ({ useMyAccess: () => ({ data: { permissions: ['estoque_movimentar', 'financeiro'] } }) }));
vi.mock('@/api/purchaseInvoiceApi', () => ({
  purchaseInvoiceApi: { downloadXml: vi.fn() },
  useNfeImports: () => ({ data: [] }),
  useNfePreview: () => ({ mutateAsync: previewMock, isPending: false }),
  useNfeImport: () => ({ mutateAsync: importMock, isPending: false }),
}));

const PREVIEW: NfePreview = {
  accessKey: '35261112345678000199550010000012341000012345', number: '1234', series: '1', issuedAt: '2026-11-20T13:30:00.000Z',
  supplier: { document: '12345678000199', name: 'Distribuidora Pet Ltda', tradeName: 'PetDist' }, recipientDocument: '11222333000181',
  total: '400.00', authorized: true, warnings: [], alreadyImported: null,
  lines: [
    { nItem: 1, code: 'RAC-01', ean: '7891000100103', name: 'RACAO PREMIUM 15KG', ncm: null, unit: 'UN', quantity: 2, unitCost: 150, total: '300.00', anvisa: null, lots: [],
      suggestion: { productId: 7, productName: 'Ração Premium 15kg', unitsPerPackage: 1, source: 'codigo_barras' } },
    { nItem: 2, code: 'VERM-9', ean: null, name: 'VERMIFUGO CX', ncm: null, unit: 'CX', quantity: 1, unitCost: 100, total: '100.00', anvisa: null,
      lots: [{ code: 'L123', quantity: 1, expiresAt: '2027-06-30T12:00:00.000Z', manufacturedAt: null }], suggestion: null },
  ],
};

describe('regras da importação', () => {
  it('stockUnits exige inteiro positivo', () => {
    expect(stockUnits(2, 12)).toBe(24);
    expect(stockUnits(1.5, 1)).toBeNull();
    expect(stockUnits(1, 0)).toBeNull();
  });
  it('sugestão vira vínculo; sem sugestão, cria produto', () => {
    const decisions = initialDecisions(PREVIEW);
    expect(decisions[1]).toMatchObject({ action: 'link', productId: 7, unitsPerPackage: 1 });
    expect(decisions[2]).toMatchObject({ action: 'create', name: 'VERMIFUGO CX' });
    expect(lineProblem(PREVIEW.lines[0], { nItem: 1, action: 'link', unitsPerPackage: 1 })).toMatch(/escolha o produto/);
    expect(lineProblem(PREVIEW.lines[1], { nItem: 2, action: 'skip', unitsPerPackage: 0 })).toBeNull();
  });
});

describe('ImportarNfePage', () => {
  beforeEach(() => {
    previewMock.mockReset().mockResolvedValue(PREVIEW);
    importMock.mockReset().mockResolvedValue({ id: 1, number: '1234', supplierName: 'Distribuidora Pet Ltda', total: '400.00', expenseId: 9, received: 2, created: 1, skipped: 0, units: 14 });
  });

  const upload = async () => {
    render(<MemoryRouter><ImportarNfePage /></MemoryRouter>);
    const file = new File(['<nfeProc/>'], 'nota.xml', { type: 'text/xml' });
    fireEvent.change(document.getElementById('nfe-file')!, { target: { files: [file] } });
    await screen.findByText('PetDist');
  };

  it('lê o XML, mostra os itens e envia as decisões', async () => {
    await upload();
    expect(previewMock).toHaveBeenCalledWith('<nfeProc/>');
    expect(screen.getByText(/encontrado pelo código de barras/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Unidades por CX'), { target: { value: '12' } });
    expect(screen.getByText('Entram 12 un. no estoque.')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/como despesa no Financeiro/));
    fireEvent.change(screen.getByLabelText('Centro de resultado'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Dar entrada em 2 itens' }));
    await waitFor(() => expect(importMock).toHaveBeenCalled());
    expect(importMock.mock.calls[0][0]).toMatchObject({
      xml: '<nfeProc/>', updateCost: true, createExpense: true, resultCenterId: 1,
      lines: [{ nItem: 1, action: 'link', productId: 7, unitsPerPackage: 1 }, { nItem: 2, action: 'create', unitsPerPackage: 12, name: 'VERMIFUGO CX' }],
    });
    expect(await screen.findByText('NF-e 1234 importada')).toBeInTheDocument();
  });

  it('nota já importada bloqueia a confirmação', async () => {
    previewMock.mockResolvedValue({ ...PREVIEW, alreadyImported: { id: 3, at: '2026-11-21T10:00:00.000Z', by: 'Ana' } });
    await upload();
    expect(screen.getByRole('alert')).toHaveTextContent(/já foi importada/);
    expect(screen.queryByRole('button', { name: /Dar entrada/ })).not.toBeInTheDocument();
  });

  it('quantidade fracionada impede a confirmação', async () => {
    await upload();
    fireEvent.change(screen.getByLabelText('Unidades por CX'), { target: { value: '0' } });
    expect(screen.getByRole('button', { name: 'Dar entrada em 2 itens' })).toBeDisabled();
  });
});
