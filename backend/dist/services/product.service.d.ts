import { Product, CreateProductData, UpdateProductData } from '../models/product.model';
export declare class ProductService {
    static getAllProducts(): Promise<Product[]>;
    static getProductById(id: number): Promise<Product | null>;
    static createProduct(productData: CreateProductData): Promise<Product>;
    static updateProduct(id: number, updateData: UpdateProductData): Promise<Product | null>;
    static deleteProduct(id: number): Promise<boolean>;
    static getStockStats(): Promise<{
        totalItems: number;
        totalValue: number;
        lowStockItems: number;
        expiringSoon: number;
    }>;
}
//# sourceMappingURL=product.service.d.ts.map