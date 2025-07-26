'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { InputField, TextareaField, SelectField } from '@/components/ui/FormField';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { petSchema, petUpdateSchema, type PetFormData, type PetUpdateData } from '@/schemas/petSchema';
import { useCreatePet, useCreatePetForTutor, useUpdatePet } from '@/api/petApi';
import { useTutors } from '@/api/tutorApi';
import { useToast } from '@/hooks/useToast';
import { COMMON_SPECIES } from '@/constants';
import type { Pet } from '@/types';

interface PetFormProps {
  pet?: Pet;
  tutorId?: number;
  onSuccess?: (pet: Pet) => void;
  onCancel?: () => void;
  className?: string;
}

export function PetForm({ pet, tutorId, onSuccess, onCancel, className }: PetFormProps) {
  const { toast } = useToast();
  const isEditing = !!pet;
  
  // DEBUG: Log para verificar o tutorId recebido
  console.log('🔍 PetForm - tutorId recebido:', tutorId, 'tipo:', typeof tutorId);
  
  const createPetMutation = useCreatePet();
  const createPetForTutorMutation = useCreatePetForTutor();
  const updatePetMutation = useUpdatePet();
  const { data: tutors, isLoading: tutorsLoading } = useTutors({ page: 1, limit: 100 });
  
  const form = useForm<PetFormData | PetUpdateData>({
    resolver: zodResolver(isEditing ? petUpdateSchema : petSchema),
    defaultValues: isEditing ? {
      name: pet.name,
      species: pet.species,
      breed: pet.breed || '',
      birthDate: pet.birthDate ? new Date(pet.birthDate).toISOString().split('T')[0] : '',
      tutorId: pet.tutorId,
    } : {
      name: '',
      species: '',
      breed: '',
      birthDate: '',
      tutorId: tutorId || 0,
    },
  });

  const { handleSubmit, formState: { errors, isSubmitting }, reset, watch } = form;
  const selectedSpecies = watch('species');
  const isLoading = isSubmitting || createPetMutation.isPending || createPetForTutorMutation.isPending || updatePetMutation.isPending;

  const onSubmit = async (data: PetFormData | PetUpdateData) => {
    try {
      // Filtrar apenas os campos válidos do schema Prisma Pet
      const validPetFields = {
        name: data.name,
        species: data.species,
        breed: data.breed,
        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        tutorId: data.tutorId
      };
      
      // DEBUG: Log para verificar os dados enviados
      console.log('🔍 DADOS ENVIADOS PARA A API:', {
        isEditing,
        tutorId,
        formattedData: validPetFields,
        originalData: data
      });
      
      let result: Pet;
      
      if (isEditing) {
        result = await updatePetMutation.mutateAsync({
          id: pet.id,
          data: validPetFields as PetUpdateData,
        });
        toast({
          title: 'Sucesso!',
          description: 'Pet atualizado com sucesso.',
          variant: 'default',
        });
      } else {
        if (tutorId) {
          // Usar a nova API para criar pet para tutor específico
          const { tutorId: _, ...petData } = validPetFields as PetFormData;
          result = await createPetForTutorMutation.mutateAsync({
            tutorId: tutorId,
            data: petData
          });
        } else {
          // Usar a API geral de criação de pets
          result = await createPetMutation.mutateAsync(validPetFields as PetFormData);
        }
        toast({
          title: 'Sucesso!',
          description: 'Pet cadastrado com sucesso.',
          variant: 'default',
        });
        reset();
      }
      
      onSuccess?.(result);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao salvar o pet.',
        variant: 'destructive',
      });
    }
  };

  // Opções de espécies
  const speciesOptions = COMMON_SPECIES.map(species => ({
    value: species,
    label: species,
  }));

  // Opções de tutores
  const tutorOptions = tutors?.data?.map(tutor => ({
    value: tutor.id,
    label: `${tutor.name} - ${tutor.email}`,
  })) || [];

  // Raças comuns baseadas na espécie selecionada
  const getBreedOptions = (species: string) => {
    const breedMap: Record<string, string[]> = {
      'Cão': [
        'Labrador', 'Golden Retriever', 'Pastor Alemão', 'Bulldog', 'Poodle',
        'Rottweiler', 'Yorkshire', 'Chihuahua', 'Boxer', 'Dálmata', 'SRD (Sem Raça Definida)'
      ],
      'Gato': [
        'Persa', 'Siamês', 'Maine Coon', 'Ragdoll', 'British Shorthair',
        'Sphynx', 'Bengal', 'Abissínio', 'SRD (Sem Raça Definida)'
      ],
      'Pássaro': [
        'Canário', 'Periquito', 'Calopsita', 'Papagaio', 'Bem-te-vi',
        'Sabiá', 'Curió', 'Trinca-ferro'
      ],
      'Peixe': [
        'Betta', 'Guppy', 'Neon', 'Acará', 'Oscar', 'Kinguio', 'Platy'
      ],
    };
    
    return breedMap[species]?.map(breed => ({ value: breed, label: breed })) || [];
  };

  const breedOptions = getBreedOptions(selectedSpecies);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={className}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Nome do pet"
            placeholder="Digite o nome do pet"
            required
            error={errors.name?.message}
            disabled={isLoading}
            {...form.register('name')}
          />
          
          <SelectField
            label="Tutor"
            placeholder="Selecione o tutor"
            required
            options={tutorOptions}
            error={errors.tutorId?.message}
            disabled={isLoading || tutorsLoading || !!tutorId}
            {...form.register('tutorId')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectField
            label="Espécie"
            placeholder="Selecione a espécie"
            required
            options={speciesOptions}
            error={errors.species?.message}
            disabled={isLoading}
            {...form.register('species')}
          />
          
          {selectedSpecies && breedOptions.length > 0 && (
            <SelectField
              label="Raça"
              placeholder="Selecione a raça"
              options={breedOptions}
              error={errors.breed?.message}
              disabled={isLoading}
              {...form.register('breed')}
            />
          )}
          
          {(!selectedSpecies || breedOptions.length === 0) && (
            <InputField
              label="Raça"
              placeholder="Digite a raça"
              error={errors.breed?.message}
              disabled={isLoading}
              {...form.register('breed')}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          <InputField
            label="Data de nascimento"
            type="date"
            error={errors.birthDate?.message}
            disabled={isLoading}
            {...form.register('birthDate')}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4 mt-8">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
        )}
        
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[120px]"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" color="white" className="mr-2" />
              {isEditing ? 'Atualizando...' : 'Cadastrando...'}
            </>
          ) : (
            isEditing ? 'Atualizar' : 'Cadastrar'
          )}
        </Button>
      </div>
    </form>
  );
}

// Componente de formulário em modal
interface PetFormModalProps extends PetFormProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function PetFormModal({ 
  isOpen, 
  onClose, 
  title, 
  pet, 
  onSuccess,
  ...props 
}: PetFormModalProps) {
  const handleSuccess = (result: Pet) => {
    onSuccess?.(result);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {title || (pet ? 'Editar Pet' : 'Novo Pet')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <PetForm
            pet={pet}
            tutorId={props.tutorId}
            onSuccess={handleSuccess}
            onCancel={onClose}
            {...props}
          />
        </div>
      </div>
    </div>
  );
}