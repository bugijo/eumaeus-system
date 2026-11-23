import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';

export type StaffRole = 'DONO' | 'VETERINARIO' | 'RECEPCAO' | 'AUXILIAR' | 'FINANCEIRO';
export interface StaffUser { id: number; name: string; email: string | null; role: StaffRole | string; active: boolean; createdAt: string; }
export interface StaffRoleInfo { name: StaffRole; description: string; }

export const ROLE_LABELS: Record<string, string> = {
  DONO: 'Dono(a)', VETERINARIO: 'Veterinário(a)', RECEPCAO: 'Recepção', AUXILIAR: 'Auxiliar', FINANCEIRO: 'Financeiro', FUNCIONARIO: 'Recepção',
};

export const userApi = {
  list: async (): Promise<StaffUser[]> => (await apiClient.get<StaffUser[]>('/users')).data,
  roles: async (): Promise<StaffRoleInfo[]> => (await apiClient.get<StaffRoleInfo[]>('/users/roles')).data,
  create: async (data: { name: string; email: string; role: StaffRole; password: string }): Promise<StaffUser> => (await apiClient.post<StaffUser>('/users', data)).data,
  update: async ({ id, ...data }: { id: number; name?: string; role?: StaffRole; active?: boolean }): Promise<StaffUser> => (await apiClient.patch<StaffUser>(`/users/${id}`, data)).data,
  resetPassword: async ({ id, password }: { id: number; password: string }) => (await apiClient.post<{ ok: boolean }>(`/users/${id}/password`, { password })).data,
  changeOwnPassword: async (data: { currentPassword: string; newPassword: string }) => (await apiClient.post<{ ok: boolean }>('/users/me/password', data)).data,
};

export const useStaffUsers = (enabled = true) => useQuery({ queryKey: ['staff-users'], queryFn: userApi.list, enabled });
export const useStaffRoles = () => useQuery({ queryKey: ['staff-roles'], queryFn: userApi.roles, staleTime: Infinity });
const useInvalidating = <T,>(fn: (input: T) => Promise<unknown>) => {
  const client = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => client.invalidateQueries({ queryKey: ['staff-users'] }) });
};
export const useCreateStaffUser = () => useInvalidating(userApi.create);
export const useUpdateStaffUser = () => useInvalidating(userApi.update);
export const useResetStaffPassword = () => useMutation({ mutationFn: userApi.resetPassword });
export const useChangeOwnPassword = () => useMutation({ mutationFn: userApi.changeOwnPassword });

/** Mensagem do servidor (ex.: 409 "Já existe um acesso com este e-mail") ou genérica. */
export const apiErrorMessage = (error: unknown, fallback = 'Não foi possível concluir') =>
  (error as any)?.response?.data?.error || (error as any)?.response?.data?.message || fallback;
