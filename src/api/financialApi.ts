import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';

export interface ResultCenter { id: number; code: string; name: string; active: boolean; }
export interface Payment { id: number; amount: number | string; method: string; status: string; receivedAt: string; reversalReason?: string | null; }
export interface Expense { id: number; description: string; amount: number | string; reason: string; resultCenter?: ResultCenter | null; incurredAt: string; }

export const financialApi = {
  centers: async (): Promise<ResultCenter[]> => (await apiClient.get('/financial/centers')).data,
  receive: async (invoiceId: number, amount: number, method: string, idempotencyKey: string): Promise<Payment> => (await apiClient.post(`/financial/invoices/${invoiceId}/payments`, { amount, method, idempotencyKey })).data,
  reverse: async (paymentId: number, reason: string): Promise<Payment> => (await apiClient.post(`/financial/payments/${paymentId}/reverse`, { reason })).data,
  expenses: async (): Promise<Expense[]> => (await apiClient.get('/financial/expenses')).data,
  createExpense: async (data: { description: string; amount: number; resultCenterId?: number; reason: string }): Promise<Expense> => (await apiClient.post('/financial/expenses', data)).data,
};

export const useResultCenters = () => useQuery({ queryKey: ['financial', 'centers'], queryFn: financialApi.centers });
export const useReceivePayment = () => { const client = useQueryClient(); return useMutation({ mutationFn: ({ invoiceId, amount, method }: { invoiceId: number; amount: number; method: string }) => financialApi.receive(invoiceId, amount, method, `ui-payment-${invoiceId}-${amount}-${method}`), onSuccess: () => { client.invalidateQueries({ queryKey: ['invoices'] }); client.invalidateQueries({ queryKey: ['financial-stats'] }); } }); };
export const useReversePayment = () => { const client = useQueryClient(); return useMutation({ mutationFn: ({ paymentId, reason }: { paymentId: number; reason: string }) => financialApi.reverse(paymentId, reason), onSuccess: () => { client.invalidateQueries({ queryKey: ['invoices'] }); client.invalidateQueries({ queryKey: ['financial-stats'] }); } }); };
export const useExpenses = () => useQuery({ queryKey: ['financial', 'expenses'], queryFn: financialApi.expenses });
export const useCreateExpense = () => { const client = useQueryClient(); return useMutation({ mutationFn: financialApi.createExpense, onSuccess: () => client.invalidateQueries({ queryKey: ['financial', 'expenses'] }) }); };
