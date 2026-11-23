import { z } from 'zod';

// Schema para criação de produto
export const productSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Informe o nome do produto (mínimo 2 letras)')
    .max(120, 'Nome deve ter no máximo 120 caracteres'),

  barcode: z.string()
    .trim()
    .max(48, 'Código de barras muito longo')
    .regex(/^[0-9A-Za-z.\-]*$/, 'Use só letras, números, ponto ou hífen')
    .optional(),

  category: z.string().trim().max(60).optional(),

  supplier: z.string().trim().max(100, 'Fornecedor deve ter no máximo 100 caracteres').optional(),

  quantity: z.number({ message: 'Informe a quantidade' })
    .int('Quantidade deve ser um número inteiro')
    .min(0, 'Quantidade não pode ser negativa'),

  costPrice: z.number({ message: 'Informe o preço de custo' })
    .min(0, 'Preço de custo não pode ser negativo'),

  salePrice: z.number().min(0, 'Preço de venda não pode ser negativo').nullable().optional(),

  resultCenterId: z.number().nullable().optional(),

  expirationDate: z.string()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, 'Data inválida')
    .optional()
});

// Schema para atualização de produto (todos os campos opcionais)
export const productUpdateSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .optional(),
  
  supplier: z.string()
    .min(2, 'Fornecedor deve ter pelo menos 2 caracteres')
    .max(100, 'Fornecedor deve ter no máximo 100 caracteres')
    .optional(),
  
  quantity: z.number()
    .min(0, 'Quantidade deve ser um número positivo')
    .int('Quantidade deve ser um número inteiro')
    .optional(),
  
  costPrice: z.number()
    .min(0, 'Preço de custo deve ser um número positivo')
    .optional(),
  
  expirationDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
    .optional()
});

// Tipos TypeScript derivados dos schemas
export type CreateProductData = z.infer<typeof productSchema>;
export type UpdateProductData = z.infer<typeof productUpdateSchema>;

// Schema para filtros de busca
export const productFiltersSchema = z.object({
  search: z.string().optional(),
  supplier: z.string().optional(),
  lowStock: z.boolean().optional(),
  expiringSoon: z.boolean().optional()
});

export type ProductFilters = z.infer<typeof productFiltersSchema>;