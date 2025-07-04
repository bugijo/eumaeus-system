import apiClient from '../api/apiClient';
import type { CreateProductData, UpdateProductData } from '../schemas/productSchema';

// Tipos para as respostas da API
export interface Product {
  id: number;
  name: string;
  supplier: string;
  quantity: number;
  costPrice: number;
  expirationDate: string;
}

export interface StockStats {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  expiringSoon: number;
}

export class ProductService {
  private static readonly BASE_URL = '/products';

  // Buscar todos os produtos
  static async getAll(): Promise<Product[]> {
    const response = await apiClient.get<Product[]>(this.BASE_URL);
    return response.data;
  }

  // Buscar produto por ID
  static async findById(id: number): Promise<Product> {
    const response = await apiClient.get<Product>(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  // Criar novo produto
  static async create(data: CreateProductData): Promise<Product> {
    const response = await apiClient.post<Product>(this.BASE_URL, data);
    return response.data;
  }

  // Atualizar produto
  static async update(id: number, data: UpdateProductData): Promise<Product> {
    const response = await apiClient.put<Product>(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  // Excluir produto
  static async delete(id: number): Promise<void> {
    await apiClient.delete(`${this.BASE_URL}/${id}`);
  }

  // Buscar estatísticas do estoque
  static async getStockStats(): Promise<StockStats> {
    const response = await apiClient.get<StockStats>(`${this.BASE_URL}/stats`);
    return response.data;
  }

  // Buscar produtos com filtros
  static async getFiltered(filters: {
    search?: string;
    supplier?: string;
    lowStock?: boolean;
    expiringSoon?: boolean;
  }): Promise<Product[]> {
    const products = await this.getAll();
    
    return products.filter(product => {
      // Filtro por busca (nome ou fornecedor)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          product.name.toLowerCase().includes(searchLower) ||
          product.supplier.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filtro por fornecedor
      if (filters.supplier && product.supplier !== filters.supplier) {
        return false;
      }

      // Filtro por estoque baixo (menos de 10 unidades)
      if (filters.lowStock && product.quantity >= 10) {
        return false;
      }

      // Filtro por vencimento próximo (30 dias)
      if (filters.expiringSoon) {
        const expirationDate = new Date(product.expirationDate);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        if (expirationDate > thirtyDaysFromNow) {
          return false;
        }
      }

      return true;
    });
  }

  // Buscar fornecedores únicos
  static async getSuppliers(): Promise<string[]> {
    const products = await this.getAll();
    const suppliers = [...new Set(products.map(product => product.supplier))];
    return suppliers.sort();
  }
}