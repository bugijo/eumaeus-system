import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

// Cache simples no frontend para reduzir requisições
const queryCache = new Map<string, { data: any; timestamp: number; ttl: number }>();

interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  queryKey: string[];
  queryFn: () => Promise<T>;
  cacheTTL?: number; // Time to live em milliseconds
  enableFrontendCache?: boolean;
}

export function useOptimizedQuery<T>(options: OptimizedQueryOptions<T>) {
  const {
    queryKey,
    queryFn,
    cacheTTL = 5 * 60 * 1000, // 5 minutos por padrão
    enableFrontendCache = true,
    ...queryOptions
  } = options;

  const cacheKey = queryKey.join('-');
  const abortControllerRef = useRef<AbortController | null>(null);

  const optimizedQueryFn = useCallback(async () => {
    // Verificar cache frontend primeiro
    if (enableFrontendCache) {
      const cached = queryCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
      }
    }

    // Cancelar requisição anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Criar novo AbortController
    abortControllerRef.current = new AbortController();

    try {
      const data = await queryFn();
      
      // Salvar no cache frontend
      if (enableFrontendCache) {
        queryCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl: cacheTTL
        });
      }

      return data;
    } catch (error) {
      // Se foi cancelado, não propagar o erro
      if (error instanceof Error && error.name === 'AbortError') {
        return Promise.reject(new Error('Request cancelled'));
      }
      throw error;
    }
  }, [queryFn, cacheKey, cacheTTL, enableFrontendCache]);

  return useQuery({
    queryKey,
    queryFn: optimizedQueryFn,
    staleTime: cacheTTL / 2, // Considerar stale após metade do TTL
    cacheTime: cacheTTL, // Manter no cache do React Query
    refetchOnWindowFocus: false, // Não refetch ao focar janela
    refetchOnMount: false, // Não refetch ao montar se tem cache
    retry: (failureCount, error) => {
      // Não retry se foi cancelado
      if (error instanceof Error && error.message === 'Request cancelled') {
        return false;
      }
      // Retry até 2 vezes para outros erros
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...queryOptions
  });
}

// Hook específico para dashboard com cache otimizado
export function useDashboardQuery<T>(
  endpoint: string,
  queryFn: () => Promise<T>,
  options?: Partial<OptimizedQueryOptions<T>>
) {
  return useOptimizedQuery({
    queryKey: ['dashboard', endpoint],
    queryFn,
    cacheTTL: 5 * 60 * 1000, // 5 minutos para dashboard
    enableFrontendCache: true,
    ...options
  });
}

// Função para limpar cache manualmente
export function clearQueryCache(pattern?: string) {
  if (pattern) {
    for (const key of queryCache.keys()) {
      if (key.includes(pattern)) {
        queryCache.delete(key);
      }
    }
  } else {
    queryCache.clear();
  }
}

// Função para pré-carregar dados
export function prefetchData<T>(cacheKey: string, queryFn: () => Promise<T>, ttl = 5 * 60 * 1000) {
  queryFn().then(data => {
    queryCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }).catch(error => {
    console.warn('Prefetch failed:', error);
  });
}