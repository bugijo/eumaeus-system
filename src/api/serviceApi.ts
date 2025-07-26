import apiClient from './apiClient';

export interface ServiceType {
  id: string;
  name: string;
  description: string;
  duration: number; // em minutos
  price: number;
  category: string;
  isActive: boolean;
}

export interface ServiceCategory {
  name: string;
  services: ServiceType[];
}

export const serviceApi = {
  // GET /api/services - Buscar todos os serviços
  getAllServices: async (params?: {
    category?: string;
    search?: string;
  }): Promise<ServiceType[]> => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append('category', params.category);
    if (params?.search) searchParams.append('search', params.search);
    
    const queryString = searchParams.toString();
    const url = queryString ? `/services?${queryString}` : '/services';
    
    const response = await apiClient.get(url);
    return response.data.data;
  },

  // GET /api/services/categories - Buscar serviços agrupados por categoria
  getServicesByCategory: async (): Promise<ServiceCategory[]> => {
    const response = await apiClient.get('/services/categories');
    return response.data.data;
  },

  // GET /api/services/:id - Buscar serviço por ID
  getServiceById: async (id: string): Promise<ServiceType> => {
    const response = await apiClient.get(`/services/${id}`);
    return response.data.data;
  }
};