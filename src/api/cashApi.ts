import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';

export interface CashSummary {
  salesCount: number; cancelledCount: number; salesTotal: string;
  byMethod: Record<string, string>; suprimentos: string; sangrias: string; opening: string; expectedCash: string;
}
export interface CashMovement { id: number; type: 'SANGRIA' | 'SUPRIMENTO'; amount: string; reason: string; createdAt: string; createdBy: string | null }
export interface CashSession {
  id: number; status: 'OPEN' | 'CLOSED'; openedAt: string; openedBy: string | null; closedAt: string | null; closedBy: string | null;
  countedCash: string | null; difference: string | null; closingNote: string | null; movements: CashMovement[]; summary: CashSummary;
}

export const cashApi = {
  current: async () => (await apiClient.get<CashSession | null>('/cash/current')).data,
  history: async (limit = 10) => (await apiClient.get<CashSession[]>('/cash/sessions', { params: { limit } })).data,
  open: async (openingAmount: number) => (await apiClient.post<CashSession>('/cash/open', { openingAmount })).data,
  movement: async (input: { type: 'SANGRIA' | 'SUPRIMENTO'; amount: number; reason: string }) => (await apiClient.post<CashSession>('/cash/movements', input)).data,
  close: async (input: { countedCash: number; note?: string }) => (await apiClient.post<CashSession>('/cash/close', input)).data,
};

export const useCurrentCash = () => useQuery({ queryKey: ['cash', 'current'], queryFn: cashApi.current });
export const useCashHistory = (limit = 10) => useQuery({ queryKey: ['cash', 'history', limit], queryFn: () => cashApi.history(limit) });

const useCashMutation = <T,>(fn: (input: T) => Promise<CashSession>) => {
  const client = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => client.invalidateQueries({ queryKey: ['cash'] }) });
};
export const useOpenCash = () => useCashMutation(cashApi.open);
export const useCashMovement = () => useCashMutation(cashApi.movement);
export const useCloseCash = () => useCashMutation(cashApi.close);
