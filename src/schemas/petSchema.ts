import { z } from 'zod';

export const petSchema = z.object({
  name: z.string()
    .min(1, 'Nome é obrigatório')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  species: z.string()
    .min(1, 'Espécie é obrigatória')
    .max(50, 'Espécie deve ter no máximo 50 caracteres'),
  breed: z.string()
    .min(1, 'Raça é obrigatória')
    .max(100, 'Raça deve ter no máximo 100 caracteres'),
  birthDate: z.string()
    .optional()
    .refine((date) => {
      if (!date) return true;
      const birthDate = new Date(date);
      const today = new Date();
      return birthDate <= today;
    }, 'Data de nascimento não pode ser no futuro')
    .transform((date) => date ? new Date(date) : undefined),
  tutorId: z.number()
    .min(1, 'Tutor é obrigatório')
});

export const petUpdateSchema = petSchema.partial().omit({ tutorId: true });

export type PetFormData = z.infer<typeof petSchema>;
export type PetUpdateData = z.infer<typeof petUpdateSchema>;

// Schema para busca/filtros
export const petSearchSchema = z.object({
  search: z.string().optional(),
  tutorId: z.number().optional(),
  species: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10)
});

export type PetSearchParams = z.infer<typeof petSearchSchema>;

// Constantes para espécies comuns
export const COMMON_SPECIES = [
  'Cachorro',
  'Gato',
  'Pássaro',
  'Peixe',
  'Hamster',
  'Coelho',
  'Tartaruga',
  'Outro'
] as const;

export type CommonSpecies = typeof COMMON_SPECIES[number];