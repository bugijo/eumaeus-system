export interface Product {
  id: number;
  name: string;
  supplier: string;
  quantity: number;
  costPrice: number;
  expirationDate: string; // formato "YYYY-MM-DD"
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