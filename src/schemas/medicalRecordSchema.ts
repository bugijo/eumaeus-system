import { z } from 'zod';

// Schema para produto usado no prontuário
export const usedProductSchema = z.object({
  productId: z.number().min(1, 'Produto é obrigatório'),
  quantity: z.number().min(1, 'Quantidade deve ser maior que 0'),
  unitPrice: z.number().min(0, 'Preço deve ser maior ou igual a 0'),
  product: z.object({
    id: z.number(),
    name: z.string(),
    price: z.number(),
    stock: z.number(),
  }).optional(),
});

// Schema principal do prontuário médico
export const medicalRecordSchema = z.object({
  petId: z.number().min(1, 'Pet é obrigatório'),
  symptoms: z.string().min(1, 'Sintomas são obrigatórios'),
  diagnosis: z.string().min(1, 'Diagnóstico é obrigatório'),
  treatment: z.string().min(1, 'Tratamento é obrigatório'),
  observations: z.string().optional(),
  weight: z.number().min(0, 'Peso deve ser maior ou igual a 0').optional(),
  temperature: z.number().min(0, 'Temperatura deve ser maior que 0').optional(),
  heartRate: z.number().min(0, 'Frequência cardíaca deve ser maior que 0').optional(),
  respiratoryRate: z.number().min(0, 'Frequência respiratória deve ser maior que 0').optional(),
  usedProducts: z.array(usedProductSchema).default([]),
});

export type MedicalRecordFormData = z.infer<typeof medicalRecordSchema>;
export type UsedProduct = z.infer<typeof usedProductSchema>;