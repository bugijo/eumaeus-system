import { prisma } from '../lib/prisma';
import { Prisma } from '@prisma/client';
import { Product, CreateProductData, UpdateProductData } from '../models/product.model';

type ProductMetadata = {
  supplier?: string;
  expirationDate?: string;
};

function parseMetadata(description?: string | null): ProductMetadata {
  if (!description) {
    return {};
  }

  try {
    const parsed = JSON.parse(description);
    if (parsed && typeof parsed === 'object') {
      return {
        supplier: typeof parsed.supplier === 'string' ? parsed.supplier : undefined,
        expirationDate: typeof parsed.expirationDate === 'string' ? parsed.expirationDate : undefined,
      };
    }
  } catch {
    // Mantém compatibilidade com descrições antigas sem JSON.
  }

  return {
    supplier: description,
  };
}

function buildDescription(metadata: ProductMetadata): string {
  return JSON.stringify({
    supplier: metadata.supplier || 'Não informado',
    expirationDate: metadata.expirationDate || '',
  });
}

export const normalizeBarcode = (value?: string | null) => {
  const code = String(value ?? '').replace(/\s+/g, '');
  return code ? code : null;
};

export function inferCategory(name: string): string {
  return /vacina/i.test(name) ? 'Vacina' : 'Estoque';
}

function mapPrismaProductToLegacy(product: {
  id: number;
  name: string;
  quantity: number;
  price: Prisma.Decimal | number;
  description: string | null;
  salePrice?: Prisma.Decimal | number | null;
  barcode?: string | null;
  category?: string | null;
  resultCenterId?: number | null;
}): Product {
  const metadata = parseMetadata(product.description);

  return {
    id: product.id,
    name: product.name,
    supplier: metadata.supplier || 'Não informado',
    quantity: product.quantity,
    costPrice: Number(product.price),
    salePrice: product.salePrice === null || product.salePrice === undefined ? null : Number(product.salePrice),
    barcode: product.barcode ?? null,
    category: product.category ?? null,
    resultCenterId: product.resultCenterId ?? null,
    expirationDate: metadata.expirationDate && metadata.expirationDate !== '2099-12-31' ? metadata.expirationDate : '',
  };
}

export class ProductService {
  static async getAllProducts(): Promise<Product[]> {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
    });

    return products.map(mapPrismaProductToLegacy);
  }

  static async getProductById(id: number): Promise<Product | null> {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    return product ? mapPrismaProductToLegacy(product) : null;
  }

  static async createProduct(productData: CreateProductData): Promise<Product> {
    const created = await prisma.product.create({
      data: {
        name: productData.name,
        description: buildDescription({
          supplier: productData.supplier,
          expirationDate: productData.expirationDate,
        }),
        quantity: productData.quantity,
        price: productData.costPrice,
        salePrice: productData.salePrice ?? null,
        barcode: normalizeBarcode(productData.barcode),
        resultCenterId: productData.resultCenterId ?? null,
        category: productData.category?.trim() || inferCategory(productData.name),
      } as any,
    });

    return mapPrismaProductToLegacy(created);
  }

  static async updateProduct(id: number, updateData: UpdateProductData): Promise<Product | null> {
    const current = await prisma.product.findUnique({
      where: { id },
    });

    if (!current) {
      return null;
    }

    const currentMetadata = parseMetadata(current.description);
    const mergedMetadata: ProductMetadata = {
      supplier: updateData.supplier ?? currentMetadata.supplier,
      expirationDate: updateData.expirationDate ?? currentMetadata.expirationDate,
    };

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: updateData.name ?? current.name,
        quantity: updateData.quantity ?? current.quantity,
        price: updateData.costPrice ?? current.price,
        description: buildDescription(mergedMetadata),
        ...(updateData.salePrice !== undefined ? { salePrice: updateData.salePrice } : {}),
        ...(updateData.barcode !== undefined ? { barcode: normalizeBarcode(updateData.barcode) } : {}),
        ...(updateData.resultCenterId !== undefined ? { resultCenterId: updateData.resultCenterId } : {}),
        category: updateData.category !== undefined ? (updateData.category?.trim() || inferCategory(updateData.name ?? current.name)) : (current.category ?? inferCategory(updateData.name ?? current.name)),
      } as any,
    });

    return mapPrismaProductToLegacy(updated);
  }

  static async deleteProduct(id: number): Promise<boolean> {
    const current = await prisma.product.findUnique({
      where: { id },
    });

    if (!current) {
      return false;
    }

    await prisma.product.delete({ where: { id } });
    return true;
  }

  static async getStockStats() {
    const products = await this.getAllProducts();
    const totalItems = products.length;
    const totalValue = products.reduce((sum, product) => sum + product.quantity * product.costPrice, 0);
    const lowStockItems = products.filter((product) => product.quantity < 10).length;

    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringSoon = products.filter((product) => {
      if (!product.expirationDate) return false;
      const expirationDate = new Date(product.expirationDate);
      return expirationDate >= today && expirationDate <= thirtyDaysFromNow;
    }).length;

    return {
      totalItems,
      totalValue,
      lowStockItems,
      expiringSoon,
    };
  }
}
