'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { InputField, TextareaField } from '@/components/ui/FormField';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { tutorSchema, tutorUpdateSchema, type TutorFormData, type TutorUpdateData } from '@/schemas/tutorSchema';
import { useCreateTutor, useUpdateTutor } from '@/api/tutorApi';
import { useToast } from '@/hooks/useToast';
import type { Tutor } from '@/types';

interface TutorFormProps {
  tutor?: Tutor;
  onSuccess?: (tutor: Tutor) => void;
  onCancel?: () => void;
  className?: string;
}

export function TutorForm({ tutor, onSuccess, onCancel, className }: TutorFormProps) {
  const { toast } = useToast();
  const isEditing = !!tutor;
  
  const createTutorMutation = useCreateTutor();
  const updateTutorMutation = useUpdateTutor();
  
  const form = useForm<TutorFormData | TutorUpdateData>({
    resolver: zodResolver(isEditing ? tutorUpdateSchema : tutorSchema),
    defaultValues: isEditing ? {
      name: tutor.name,
      email: tutor.email,
      phone: tutor.phone,
      address: tutor.address || '',
      notes: tutor.notes || '',
    } : {
      name: '',
      email: '',
      phone: '',
      address: '',
      notes: '',
    },
  });

  const { handleSubmit, formState: { errors, isSubmitting }, reset } = form;

  const onSubmit = async (data: TutorFormData | TutorUpdateData) => {
    try {
      let result: Tutor;
      
      if (isEditing) {
        result = await updateTutorMutation.mutateAsync({
          id: tutor.id,
          data: data as TutorUpdateData,
        });
        toast({
          title: 'Sucesso!',
          description: 'Tutor atualizado com sucesso.',
          variant: 'default',
        });
      } else {
        result = await createTutorMutation.mutateAsync(data as TutorFormData);
        toast({
          title: 'Sucesso!',
          description: 'Tutor cadastrado com sucesso.',
          variant: 'default',
        });
        reset();
      }
      
      onSuccess?.(result);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao salvar o tutor.',
        variant: 'destructive',
      });
    }
  };

  const isLoading = createTutorMutation.isPending || updateTutorMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={className}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Nome completo"
            placeholder="Digite o nome completo"
            required
            error={errors.name?.message}
            disabled={isLoading}
            {...form.register('name')}
          />
          
          <InputField
            label="E-mail"
            type="email"
            placeholder="Digite o e-mail"
            required
            error={errors.email?.message}
            disabled={isLoading}
            {...form.register('email')}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Telefone"
            type="tel"
            placeholder="(11) 99999-9999"
            required
            error={errors.phone?.message}
            disabled={isLoading}
            {...form.register('phone')}
          />
          
          <InputField
            label="Endereço"
            placeholder="Digite o endereço completo"
            error={errors.address?.message}
            disabled={isLoading}
            {...form.register('address')}
          />
        </div>

        <TextareaField
          label="Observações"
          placeholder="Observações adicionais sobre o tutor..."
          rows={4}
          error={errors.notes?.message}
          disabled={isLoading}
          {...form.register('notes')}
        />
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
interface TutorFormModalProps extends TutorFormProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function TutorFormModal({ 
  isOpen, 
  onClose, 
  title, 
  tutor, 
  onSuccess,
  ...props 
}: TutorFormModalProps) {
  const handleSuccess = (result: Tutor) => {
    onSuccess?.(result);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {title || (tutor ? 'Editar Tutor' : 'Novo Tutor')}
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
          <TutorForm
            tutor={tutor}
            onSuccess={handleSuccess}
            onCancel={onClose}
            {...props}
          />
        </div>
      </div>
    </div>
  );
}