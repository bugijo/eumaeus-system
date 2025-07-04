import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';

// Interfaces
export interface InvoiceItem {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  invoiceId: number;
}

export interface Invoice {
  id: number;
  totalAmount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  createdAt: string;
  appointmentId: number;
  appointment: {
    id: number;
    appointmentDate: string;
    pet: {
      id: number;
      name: string;
      tutor: {
        id: number;
        name: string;
        email: string;
        phone: string;
      };
    };
  };
  items: InvoiceItem[];
}

export interface CreateInvoiceFromAppointmentData {
  appointmentId: number;
}

export interface UpdateInvoiceStatusData {
  invoiceId: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
}

// API Functions
const invoiceApi = {
  // Criar fatura a partir de agendamento
  createFromAppointment: async (appointmentId: number): Promise<Invoice> => {
    const response = await apiClient.post(`/invoices/from-appointment/${appointmentId}`);
    return response.data.data;
  },

  // Buscar fatura por ID
  getById: async (invoiceId: number): Promise<Invoice> => {
    const response = await apiClient.get(`/invoices/${invoiceId}`);
    return response.data.data;
  },

  // Buscar fatura por ID do agendamento
  getByAppointmentId: async (appointmentId: number): Promise<Invoice | null> => {
    try {
      const response = await apiClient.get(`/invoices/appointment/${appointmentId}`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Listar todas as faturas
  getAll: async (): Promise<Invoice[]> => {
    const response = await apiClient.get('/invoices');
    return response.data.data;
  },

  // Atualizar status da fatura
  updateStatus: async (invoiceId: number, status: 'PENDING' | 'PAID' | 'CANCELLED'): Promise<Invoice> => {
    const response = await apiClient.patch(`/invoices/${invoiceId}/status`, { status });
    return response.data.data;
  }
};

// React Query Hooks

// Hook para criar fatura a partir de agendamento
export const useCreateInvoiceFromAppointment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (appointmentId: number) => invoiceApi.createFromAppointment(appointmentId),
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', 'appointment', data.appointmentId] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    }
  });
};

// Hook para buscar fatura por ID
export const useInvoice = (invoiceId: number) => {
  return useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => invoiceApi.getById(invoiceId),
    enabled: !!invoiceId
  });
};

// Hook para buscar fatura por ID do agendamento
export const useInvoiceByAppointment = (appointmentId: number) => {
  return useQuery({
    queryKey: ['invoice', 'appointment', appointmentId],
    queryFn: () => invoiceApi.getByAppointmentId(appointmentId),
    enabled: !!appointmentId
  });
};

// Hook para listar todas as faturas
export const useInvoices = () => {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: invoiceApi.getAll
  });
};

// Hook para atualizar status da fatura
export const useUpdateInvoiceStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ invoiceId, status }: UpdateInvoiceStatusData) => 
      invoiceApi.updateStatus(invoiceId, status),
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', data.id] });
      queryClient.invalidateQueries({ queryKey: ['invoice', 'appointment', data.appointmentId] });
    }
  });
};

export default invoiceApi;