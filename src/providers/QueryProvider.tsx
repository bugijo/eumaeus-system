'use client';

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { config } from '@/config/env';

// Configuração do QueryClient
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Tempo de cache padrão (5 minutos)
        staleTime: config.cache.ttl,
        // Tempo para manter dados em cache quando não há observadores (10 minutos)
        gcTime: config.cache.ttl * 2,
        // Retry automático em caso de erro
        retry: (failureCount, error: any) => {
          // Não retry para erros 4xx (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          // Retry até 3 vezes para outros erros
          return failureCount < 3;
        },
        // Intervalo entre retries (exponential backoff)
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Refetch quando a janela ganha foco
        refetchOnWindowFocus: false,
        // Refetch quando reconecta à internet
        refetchOnReconnect: true,
        // Refetch quando o componente é montado
        refetchOnMount: true,
      },
      mutations: {
        // Retry para mutations apenas em caso de erro de rede
        retry: (failureCount, error: any) => {
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          return failureCount < 2;
        },
        // Intervalo entre retries para mutations
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      },
    },
  });
}

let clientQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: sempre cria um novo query client
    return createQueryClient();
  } else {
    // Browser: cria o query client uma vez
    if (!clientQueryClient) {
      clientQueryClient = createQueryClient();
    }
    return clientQueryClient;
  }
}

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {config.isDevelopment && config.development.enableDevtools && (
        <ReactQueryDevtools 
          initialIsOpen={false}
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}

// Hook para acessar o QueryClient
export function useQueryClient() {
  const client = getQueryClient();
  return client;
}

// Utilitários para invalidação de cache
export const queryUtils = {
  // Invalida todas as queries
  invalidateAll: (queryClient: QueryClient) => {
    return queryClient.invalidateQueries();
  },
  
  // Invalida queries por chave
  invalidateByKey: (queryClient: QueryClient, queryKey: string[]) => {
    return queryClient.invalidateQueries({ queryKey });
  },
  
  // Remove queries do cache
  removeQueries: (queryClient: QueryClient, queryKey: string[]) => {
    return queryClient.removeQueries({ queryKey });
  },
  
  // Limpa todo o cache
  clearCache: (queryClient: QueryClient) => {
    return queryClient.clear();
  },
  
  // Prefetch de dados
  prefetch: async (queryClient: QueryClient, queryKey: string[], queryFn: () => Promise<any>) => {
    return queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: config.cache.ttl,
    });
  },
  
  // Define dados no cache manualmente
  setQueryData: (queryClient: QueryClient, queryKey: string[], data: any) => {
    return queryClient.setQueryData(queryKey, data);
  },
  
  // Obtém dados do cache
  getQueryData: (queryClient: QueryClient, queryKey: string[]) => {
    return queryClient.getQueryData(queryKey);
  },
};

// Hook para utilitários de cache
export function useQueryUtils() {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => queryUtils.invalidateAll(queryClient),
    invalidateByKey: (queryKey: string[]) => queryUtils.invalidateByKey(queryClient, queryKey),
    removeQueries: (queryKey: string[]) => queryUtils.removeQueries(queryClient, queryKey),
    clearCache: () => queryUtils.clearCache(queryClient),
    prefetch: (queryKey: string[], queryFn: () => Promise<any>) => 
      queryUtils.prefetch(queryClient, queryKey, queryFn),
    setQueryData: (queryKey: string[], data: any) => 
      queryUtils.setQueryData(queryClient, queryKey, data),
    getQueryData: (queryKey: string[]) => 
      queryUtils.getQueryData(queryClient, queryKey),
  };
}