import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';

export interface SpecialistAvailability { id: number; weekday: number; startTime: string; endTime: string; active: boolean; }
export interface SpecialistProfile { id: number; userId: number; specialty: string; registration?: string | null; repasseRate?: number | string | null; active: boolean; availabilities: SpecialistAvailability[]; user?: { name?: string; email?: string }; }
export interface SpecialistAssignment { id: number; appointmentId: number; specialistId: number; status: string; confirmedAt?: string | null; }

export const specialistApi = {
  list: async (): Promise<SpecialistProfile[]> => (await apiClient.get('/specialists')).data,
  create: async (data: { userId: number; specialty: string; registration?: string; repasseRate?: number }) => (await apiClient.post('/specialists', data)).data,
  availability: async (id: number, data: { weekday: number; startTime: string; endTime: string }) => (await apiClient.post(`/specialists/${id}/availability`, data)).data,
  assign: async (data: { appointmentId: number; specialistId: number }) => (await apiClient.post('/specialists/assignments', data)).data as SpecialistAssignment,
  confirm: async (id: number) => (await apiClient.patch(`/specialists/assignments/${id}/confirm`)).data as SpecialistAssignment,
};

export const useSpecialists = () => useQuery({ queryKey: ['specialists'], queryFn: specialistApi.list });
export const useCreateSpecialist = () => { const client = useQueryClient(); return useMutation({ mutationFn: specialistApi.create, onSuccess: () => client.invalidateQueries({ queryKey: ['specialists'] }) }); };
export const useAddSpecialistAvailability = () => { const client = useQueryClient(); return useMutation({ mutationFn: ({ id, ...data }: { id: number; weekday: number; startTime: string; endTime: string }) => specialistApi.availability(id, data), onSuccess: () => client.invalidateQueries({ queryKey: ['specialists'] }) }); };
export const useAssignSpecialist = () => useMutation({ mutationFn: specialistApi.assign });
export const useConfirmSpecialistAssignment = () => useMutation({ mutationFn: specialistApi.confirm });
