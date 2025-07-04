import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MedicalRecordService } from '../services/medicalRecordService';
import { CreateMedicalRecordData } from '../types';
import apiClient from './apiClient';

// Interfaces para produtos
export interface Product {
  id: number;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  category?: string;
}

// API para produtos
export const productApi = {
  getAvailable: async (): Promise<Product[]> => {
    const response = await apiClient.get('/records/products');
    return response.data;
  }
};

// API para status de agendamentos
export const appointmentStatusApi = {
  updateStatus: async (appointmentId: number, status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'): Promise<any> => {
    const response = await apiClient.patch(`/appointments/${appointmentId}/status`, { status });
    return response.data;
  }
};

// Hook para buscar prontuários de um pet específico
export function useMedicalRecords(petId: number) {
  return useQuery({
    queryKey: ['medicalRecords', petId],
    queryFn: () => MedicalRecordService.getRecordsByPetId(petId),
    enabled: !!petId,
  });
}

// Hook para buscar um prontuário específico
export function useMedicalRecord(id: number) {
  return useQuery({
    queryKey: ['medicalRecord', id],
    queryFn: () => MedicalRecordService.getRecordById(id),
    enabled: !!id,
  });
}

// Hook para buscar todos os prontuários
export function useAllMedicalRecords() {
  return useQuery({
    queryKey: ['medicalRecords', 'all'],
    queryFn: () => MedicalRecordService.getAllRecords(),
  });
}

// Hook para criar um novo prontuário
export function useCreateMedicalRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ appointmentId, data }: { appointmentId: number; data: CreateMedicalRecordData }) =>
      MedicalRecordService.createRecord(appointmentId, data),
    onSuccess: (newRecord) => {
      // Invalida e refetch os prontuários do pet
      queryClient.invalidateQueries({ queryKey: ['medicalRecords', newRecord.petId] });
      // Invalida todos os prontuários
      queryClient.invalidateQueries({ queryKey: ['medicalRecords', 'all'] });
    },
  });
}

// Hook para atualizar um prontuário existente
export function useUpdateMedicalRecord() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ recordId, data }: { recordId: number; data: { notes: string; prescription: string } }) =>
      MedicalRecordService.updateMedicalRecord(recordId, data),
    onSuccess: (updatedRecord) => {
      // Invalida e refetch os prontuários do pet
      queryClient.invalidateQueries({ queryKey: ['medicalRecords', updatedRecord.petId] });
      // Invalida todos os prontuários
      queryClient.invalidateQueries({ queryKey: ['medicalRecords', 'all'] });
      // Invalida o prontuário específico
      queryClient.invalidateQueries({ queryKey: ['medicalRecord', updatedRecord.id] });
    },
  });
}

// Hook para buscar produtos disponíveis
export function useAvailableProducts() {
  return useQuery({
    queryKey: ['products', 'available'],
    queryFn: () => productApi.getAvailable(),
  });
}

// Hook para atualizar status de agendamento
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ appointmentId, status }: { appointmentId: number; status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' }) =>
      appointmentStatusApi.updateStatus(appointmentId, status),
    onSuccess: () => {
      // Invalida os agendamentos para refletir a mudança de status
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}