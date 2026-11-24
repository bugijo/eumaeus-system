import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';
import type { Product } from './productApi';

export type SalePaymentMethod = 'DINHEIRO' | 'PIX' | 'DEBITO' | 'CREDITO' | 'OUTRO';
export interface SaleItem { id: number; productId: number | null; description: string; barcode?: string | null; quantity: number; unitPrice: string; total: string; }
export interface SalePayment { id: number; method: SalePaymentMethod; amount: string; }
export interface Sale {
  id: number; number: number; createdAt: string; status: 'COMPLETED' | 'CANCELLED';
  subtotal: string; discount: string; total: string; change: string;
  resultCenterId?: number | null; resultCenter?: { id: number; code: string; name: string } | null;
  items: SaleItem[]; payments: SalePayment[]; cancelReason?: string | null;
}
export interface CreateSaleInput {
  items: Array<{ productId: number; quantity: number; unitPrice?: number }>;
  payments: Array<{ method: SalePaymentMethod; amount: number }>;
  discount?: number; resultCenterId?: number; idempotencyKey: string;
}

export const saleApi = {
  list: async (params: { from?: string; to?: string } = {}): Promise<Sale[]> => (await apiClient.get('/sales', { params })).data,
  create: async (data: CreateSaleInput): Promise<Sale> => (await apiClient.post('/sales', data)).data,
  cancel: async (id: number, reason: string): Promise<Sale> => (await apiClient.post(`/sales/${id}/cancel`, { reason })).data,
  byBarcode: async (code: string): Promise<Product> => (await apiClient.get(`/sales/barcode/${encodeURIComponent(code)}`)).data,
};

export const useSales = (params: { from?: string; to?: string } = {}) => useQuery({ queryKey: ['sales', params], queryFn: () => saleApi.list(params) });
export const useCreateSale = () => {
  const client = useQueryClient();
  return useMutation({ mutationFn: saleApi.create, onSuccess: () => { client.invalidateQueries({ queryKey: ['sales'] }); client.invalidateQueries({ queryKey: ['products'] }); client.invalidateQueries({ queryKey: ['cash'] }); } });
};
export const useCancelSale = () => {
  const client = useQueryClient();
  return useMutation({ mutationFn: ({ id, reason }: { id: number; reason: string }) => saleApi.cancel(id, reason), onSuccess: () => { client.invalidateQueries({ queryKey: ['sales'] }); client.invalidateQueries({ queryKey: ['products'] }); client.invalidateQueries({ queryKey: ['cash'] }); } });
};
