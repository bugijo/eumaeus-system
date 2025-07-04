import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from './apiClient';

export interface Product {
  id: number;
  name: string;
  supplier: string;
  quantity: number;
  costPrice: number;
  expirationDate: string;
}

export interface CreateProductData {
  name: string;
  supplier: string;
  quantity: number;
  costPrice: number;
  expirationDate: string;
}

export interface UpdateProductData {
  name?: string;
  supplier?: string;
  quantity?: number;
  costPrice?: number;
  expirationDate?: string;
}

export interface StockStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  expiringSoon: number;
}

export interface ProductUsageRequest {
  productId: number;
  quantityUsed: number;
}

export interface ProductUsageResponse {
  message: string;
  usages?: any[];
}

// Funções da API
const productApi = {
  getAll: async (): Promise<Product[]> => {
    const response = await apiClient.get('/products');
    return response.data;
  },

  getById: async (id: number): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  create: async (data: CreateProductData): Promise<Product> => {
    const response = await apiClient.post('/products', data);
    return response.data;
  },

  update: async (id: number, data: UpdateProductData): Promise<Product> => {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },

  getStats: async (): Promise<StockStats> => {
    const response = await apiClient.get('/products/stats');
    return response.data;
  },

  registerUsage: async (appointmentId: number, products: ProductUsageRequest[]): Promise<ProductUsageResponse> => {
    const response = await apiClient.post(`/appointments/${appointmentId}/products`, products);
    return response.data;
  },
};

// Hooks do React Query
export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: productApi.getAll,
  });
};

export const useProduct = (id: number) => {
  return useQuery({
    queryKey: ['products', id],
    queryFn: () => productApi.getById(id),
    enabled: !!id,
  });
};

export const useStockStats = () => {
  return useQuery({
    queryKey: ['stock-stats'],
    queryFn: productApi.getStats,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: productApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-stats'] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductData }) => 
      productApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-stats'] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: productApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-stats'] });
    },
  });
};

export const useRegisterProductUsage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ appointmentId, products }: { appointmentId: number; products: ProductUsageRequest[] }) => 
      productApi.registerUsage(appointmentId, products),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stock-stats'] });
    },
  });
};