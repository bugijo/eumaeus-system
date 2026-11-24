import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';
import type { MyAccess, PermissionKey } from '@/lib/access';

export type StaffRole = 'DONO' | 'VETERINARIO' | 'RECEPCAO' | 'AUXILIAR' | 'BANHO_TOSA' | 'FINANCEIRO';
/** permissions: null = segue o padrão do cargo; lista = escolha do dono. */
export interface StaffUser { id: number; name: string; email: string | null; role: StaffRole | string; active: boolean; createdAt: string; permissions: PermissionKey[] | null; }
export interface StaffRoleInfo { name: StaffRole; description: string; defaultPermissions: PermissionKey[]; }

export const ROLE_LABELS: Record<string, string> = {
  DONO: 'Dono(a)', VETERINARIO: 'Veterinário(a)', RECEPCAO: 'Recepção', AUXILIAR: 'Auxiliar', BANHO_TOSA: 'Banho e tosa', FINANCEIRO: 'Financeiro', FUNCIONARIO: 'Recepção',
};

export const userApi = {
  list: async (): Promise<StaffUser[]> => (await apiClient.get<StaffUser[]>('/users')).data,
  roles: async (): Promise<StaffRoleInfo[]> => (await apiClient.get<StaffRoleInfo[]>('/users/roles')).data,
  myAccess: async (): Promise<MyAccess> => (await apiClient.get<MyAccess>('/users/me/access')).data,
  create: async (data: { name: string; email: string; role: StaffRole; password: string; permissions?: PermissionKey[] | null }): Promise<StaffUser> => (await apiClient.post<StaffUser>('/users', data)).data,
  update: async ({ id, ...data }: { id: number; name?: string; role?: StaffRole; active?: boolean; permissions?: PermissionKey[] | null }): Promise<StaffUser> => (await apiClient.patch<StaffUser>(`/users/${id}`, data)).data,
  resetPassword: async ({ id, password }: { id: number; password: string }) => (await apiClient.post<{ ok: boolean }>(`/users/${id}/password`, { password })).data,
  changeOwnPassword: async (data: { currentPassword: string; newPassword: string }) => (await apiClient.post<{ ok: boolean }>('/users/me/password', data)).data,
};

export const useStaffUsers = (enabled = true) => useQuery({ queryKey: ['staff-users'], queryFn: userApi.list, enabled });
/** Plano e permissões de quem está logado. Recarrega a cada 60 s para refletir mudanças do dono. */
export const useMyAccess = (enabled = true) => useQuery({ queryKey: ['my-access'], queryFn: userApi.myAccess, staleTime: 60_000, enabled });
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
