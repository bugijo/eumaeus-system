import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';

export interface ResultCenter { id: number; code: string; name: string; active: boolean; }
export interface Payment { id: number; amount: number | string; method: string; status: string; receivedAt: string; reversalReason?: string | null; }
export interface Expense { id: number; description: string; amount: number | string; reason: string; resultCenter?: ResultCenter | null; incurredAt: string; }
export interface AccountingExport { generatedAt: string; period: { from: string; to: string }; clinicId: number; resultCenters: ResultCenter[]; totals: Record<string, string>; counts: { invoices: number; payments: number; expenses: number }; pendencies: { unclassifiedExpenses: number; missingFiscalDocuments: number }; invoices: Array<Record<string, unknown>>; expenses: Array<Record<string, unknown>>; }

export const financialApi = {
  centers: async (): Promise<ResultCenter[]> => (await apiClient.get('/financial/centers')).data,
  createCenter: async (data: { code: string; name: string }): Promise<ResultCenter> => (await apiClient.post('/financial/centers', data)).data,
  receive: async (invoiceId: number, amount: string, method: string, idempotencyKey: string): Promise<Payment> => (await apiClient.post(`/financial/invoices/${invoiceId}/payments`, { amount, method, idempotencyKey })).data,
  reverse: async (paymentId: number, reason: string): Promise<Payment> => (await apiClient.post(`/financial/payments/${paymentId}/reverse`, { reason })).data,
  expenses: async (): Promise<Expense[]> => (await apiClient.get('/financial/expenses')).data,
  createExpense: async (data: { description: string; amount: string; resultCenterId?: number; reason: string }): Promise<Expense> => (await apiClient.post('/financial/expenses', data)).data,
  prepareAccountingExport: async (data: { from: string; to: string; resultCenterIds: number[] }): Promise<AccountingExport> => (await apiClient.post('/financial/accounting/prepare', data)).data,
  downloadAccountingPdf: async (data: { from: string; to: string; resultCenterIds: number[] }) => (await apiClient.post('/financial/accounting/pdf', data, { responseType: 'blob' })).data as Blob,
  prepareAccountingShare: async (data: { from: string; to: string; resultCenterIds: number[]; recipient: string }) => (await apiClient.post('/financial/accounting/share', data)).data,
  queueAccountingShare: async (shareId: number) => (await apiClient.post(`/financial/accounting/share/${shareId}/queue`)).data,
};

export const useResultCenters = () => useQuery({ queryKey: ['financial', 'centers'], queryFn: financialApi.centers });
export const useCreateResultCenter = () => { const client = useQueryClient(); return useMutation({ mutationFn: financialApi.createCenter, onSuccess: () => client.invalidateQueries({ queryKey: ['financial', 'centers'] }) }); };
export const useReceivePayment = () => { const client = useQueryClient(); return useMutation({ mutationFn: ({ invoiceId, amount, method, idempotencyKey }: { invoiceId: number; amount: string; method: string; idempotencyKey: string }) => financialApi.receive(invoiceId, amount, method, idempotencyKey), onSuccess: () => { client.invalidateQueries({ queryKey: ['invoices'] }); client.invalidateQueries({ queryKey: ['financial-stats'] }); } }); };
export const useReversePayment = () => { const client = useQueryClient(); return useMutation({ mutationFn: ({ paymentId, reason }: { paymentId: number; reason: string }) => financialApi.reverse(paymentId, reason), onSuccess: () => { client.invalidateQueries({ queryKey: ['invoices'] }); client.invalidateQueries({ queryKey: ['financial-stats'] }); } }); };
export const useExpenses = () => useQuery({ queryKey: ['financial', 'expenses'], queryFn: financialApi.expenses });
export const useCreateExpense = () => { const client = useQueryClient(); return useMutation({ mutationFn: financialApi.createExpense, onSuccess: () => client.invalidateQueries({ queryKey: ['financial', 'expenses'] }) }); };
