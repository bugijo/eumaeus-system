import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config/env';

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
    const response = await fetch(`${API_BASE_URL}/products`);
    if (!response.ok) {
      throw new Error('Erro ao buscar produtos');
    }
    return response.json();
  },

  getById: async (id: number): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!response.ok) {
      throw new Error('Erro ao buscar produto');
    }
    return response.json();
  },

  create: async (data: CreateProductData): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar produto');
    }
    return response.json();
  },

  update: async (id: number, data: UpdateProductData): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar produto');
    }
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao deletar produto');
    }
  },

  getStats: async (): Promise<StockStats> => {
    const response = await fetch(`${API_BASE_URL}/products/stats`);
    if (!response.ok) {
      throw new Error('Erro ao buscar estatísticas do estoque');
    }
    return response.json();
  },

  registerUsage: async (appointmentId: number, products: ProductUsageRequest[]): Promise<ProductUsageResponse> => {
    const response = await fetch(`${API_BASE_URL}/appointments/${appointmentId}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(products),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao registrar uso de produtos');
    }
    return response.json();
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