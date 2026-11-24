/**
 * Caches de dados ligados à sessão (React Query, cache em memória do dashboard, logs locais).
 * Na troca de identidade (login/logout) tudo é descartado: antes, ao sair e entrar com outra conta
 * na mesma aba, o dashboard mostrava os números e agendamentos da sessão anterior.
 * Registro em vez de import direto para não criar dependência circular com o authStore.
 */
type Clearer = () => void;

const clearers = new Set<Clearer>();

export function registerSessionCacheClearer(clearer: Clearer): () => void {
  clearers.add(clearer);
  return () => clearers.delete(clearer);
}

export function clearSessionCaches(): void {
  for (const clearer of clearers) {
    try { clearer(); } catch { /* um cache com erro não impede a limpeza dos outros */ }
  }
  try { globalThis.localStorage?.removeItem('app_logs'); } catch { /* armazenamento indisponível */ }
}
