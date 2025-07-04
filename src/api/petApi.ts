import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PetService } from '../services/petService';
import type { 
  Pet, 
  CreatePetData, 
  UpdatePetData, 
  PetSearchParams,
  PaginatedResponse 
} from '../types';
import { tutorKeys } from './tutorApi';

// Query Keys
export const petKeys = {
  all: ['pets'] as const,
  lists: () => [...petKeys.all, 'list'] as const,
  list: (params?: PetSearchParams) => [...petKeys.lists(), params] as const,
  details: () => [...petKeys.all, 'detail'] as const,
  detail: (id: number) => [...petKeys.details(), id] as const,
  byTutor: (tutorId: number) => [...petKeys.all, 'tutor', tutorId] as const,
  stats: () => [...petKeys.all, 'stats'] as const,
  speciesStats: () => [...petKeys.stats(), 'species'] as const,
  ageStats: () => [...petKeys.stats(), 'age'] as const,
};

// Hooks para queries
export function usePets(params?: PetSearchParams) {
  return useQuery({
    queryKey: petKeys.list(params),
    queryFn: () => PetService.findAll(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

export function usePet(id: number) {
  return useQuery({
    queryKey: petKeys.detail(id),
    queryFn: () => PetService.findById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function usePetsByTutor(tutorId: number) {
  return useQuery({
    queryKey: petKeys.byTutor(tutorId),
    queryFn: () => PetService.findByTutorId(tutorId),
    enabled: !!tutorId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function usePetSpeciesStats() {
  return useQuery({
    queryKey: petKeys.speciesStats(),
    queryFn: () => PetService.getSpeciesStats(),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  });
}

export function usePetAgeStats() {
  return useQuery({
    queryKey: petKeys.ageStats(),
    queryFn: () => PetService.getAgeStats(),
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos
  });
}

// Hooks para mutations
export function useCreatePet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreatePetData) => PetService.create(data),
    onSuccess: (newPet) => {
      // Invalidar listas de pets
      queryClient.invalidateQueries({ queryKey: petKeys.lists() });
      queryClient.invalidateQueries({ queryKey: petKeys.stats() });
      
      // Invalidar pets do tutor específico
      queryClient.invalidateQueries({ queryKey: petKeys.byTutor(newPet.tutorId) });
      
      // Invalidar dados do tutor (para atualizar contagem de pets)
      queryClient.invalidateQueries({ queryKey: tutorKeys.detail(newPet.tutorId) });
      queryClient.invalidateQueries({ queryKey: tutorKeys.lists() });
      
      // Adicionar o novo pet ao cache
      queryClient.setQueryData(petKeys.detail(newPet.id), newPet);
    },
    onError: (error) => {
      console.error('Erro ao criar pet:', error);
    },
  });
}

export function useCreatePetForTutor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ tutorId, data }: { tutorId: number; data: Omit<CreatePetData, 'tutorId'> }) => 
      PetService.createForTutor(tutorId, data),
    onSuccess: (newPet) => {
      // Invalidar listas de pets
      queryClient.invalidateQueries({ queryKey: petKeys.lists() });
      queryClient.invalidateQueries({ queryKey: petKeys.stats() });
      
      // Invalidar pets do tutor específico
      queryClient.invalidateQueries({ queryKey: petKeys.byTutor(newPet.tutorId) });
      
      // Invalidar dados do tutor (para atualizar contagem de pets)
      queryClient.invalidateQueries({ queryKey: tutorKeys.detail(newPet.tutorId) });
      queryClient.invalidateQueries({ queryKey: tutorKeys.lists() });
      
      // Adicionar o novo pet ao cache
      queryClient.setQueryData(petKeys.detail(newPet.id), newPet);
    },
    onError: (error) => {
      console.error('Erro ao criar pet para tutor:', error);
    },
  });
}

export function useUpdatePet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePetData }) => 
      PetService.update(id, data),
    onSuccess: (updatedPet) => {
      // Atualizar o pet específico no cache
      queryClient.setQueryData(petKeys.detail(updatedPet.id), updatedPet);
      
      // Invalidar listas para refletir as mudanças
      queryClient.invalidateQueries({ queryKey: petKeys.lists() });
      queryClient.invalidateQueries({ queryKey: petKeys.byTutor(updatedPet.tutorId) });
      queryClient.invalidateQueries({ queryKey: petKeys.stats() });
      
      // Atualizar listas existentes no cache
      queryClient.setQueriesData(
        { queryKey: petKeys.lists() },
        (oldData: PaginatedResponse<Pet> | undefined) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            data: oldData.data.map(pet => 
              pet.id === updatedPet.id ? updatedPet : pet
            )
          };
        }
      );
      
      // Atualizar lista de pets do tutor
      queryClient.setQueryData(
        petKeys.byTutor(updatedPet.tutorId),
        (oldPets: Pet[] | undefined) => {
          if (!oldPets) return oldPets;
          return oldPets.map(pet => 
            pet.id === updatedPet.id ? updatedPet : pet
          );
        }
      );
    },
    onError: (error) => {
      console.error('Erro ao atualizar pet:', error);
    },
  });
}

export function useDeletePet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => {
      // Primeiro buscar o pet para obter o tutorId
      return PetService.findById(id).then(pet => {
        if (!pet) throw new Error('Pet não encontrado');
        return PetService.delete(id).then(() => pet);
      });
    },
    onSuccess: (deletedPet) => {
      // Remover o pet do cache
      queryClient.removeQueries({ queryKey: petKeys.detail(deletedPet.id) });
      
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: petKeys.lists() });
      queryClient.invalidateQueries({ queryKey: petKeys.stats() });
      queryClient.invalidateQueries({ queryKey: petKeys.byTutor(deletedPet.tutorId) });
      
      // Invalidar dados do tutor (para atualizar contagem de pets)
      queryClient.invalidateQueries({ queryKey: tutorKeys.detail(deletedPet.tutorId) });
      queryClient.invalidateQueries({ queryKey: tutorKeys.lists() });
      
      // Atualizar listas existentes no cache
      queryClient.setQueriesData(
        { queryKey: petKeys.lists() },
        (oldData: PaginatedResponse<Pet> | undefined) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            data: oldData.data.filter(pet => pet.id !== deletedPet.id),
            total: oldData.total - 1
          };
        }
      );
      
      // Atualizar lista de pets do tutor
      queryClient.setQueryData(
        petKeys.byTutor(deletedPet.tutorId),
        (oldPets: Pet[] | undefined) => {
          if (!oldPets) return oldPets;
          return oldPets.filter(pet => pet.id !== deletedPet.id);
        }
      );
    },
    onError: (error) => {
      console.error('Erro ao excluir pet:', error);
    },
  });
}

// Função utilitária para prefetch
export function prefetchPet(queryClient: ReturnType<typeof useQueryClient>, id: number) {
  return queryClient.prefetchQuery({
    queryKey: petKeys.detail(id),
    queryFn: () => PetService.findById(id),
    staleTime: 5 * 60 * 1000,
  });
}

// Função utilitária para prefetch pets de um tutor
export function prefetchPetsByTutor(queryClient: ReturnType<typeof useQueryClient>, tutorId: number) {
  return queryClient.prefetchQuery({
    queryKey: petKeys.byTutor(tutorId),
    queryFn: () => PetService.findByTutorId(tutorId),
    staleTime: 5 * 60 * 1000,
  });
}

// Função utilitária para invalidar todas as queries de pets
export function invalidatePetQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return queryClient.invalidateQueries({ queryKey: petKeys.all });
}