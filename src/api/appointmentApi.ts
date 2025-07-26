import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppointmentService } from '../services/appointmentService';
import type { Appointment, CreateAppointmentData } from '../types';

// Query Keys
export const appointmentKeys = {
  all: ['appointments'] as const,
  lists: () => [...appointmentKeys.all, 'list'] as const,
  list: () => [...appointmentKeys.lists()] as const,
  details: () => [...appointmentKeys.all, 'detail'] as const,
  detail: (id: number) => [...appointmentKeys.details(), id] as const,
};

// Hooks para queries
export function useAppointments() {
  return useQuery({
    queryKey: appointmentKeys.list(),
    queryFn: () => AppointmentService.findAll(),
    staleTime: 5 * 60 * 1000, // 5 minutos - valor normal de cache
  });
}

export function useAppointment(id: number) {
  return useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: () => AppointmentService.findById(id),
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!id, // Só executa se o ID for válido
  });
}

// Hook para criar agendamento
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateAppointmentData) => AppointmentService.create(data),
    onSuccess: () => {
      // Invalida a query de appointments para atualizar a lista
      queryClient.invalidateQueries({ queryKey: appointmentKeys.list() });
      // Também invalida todas as queries relacionadas a appointments
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}

// Hook para atualizar agendamento
export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateAppointmentData> }) => 
      AppointmentService.update(id, data),
    onSuccess: (updatedAppointment) => {
      // Atualiza o cache do agendamento específico
      queryClient.setQueryData(
        appointmentKeys.detail(updatedAppointment.id),
        updatedAppointment
      );
      
      // Invalida a query de appointments para atualizar a lista
      queryClient.invalidateQueries({ queryKey: appointmentKeys.list() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}

// Hook para deletar agendamento
export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => AppointmentService.delete(id),
    onSuccess: () => {
      // Invalida a query de appointments para atualizar a lista
      queryClient.invalidateQueries({ queryKey: appointmentKeys.list() });
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}