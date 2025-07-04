"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const product_service_1 = require("../services/product.service");
class ProductController {
    static async getAllProducts(req, res) {
        try {
            const products = await product_service_1.ProductService.getAllProducts();
            return res.json(products);
        }
        catch (error) {
            console.error('Erro ao buscar produtos:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static async getProductById(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const product = await product_service_1.ProductService.getProductById(id);
            if (!product) {
                return res.status(404).json({ error: 'Produto não encontrado' });
            }
            return res.json(product);
        }
        catch (error) {
            console.error('Erro ao buscar produto:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static async createProduct(req, res) {
        try {
            const { name, supplier, quantity, costPrice, expirationDate } = req.body;
            if (!name || !supplier || quantity === undefined || costPrice === undefined || !expirationDate) {
                return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
            }
            if (quantity < 0 || costPrice < 0) {
                return res.status(400).json({ error: 'Quantidade e preço devem ser valores positivos' });
            }
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(expirationDate)) {
                return res.status(400).json({ error: 'Data de vencimento deve estar no formato YYYY-MM-DD' });
            }
            const productData = {
                name: name.trim(),
                supplier: supplier.trim(),
                quantity: Number(quantity),
                costPrice: Number(costPrice),
                expirationDate
            };
            const newProduct = await product_service_1.ProductService.createProduct(productData);
            return res.status(201).json(newProduct);
        }
        catch (error) {
            console.error('Erro ao criar produto:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static async updateProduct(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const updateData = {};
            const { name, supplier, quantity, costPrice, expirationDate } = req.body;
            if (name !== undefined)
                updateData.name = name.trim();
            if (supplier !== undefined)
                updateData.supplier = supplier.trim();
            if (quantity !== undefined) {
                if (quantity < 0) {
                    return res.status(400).json({ error: 'Quantidade deve ser um valor positivo' });
                }
                updateData.quantity = Number(quantity);
            }
            if (costPrice !== undefined) {
                if (costPrice < 0) {
                    return res.status(400).json({ error: 'Preço deve ser um valor positivo' });
                }
                updateData.costPrice = Number(costPrice);
            }
            if (expirationDate !== undefined) {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(expirationDate)) {
                    return res.status(400).json({ error: 'Data de vencimento deve estar no formato YYYY-MM-DD' });
                }
                updateData.expirationDate = expirationDate;
            }
            const updatedProduct = await product_service_1.ProductService.updateProduct(id, updateData);
            if (!updatedProduct) {
                return res.status(404).json({ error: 'Produto não encontrado' });
            }
            return res.json(updatedProduct);
        }
        catch (error) {
            console.error('Erro ao atualizar produto:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static async deleteProduct(req, res) {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ error: 'ID inválido' });
            }
            const deleted = await product_service_1.ProductService.deleteProduct(id);
            if (!deleted) {
                return res.status(404).json({ error: 'Produto não encontrado' });
            }
            return res.status(204).send();
        }
        catch (error) {
            console.error('Erro ao deletar produto:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
    static async getStockStats(req, res) {
        try {
            const stats = await product_service_1.ProductService.getStockStats();
            return res.json(stats);
        }
        catch (error) {
            console.error('Erro ao buscar estatísticas do estoque:', error);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}
exports.ProductController = ProductController;
//# sourceMappingURL=product.controller.js.map