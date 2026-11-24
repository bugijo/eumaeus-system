import { describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { clearSessionCaches, registerSessionCacheClearer } from '@/lib/sessionCache';
import { useAuthStore } from '@/stores/authStore';

describe('limpeza de caches na troca de sessão', () => {
  it('logout e login descartam os dados da sessão anterior', () => {
    const client = new QueryClient();
    client.setQueryData(['dashboard', 'stats'], { clinic: 'A', tutorCount: 11 });
    const unregister = registerSessionCacheClearer(() => client.clear());
    const moduleCache = vi.fn();
    const unregisterModule = registerSessionCacheClearer(moduleCache);

    useAuthStore.getState().login('t1', 'r1', { id: 1, name: 'A', email: 'a@example.invalid', type: 'user' });
    client.setQueryData(['dashboard', 'stats'], { clinic: 'A', tutorCount: 11 });
    useAuthStore.getState().logout();
    expect(client.getQueryData(['dashboard', 'stats'])).toBeUndefined();

    client.setQueryData(['dashboard', 'stats'], { clinic: 'A', tutorCount: 11 });
    useAuthStore.getState().login('t2', 'r2', { id: 2, name: 'B', email: 'b@example.invalid', type: 'user' });
    expect(client.getQueryData(['dashboard', 'stats'])).toBeUndefined();
    expect(moduleCache).toHaveBeenCalledTimes(3);

    unregister();
    unregisterModule();
  });

  it('um cache com erro não impede a limpeza dos demais e remove os logs locais', () => {
    const other = vi.fn();
    const u1 = registerSessionCacheClearer(() => { throw new Error('falha'); });
    const u2 = registerSessionCacheClearer(other);
    const removeItem = vi.spyOn(globalThis.localStorage, 'removeItem');
    clearSessionCaches();
    expect(other).toHaveBeenCalled();
    expect(removeItem).toHaveBeenCalledWith('app_logs');
    removeItem.mockRestore();
    u1(); u2();
  });
});
