import { z } from 'zod';

export const tutorSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z.string()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres'),
  phone: z.string()
    .regex(/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/, 'Telefone inválido (ex: (11) 99999-9999)')
    .transform(val => val.replace(/\D/g, '')), // Remove caracteres não numéricos
  address: z.string()
    .max(500, 'Endereço deve ter no máximo 500 caracteres')
    .optional()
    .or(z.literal(''))
});

export const tutorUpdateSchema = tutorSchema.partial();

export type TutorFormData = z.infer<typeof tutorSchema>;
export type TutorUpdateData = z.infer<typeof tutorUpdateSchema>;

// Schema para busca/filtros
export const tutorSearchSchema = z.object({
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10)
});

export type TutorSearchParams = z.infer<typeof tutorSearchSchema>;