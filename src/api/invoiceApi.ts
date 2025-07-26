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
  nfeId?: string;
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

// Interfaces para NFS-e
export interface NFSeResponse {
  id: string;
  status: string;
  status_code: string;
  message?: string;
  url?: string;
  pdf_url?: string;
}

export interface NFSeStatusResponse {
  id: string;
  status: string;
  status_code: string;
  message?: string;
  numero?: string;
  codigo_verificacao?: string;
  url?: string;
  pdf_url?: string;
}

export interface CancelNFSeData {
  justificativa: string;
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

  // Obter estatísticas financeiras
  getFinancialStats: async () => {
    const response = await apiClient.get('/invoices/stats');
    return response.data.data;
  },

  // Atualizar status da fatura
  updateStatus: async (invoiceId: number, status: 'PENDING' | 'PAID' | 'CANCELLED'): Promise<Invoice> => {
    const response = await apiClient.patch(`/invoices/${invoiceId}/status`, { status });
    return response.data.data;
  },

  // Funções de NFS-e
  // Emitir NFS-e
  issueNFe: async (invoiceId: number): Promise<NFSeResponse> => {
    const response = await apiClient.post(`/invoices/${invoiceId}/issue-nfe`);
    return response.data.data;
  },

  // Consultar status da NFS-e
  getNFeStatus: async (invoiceId: number): Promise<NFSeStatusResponse> => {
    const response = await apiClient.get(`/invoices/${invoiceId}/nfe-status`);
    return response.data.data;
  },

  // Baixar PDF da NFS-e
  downloadNFePDF: async (invoiceId: number): Promise<Blob> => {
    const response = await apiClient.get(`/invoices/${invoiceId}/nfe-pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Cancelar NFS-e
  cancelNFe: async (invoiceId: number, data: CancelNFSeData): Promise<NFSeResponse> => {
    const response = await apiClient.post(`/invoices/${invoiceId}/cancel-nfe`, data);
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
      queryClient.invalidateQueries({ queryKey: ['appointments', 'list'] });
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

// Hook para obter estatísticas financeiras
export const useFinancialStats = () => {
  return useQuery({
    queryKey: ['financial-stats'],
    queryFn: invoiceApi.getFinancialStats
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

// Hooks para NFS-e

// Hook para emitir NFS-e
export const useIssueNFe = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (invoiceId: number) => invoiceApi.issueNFe(invoiceId),
    onSuccess: (data, invoiceId) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['invoice', invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });
};

// Hook para consultar status da NFS-e
export const useNFeStatus = (invoiceId: number, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['nfe-status', invoiceId],
    queryFn: () => invoiceApi.getNFeStatus(invoiceId),
    enabled: enabled && !!invoiceId
  });
};

// Hook para baixar PDF da NFS-e
export const useDownloadNFePDF = () => {
  return useMutation({
    mutationFn: (invoiceId: number) => invoiceApi.downloadNFePDF(invoiceId),
    onSuccess: (blob, invoiceId) => {
      // Criar URL para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nfe-fatura-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }
  });
};

// Hook para cancelar NFS-e
export const useCancelNFe = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ invoiceId, data }: { invoiceId: number; data: CancelNFSeData }) => 
      invoiceApi.cancelNFe(invoiceId, data),
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['nfe-status', variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });
};

export default invoiceApi;