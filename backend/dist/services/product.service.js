"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
let products = [
    {
        id: 1,
        name: 'Ração Premium Cães',
        supplier: 'Pet Food Brasil',
        quantity: 50,
        costPrice: 45.90,
        expirationDate: '2024-12-31'
    },
    {
        id: 2,
        name: 'Vacina V10',
        supplier: 'Laboratório VetMed',
        quantity: 25,
        costPrice: 35.00,
        expirationDate: '2024-08-15'
    },
    {
        id: 3,
        name: 'Shampoo Antipulgas',
        supplier: 'Higiene Pet',
        quantity: 30,
        costPrice: 18.50,
        expirationDate: '2025-03-20'
    }
];
let nextId = 4;
class ProductService {
    static async getAllProducts() {
        return products;
    }
    static async getProductById(id) {
        const product = products.find(p => p.id === id);
        return product || null;
    }
    static async createProduct(productData) {
        const newProduct = {
            id: nextId++,
            ...productData
        };
        products.push(newProduct);
        return newProduct;
    }
    static async updateProduct(id, updateData) {
        const productIndex = products.findIndex(p => p.id === id);
        if (productIndex === -1) {
            return null;
        }
        products[productIndex] = {
            ...products[productIndex],
            ...updateData
        };
        return products[productIndex];
    }
    static async deleteProduct(id) {
        const productIndex = products.findIndex(p => p.id === id);
        if (productIndex === -1) {
            return false;
        }
        products.splice(productIndex, 1);
        return true;
    }
    static async getStockStats() {
        const totalItems = products.length;
        const totalValue = products.reduce((sum, product) => sum + (product.quantity * product.costPrice), 0);
        const lowStockItems = products.filter(product => product.quantity < 10).length;
        const expiringSoon = products.filter(product => {
            const expirationDate = new Date(product.expirationDate);
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
            return expirationDate <= thirtyDaysFromNow;
        }).length;
        return {
            totalItems,
            totalValue,
            lowStockItems,
            expiringSoon
        };
    }
}
exports.ProductService = ProductService;
//# sourceMappingURL=product.service.js.map