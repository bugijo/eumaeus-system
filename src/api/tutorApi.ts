import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TutorService } from '../services/tutorService';
import type { 
  Tutor, 
  CreateTutorData, 
  UpdateTutorData, 
  TutorSearchParams,
  PaginatedResponse 
} from '../types';

// Query Keys
export const tutorKeys = {
  all: ['tutors'] as const,
  lists: () => [...tutorKeys.all, 'list'] as const,
  list: (params?: TutorSearchParams) => [...tutorKeys.lists(), params] as const,
  details: () => [...tutorKeys.all, 'detail'] as const,
  detail: (id: number) => [...tutorKeys.details(), id] as const,
  stats: () => [...tutorKeys.all, 'stats'] as const,
};

// Hooks para queries
export function useTutors(params?: TutorSearchParams) {
  return useQuery({
    queryKey: tutorKeys.list(params),
    queryFn: () => TutorService.findAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

export function useTutor(id: number) {
  return useQuery({
    queryKey: tutorKeys.detail(id),
    queryFn: () => TutorService.findById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useTutorStats() {
  return useQuery({
    queryKey: tutorKeys.stats(),
    queryFn: () => TutorService.getStats(),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  });
}

// Hooks para mutations
export function useCreateTutor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateTutorData) => TutorService.create(data),
    onSuccess: (newTutor) => {
      // Invalidar listas de tutores
      queryClient.invalidateQueries({ queryKey: tutorKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tutorKeys.stats() });
      
      // Adicionar o novo tutor ao cache
      queryClient.setQueryData(tutorKeys.detail(newTutor.id), newTutor);
    },
    onError: (error) => {
      console.error('Erro ao criar tutor:', error);
    },
  });
}

export function useUpdateTutor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTutorData }) => 
      TutorService.update(id, data),
    onSuccess: (updatedTutor) => {
      // Atualizar o tutor específico no cache
      queryClient.setQueryData(tutorKeys.detail(updatedTutor.id), updatedTutor);
      
      // Invalidar listas para refletir as mudanças
      queryClient.invalidateQueries({ queryKey: tutorKeys.lists() });
      
      // Atualizar listas existentes no cache
      queryClient.setQueriesData(
        { queryKey: tutorKeys.lists() },
        (oldData: PaginatedResponse<Tutor> | undefined) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            data: oldData.data.map(tutor => 
              tutor.id === updatedTutor.id ? updatedTutor : tutor
            )
          };
        }
      );
    },
    onError: (error) => {
      console.error('Erro ao atualizar tutor:', error);
    },
  });
}

export function useDeleteTutor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => TutorService.delete(id),
    onSuccess: (_, deletedId) => {
      // Remover o tutor do cache
      queryClient.removeQueries({ queryKey: tutorKeys.detail(deletedId) });
      
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: tutorKeys.lists() });
      queryClient.invalidateQueries({ queryKey: tutorKeys.stats() });
      
      // Atualizar listas existentes no cache
      queryClient.setQueriesData(
        { queryKey: tutorKeys.lists() },
        (oldData: PaginatedResponse<Tutor> | undefined) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            data: oldData.data.filter(tutor => tutor.id !== deletedId),
            total: oldData.total - 1
          };
        }
      );
    },
    onError: (error) => {
      console.error('Erro ao excluir tutor:', error);
    },
  });
}

// Hook para buscar tutor por email
export function useTutorByEmail(email: string) {
  return useQuery({
    queryKey: [...tutorKeys.all, 'email', email],
    queryFn: () => TutorService.findByEmail(email),
    enabled: !!email && email.includes('@'),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Função utilitária para prefetch
export function prefetchTutor(queryClient: ReturnType<typeof useQueryClient>, id: number) {
  return queryClient.prefetchQuery({
    queryKey: tutorKeys.detail(id),
    queryFn: () => TutorService.findById(id),
    staleTime: 5 * 60 * 1000,
  });
}

// Função utilitária para invalidar todas as queries de tutores
export function invalidateTutorQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: tutorKeys.all });
}