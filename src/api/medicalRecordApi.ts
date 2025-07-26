import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MedicalRecordService } from '../services/medicalRecordService';
import { CreateMedicalRecordData } from '../types';
import { MedicalRecordFormData } from '../schemas/medicalRecordSchema';
import { toast } from 'sonner';
import apiClient from './apiClient';

// Interfaces para produtos
export interface Product {
  id: number;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  category?: string;
  stock?: number;
}

// Interface para prontuário médico completo
export interface MedicalRecord {
  id: number;
  petId: number;
  symptoms: string;
  diagnosis: string;
  treatment: string;
  observations?: string;
  weight?: number;
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  createdAt: string;
  updatedAt: string;
  pet?: {
    id: number;
    name: string;
    species: string;
    breed: string;
    tutor: {
      id: number;
      name: string;
    };
  };
  usedProducts?: {
    id: number;
    quantity: number;
    unitPrice: number;
    product: {
      id: number;
      name: string;
      price: number;
    };
  }[];
}

// Query Keys
export const medicalRecordKeys = {
  all: ['medicalRecords'] as const,
  lists: () => [...medicalRecordKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...medicalRecordKeys.lists(), { filters }] as const,
  details: () => [...medicalRecordKeys.all, 'detail'] as const,
  detail: (id: number) => [...medicalRecordKeys.details(), id] as const,
  byPet: (petId: number) => [...medicalRecordKeys.all, 'byPet', petId] as const,
};

// API para produtos
export const productApi = {
  getAvailable: async (): Promise<Product[]> => {
    const response = await apiClient.get('/records/products');
    return response.data;
  },
  getAll: async (): Promise<Product[]> => {
    const response = await apiClient.get('/products');
    return response.data;
  }
};

// API para prontuários médicos
export const medicalRecordApi = {
  create: async (data: MedicalRecordFormData): Promise<MedicalRecord> => {
    const response = await apiClient.post('/records/direct', data);
    return response.data;
  },
  getAll: async (): Promise<MedicalRecord[]> => {
    const response = await apiClient.get('/records');
    return response.data;
  },
  getById: async (id: number): Promise<MedicalRecord> => {
    const response = await apiClient.get(`/records/${id}`);
    return response.data;
  },
  getByPet: async (petId: number): Promise<MedicalRecord[]> => {
    const response = await apiClient.get(`/records/pets/${petId}/records`);
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
export function useUpdateAppointmentStatus(onSuccessCallback?: () => void) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ appointmentId, status }: { appointmentId: number; status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' }) =>
      appointmentStatusApi.updateStatus(appointmentId, status),
    onSuccess: (data, variables) => {
      // Invalida os agendamentos usando as query keys corretas do appointmentApi
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments', 'list'] });
      
      // Força um refetch imediato
      queryClient.refetchQueries({ queryKey: ['appointments', 'list'] });
      
      toast.success('Status do agendamento atualizado com sucesso!');
      
      // Executa o callback personalizado após a invalidação
      if (onSuccessCallback) {
        onSuccessCallback();
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao atualizar status do agendamento';
      toast.error(message);
    },
  });
}

// Hook para criar prontuário médico com produtos
export function useCreateMedicalRecordWithProducts() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: medicalRecordApi.create,
    onSuccess: (newRecord) => {
      // Invalida todas as listas de prontuários
      queryClient.invalidateQueries({ queryKey: medicalRecordKeys.lists() });
      
      // Invalida prontuários específicos do pet
      queryClient.invalidateQueries({ queryKey: medicalRecordKeys.byPet(newRecord.petId) });
      
      // Invalida produtos (estoque foi atualizado)
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'available'] });
      
      toast.success('Prontuário criado com sucesso!');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erro ao criar prontuário';
      toast.error(message);
    },
  });
}

// Hook para buscar todos os produtos do estoque
export function useAllProducts() {
  return useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => productApi.getAll(),
  });
}

// Hook para buscar prontuários com as novas query keys
export function useMedicalRecordsByPetNew(petId: number) {
  return useQuery({
    queryKey: medicalRecordKeys.byPet(petId),
    queryFn: () => medicalRecordApi.getByPet(petId),
    enabled: !!petId,
  });
}

// Hook para buscar prontuário específico com as novas query keys
export function useMedicalRecordNew(id: number) {
  return useQuery({
    queryKey: medicalRecordKeys.detail(id),
    queryFn: () => medicalRecordApi.getById(id),
    enabled: !!id,
  });
}