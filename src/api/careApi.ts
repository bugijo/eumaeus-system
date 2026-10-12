import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';

export interface Hospitalization { id: number; petId: number; responsibleUserId: number; status: string; admittedAt: string; observations?: string | null; pet?: { name: string }; tasks?: Array<{ id: number; title: string; status: string; notes?: string | null }>; prescriptions?: Array<{ id: number; medication: string; instructions: string; createdById?: number | null; createdAt?: string }> }
export interface SurgeryCase { id: number; petId: number; veterinarianId: number; status: string; scheduledAt?: string | null; notes?: string | null; pet?: { name: string }; budgets: Array<{ id: number; version: number; amount: string; description: string }> }

export const careApi = {
  listAdmissions: async () => (await apiClient.get<Hospitalization[]>('/care/hospitalizations')).data,
  admit: async (data: { petId: number; responsibleUserId: number; observations?: string }) => (await apiClient.post<Hospitalization>('/care/hospitalizations', data)).data,
  listSurgeries: async () => (await apiClient.get<SurgeryCase[]>('/care/surgeries')).data,
  createSurgery: async (data: { petId: number; veterinarianId: number; notes?: string }) => (await apiClient.post<SurgeryCase>('/care/surgeries', data)).data,
  addTask: async (id: number, data: { title: string; scheduledAt?: string; notes?: string }) => (await apiClient.post(`/care/hospitalizations/${id}/tasks`, data)).data,
  executeTask: async (id: number, data: { notes?: string }) => (await apiClient.patch(`/care/hospitalization-tasks/${id}/execute`, data)).data,
  addPrescription: async (id: number, data: { medication: string; instructions: string; createdById: number }) => (await apiClient.post(`/care/hospitalizations/${id}/prescriptions`, data)).data,
  discharge: async (id: number, data: { notes: string }) => (await apiClient.patch(`/care/hospitalizations/${id}/discharge`, data)).data,
  handoff: async (id: number, data: { toUserId: number; notes: string }) => (await apiClient.post(`/care/hospitalizations/${id}/handoffs`, data)).data,
  addBudget: async (id: number, data: { description: string; amount: string }) => (await apiClient.post(`/care/surgeries/${id}/budgets`, data)).data,
  addConsent: async (id: number, data: { budgetVersionId: number; notes?: string }) => (await apiClient.post(`/care/surgeries/${id}/consents`, data)).data,
  addChecklist: async (id: number, data: { label: string; notes?: string }) => (await apiClient.post(`/care/surgeries/${id}/checklist`, data)).data,
  completeChecklist: async (id: number, data: { notes?: string }) => (await apiClient.patch(`/care/surgery-checklist/${id}/complete`, data)).data,
  addInstruction: async (id: number, data: { instruction: string }) => (await apiClient.post(`/care/surgeries/${id}/instructions`, data)).data,
  approveInstruction: async (id: number) => (await apiClient.patch(`/care/surgery-instructions/${id}/approve`)).data,
};

export const useAdmissions = () => useQuery({ queryKey: ['care', 'hospitalizations'], queryFn: careApi.listAdmissions });
export const useSurgeries = () => useQuery({ queryKey: ['care', 'surgeries'], queryFn: careApi.listSurgeries });
export const useAdmit = () => { const qc = useQueryClient(); return useMutation({ mutationFn: careApi.admit, onSuccess: () => qc.invalidateQueries({ queryKey: ['care', 'hospitalizations'] }) }); };
export const useCreateSurgery = () => { const qc = useQueryClient(); return useMutation({ mutationFn: careApi.createSurgery, onSuccess: () => qc.invalidateQueries({ queryKey: ['care', 'surgeries'] }) }); };
