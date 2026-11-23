export interface Product {
  id: number;
  name: string;
  supplier: string;
  quantity: number;
  costPrice: number;
  salePrice: number | null;
  barcode: string | null;
  category: string | null;
  resultCenterId: number | null;
  expirationDate: string; // formato "YYYY-MM-DD" ("" quando não se aplica)
}

export interface CreateProductData {
  name: string;
  supplier?: string;
  quantity: number;
  costPrice: number;
  salePrice?: number | null;
  barcode?: string | null;
  category?: string | null;
  resultCenterId?: number | null;
  expirationDate?: string;
}

export type UpdateProductData = Partial<CreateProductData>;
