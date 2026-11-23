import { Request, Response } from 'express';
import { ProductService } from '../services/product.service';
import { CreateProductData, UpdateProductData } from '../models/product.model';

export class ProductController {
  static async getAllProducts(req: Request, res: Response): Promise<Response | void> {
    try {
      const products = await ProductService.getAllProducts();
      return res.json(products);
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async getProductById(req: Request, res: Response): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const product = await ProductService.getProductById(id);
      
      if (!product) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      return res.json(product);
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  /** Valida o corpo e devolve a mensagem do primeiro campo com problema. */
  private static parseBody(body: any, partial: boolean): { data?: CreateProductData | UpdateProductData; error?: string } {
    const data: any = {};
    const has = (key: string) => body?.[key] !== undefined && body?.[key] !== null && body?.[key] !== '';
    if (has('name') || !partial) {
      if (!String(body?.name ?? '').trim()) return { error: 'Informe o nome do produto' };
      data.name = String(body.name).trim();
    }
    if (body?.supplier !== undefined) data.supplier = String(body.supplier ?? '').trim();
    if (has('quantity') || !partial) {
      const quantity = Number(body?.quantity);
      if (!Number.isInteger(quantity) || quantity < 0) return { error: 'Quantidade em estoque deve ser um número inteiro maior ou igual a zero' };
      data.quantity = quantity;
    }
    if (has('costPrice') || !partial) {
      const costPrice = Number(body?.costPrice);
      if (!Number.isFinite(costPrice) || costPrice < 0) return { error: 'Preço de custo deve ser um valor maior ou igual a zero' };
      data.costPrice = costPrice;
    }
    if (body?.salePrice !== undefined) {
      if (body.salePrice === null || body.salePrice === '') data.salePrice = null;
      else {
        const salePrice = Number(body.salePrice);
        if (!Number.isFinite(salePrice) || salePrice < 0) return { error: 'Preço de venda deve ser um valor maior ou igual a zero' };
        data.salePrice = salePrice;
      }
    }
    if (body?.barcode !== undefined) {
      const barcode = String(body.barcode ?? '').replace(/\s+/g, '');
      if (barcode && !/^[0-9A-Za-z.\-]{3,48}$/.test(barcode)) return { error: 'Código de barras inválido (use só letras, números, ponto ou hífen)' };
      data.barcode = barcode || null;
    }
    if (body?.category !== undefined) data.category = body.category ? String(body.category).trim() : null;
    if (body?.resultCenterId !== undefined) data.resultCenterId = body.resultCenterId === null || body.resultCenterId === '' ? null : Number(body.resultCenterId);
    if (body?.expirationDate !== undefined) {
      const expirationDate = String(body.expirationDate ?? '').trim();
      if (expirationDate && !/^\d{4}-\d{2}-\d{2}$/.test(expirationDate)) return { error: 'Data de validade deve estar no formato AAAA-MM-DD' };
      data.expirationDate = expirationDate;
    }
    return { data };
  }

  private static conflict(error: unknown): string | null {
    return (error as any)?.code === 'P2002' ? 'Já existe outro produto com este código de barras' : null;
  }

  static async createProduct(req: Request, res: Response): Promise<Response | void> {
    try {
      const { data, error } = ProductController.parseBody(req.body, false);
      if (error) return res.status(400).json({ error });
      const newProduct = await ProductService.createProduct(data as CreateProductData);
      return res.status(201).json(newProduct);
    } catch (error) {
      const conflict = ProductController.conflict(error);
      if (conflict) return res.status(409).json({ error: conflict });
      console.error('Erro ao criar produto:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async updateProduct(req: Request, res: Response): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
      const { data, error } = ProductController.parseBody(req.body, true);
      if (error) return res.status(400).json({ error });
      const updatedProduct = await ProductService.updateProduct(id, data as UpdateProductData);
      if (!updatedProduct) return res.status(404).json({ error: 'Produto não encontrado' });
      return res.json(updatedProduct);
    } catch (error) {
      const conflict = ProductController.conflict(error);
      if (conflict) return res.status(409).json({ error: conflict });
      console.error('Erro ao atualizar produto:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async deleteProduct(req: Request, res: Response): Promise<Response | void> {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      const deleted = await ProductService.deleteProduct(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Produto não encontrado' });
      }

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar produto:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  static async getStockStats(req: Request, res: Response): Promise<Response | void> {
    try {
      const stats = await ProductService.getStockStats();
      return res.json(stats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas do estoque:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
}