import { AsyncLocalStorage } from 'node:async_hooks';

type TenantContext = { clinicId: number; userId?: number };
const clinicStorage = new AsyncLocalStorage<TenantContext>();

export const runWithClinic = <T>(clinicId: number, callback: () => T): T =>
  clinicStorage.run({ clinicId }, callback);

export const runWithUser = <T>(userId: number, callback: () => T): T => {
  const current = clinicStorage.getStore();
  if (!current) throw new Error('Contexto da clínica ausente');
  return clinicStorage.run({ ...current, userId }, callback);
};

export const getCurrentClinicId = (): number | undefined => clinicStorage.getStore()?.clinicId;
export const getCurrentUserId = (): number | undefined => clinicStorage.getStore()?.userId;
