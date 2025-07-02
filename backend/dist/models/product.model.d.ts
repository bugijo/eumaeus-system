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
//# sourceMappingURL=product.model.d.ts.map