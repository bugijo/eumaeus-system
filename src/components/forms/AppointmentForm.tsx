import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { InputField, SelectField, TextareaField } from '@/components/ui/FormField';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/useToast';
import { useCreateAppointment, useUpdateAppointment, useDeleteAppointment } from '@/api/appointmentApi';
import { usePets } from '@/api/petApi';

// Schema de validação para agendamento
const appointmentSchema = z.object({
  petId: z.string().min(1, 'Pet é obrigatório'),
  tutorId: z.string().min(1, 'Tutor é obrigatório'),
  serviceType: z.string().min(1, 'Tipo de serviço é obrigatório'),
  date: z.string().min(1, 'Data é obrigatória'),
  time: z.string().min(1, 'Horário é obrigatório'),
  status: z.enum(['Agendado', 'Confirmado', 'Cancelado']).default('Agendado')
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  appointment?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AppointmentForm({ appointment, onSuccess, onCancel }: AppointmentFormProps) {
  const { toast } = useToast();
  const isEditing = !!appointment;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const createAppointmentMutation = useCreateAppointment();
  const updateAppointmentMutation = useUpdateAppointment();
  const deleteAppointmentMutation = useDeleteAppointment();
  const { data: petsData, isLoading: petsLoading } = usePets();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: appointment ? {
      petId: appointment.petId?.toString() || '',
      tutorId: appointment.tutorId?.toString() || '',
      serviceType: appointment.serviceType || '',
      date: appointment.date || '',
      time: appointment.time || '',
      status: appointment.status || 'Agendado'
    } : {
      petId: '',
      tutorId: '',
      serviceType: '',
      date: '',
      time: '',
      status: 'Agendado'
    }
  });

  const onSubmit = async (data: AppointmentFormData) => {
    try {
      const appointmentData = {
        petId: parseInt(data.petId),
        tutorId: parseInt(data.tutorId),
        date: data.date,
        time: data.time,
        serviceType: data.serviceType,
        status: data.status
      };
      
      if (isEditing) {
        await updateAppointmentMutation.mutateAsync({
          id: appointment.id,
          data: appointmentData
        });
        
        toast({
          title: 'Agendamento atualizado!',
          description: 'O agendamento foi atualizado com sucesso.',
          variant: 'default'
        });
      } else {
        await createAppointmentMutation.mutateAsync(appointmentData);
        
        toast({
          title: 'Agendamento criado!',
          description: 'O novo agendamento foi criado com sucesso.',
          variant: 'default'
        });
      }
      
      reset();
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      toast({
        title: 'Erro',
        description: `Ocorreu um erro ao ${isEditing ? 'atualizar' : 'criar'} o agendamento. Tente novamente.`,
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAppointmentMutation.mutateAsync(appointment.id);
      
      toast({
        title: 'Agendamento deletado!',
        description: 'O agendamento foi deletado com sucesso.',
        variant: 'default'
      });
      
      setShowDeleteConfirm(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao deletar o agendamento. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  // Opções para os selects
  const serviceOptions = [
    { value: 'Consulta Geral', label: 'Consulta Geral' },
    { value: 'Vacinação', label: 'Vacinação' },
    { value: 'Cirurgia', label: 'Cirurgia' },
    { value: 'Dermatologia', label: 'Dermatologia' },
    { value: 'Exame Sangue', label: 'Exame de Sangue' },
    { value: 'Limpeza Dental', label: 'Limpeza Dental' },
    { value: 'Castração', label: 'Castração' },
    { value: 'Emergência', label: 'Emergência' }
  ];

  const statusOptions = [
    { value: 'Agendado', label: 'Agendado' },
    { value: 'Confirmado', label: 'Confirmado' },
    { value: 'Pendente', label: 'Pendente' },
    { value: 'Cancelado', label: 'Cancelado' }
  ];

  // Opções de pets vindas da API
  const petOptions = petsData?.data?.map(pet => ({
    value: pet.id.toString(),
    label: `${pet.name} (${pet.species})`
  })) || [];
  
  // Opções de tutores baseadas nos pets
  const tutorOptions = petsData?.data?.reduce((acc, pet) => {
    if (pet.tutor && !acc.find(t => t.value === pet.tutorId.toString())) {
      acc.push({
        value: pet.tutorId.toString(),
        label: pet.tutor.name
      });
    }
    return acc;
  }, [] as { value: string; label: string }[]) || [];

  return (
    <>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label="Pet"
          {...register('petId')}
          error={errors.petId?.message}
          required
          options={petOptions}
          placeholder="Selecione o pet"
          disabled={petsLoading}
        />

        <SelectField
          label="Tutor"
          {...register('tutorId')}
          error={errors.tutorId?.message}
          required
          options={tutorOptions}
          placeholder="Selecione o tutor"
          disabled={petsLoading}
        />

        <SelectField
          label="Tipo de Serviço"
          {...register('serviceType')}
          error={errors.serviceType?.message}
          required
          options={serviceOptions}
          placeholder="Selecione o serviço"
        />

        <SelectField
          label="Status"
          {...register('status')}
          error={errors.status?.message}
          options={statusOptions}
        />

        <InputField
          label="Data"
          type="date"
          {...register('date')}
          error={errors.date?.message}
          required
        />

        <InputField
          label="Horário"
          type="time"
          {...register('time')}
          error={errors.time?.message}
          required
        />
      </div>

      <div className="flex justify-between pt-4">
        {/* Botão de deletar à esquerda (apenas quando editando) */}
        {isEditing && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isSubmitting || deleteAppointmentMutation.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {deleteAppointmentMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Deletando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Deletar
              </>
            )}
          </Button>
        )}
        
        {/* Botões de ação à direita */}
        <div className="flex space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || createAppointmentMutation.isPending || updateAppointmentMutation.isPending}
            className="gradient-eumaeus-blue text-white hover:opacity-90"
          >
            {(isSubmitting || createAppointmentMutation.isPending || updateAppointmentMutation.isPending) ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                {isEditing ? 'Atualizando...' : 'Criando...'}
              </>
            ) : (
              isEditing ? 'Atualizar Agendamento' : 'Criar Agendamento'
            )}
          </Button>
        </div>
      </div>
    </form>
    
    {/* Modal de Confirmação de Deleção */}
    {showDeleteConfirm && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Confirmar Exclusão
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Você tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteAppointmentMutation.isPending}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleDelete}
                disabled={deleteAppointmentMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteAppointmentMutation.isPending ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Deletando...
                  </>
                ) : (
                  'Confirmar Exclusão'
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

// Modal Component
interface AppointmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment?: any;
  onSuccess: () => void;
}

export function AppointmentFormModal({ isOpen, onClose, appointment, onSuccess }: AppointmentFormModalProps) {
  if (!isOpen) return null;

  const handleSuccess = () => {
    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
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
        
        <div className="p-6">
          <AppointmentForm
            appointment={appointment}
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}