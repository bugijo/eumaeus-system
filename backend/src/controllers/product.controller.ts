import { Request, Response } from 'express';
import { ProductService } from '../services/product.service';
import { CreateProductData, UpdateProductData } from '../models/product.model';

export class ProductController {
  static async getAllProducts(req: Request, res: Response) {
    try {
      const products = await ProductService.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async getProductById(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const product = await ProductService.getProductById(id);
      
      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      res.json(product);
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async createProduct(req: Request, res: Response) {
    try {
      const { name, supplier, quantity, costPrice, expirationDate }: CreateProductData = req.body;

      // Validações básicas
      if (!name || !supplier || quantity === undefined || costPrice === undefined || !expirationDate) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
      }

      if (quantity < 0 || costPrice < 0) {
        return res.status(400).json({ error: 'Quantidade e preço devem ser valores positivos' });
      }

      // Validar formato da data
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(expirationDate)) {
        return res.status(400).json({ error: 'Data de vencimento deve estar no formato YYYY-MM-DD' });
      }

      const productData: CreateProductData = {
        name: name.trim(),
        supplier: supplier.trim(),
        quantity: Number(quantity),
        costPrice: Number(costPrice),
        expirationDate
      };

      const newProduct = await ProductService.createProduct(productData);
      res.status(201).json(newProduct);
    } catch (error) {
      console.error('Erro ao criar produto:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async updateProduct(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const updateData: UpdateProductData = {};
      const { name, supplier, quantity, costPrice, expirationDate } = req.body;

      // Apenas adicionar campos que foram fornecidos
      if (name !== undefined) updateData.name = name.trim();
      if (supplier !== undefined) updateData.supplier = supplier.trim();
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

      const updatedProduct = await ProductService.updateProduct(id, updateData);
      
      if (!updatedProduct) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      res.json(updatedProduct);
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async deleteProduct(req: Request, res: Response) {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const deleted = await ProductService.deleteProduct(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async getStockStats(req: Request, res: Response) {
    try {
      const stats = await ProductService.getStockStats();
      res.json(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas do estoque:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}