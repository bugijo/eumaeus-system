import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/useToast';

// Schema de validação para cliente
const clientSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 caracteres'),
  cpf: z.string().min(11, 'CPF deve ter 11 caracteres'),
  endereco: z.string().optional(),
  observacoes: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface Client {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  endereco?: string;
  observacoes?: string;
  petsCadastrados: number;
  ultimaVisita: string;
  status: string;
}

interface ClientFormProps {
  client?: Client;
  onSuccess?: (client: Client) => void;
  onCancel?: () => void;
  className?: string;
}

export function ClientForm({ client, onSuccess, onCancel, className }: ClientFormProps) {
  const { toast } = useToast();
  const isEditing = !!client;
  
  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: isEditing ? {
      nome: client.nome,
      email: client.email,
      telefone: client.telefone,
      cpf: client.cpf,
      endereco: client.endereco || '',
      observacoes: client.observacoes || '',
    } : {
      nome: '',
      email: '',
      telefone: '',
      cpf: '',
      endereco: '',
      observacoes: '',
    },
  });

  const { handleSubmit, register, formState: { errors, isSubmitting } } = form;

  const onSubmit = async (data: ClientFormData) => {
    try {
      // Simular salvamento (aqui você integraria com a API)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const result: Client = {
        id: client?.id || Date.now(),
        ...data,
        petsCadastrados: client?.petsCadastrados || 0,
        ultimaVisita: client?.ultimaVisita || new Date().toISOString().split('T')[0],
        status: client?.status || 'Ativo',
      };
      
      toast({
        title: 'Sucesso!',
        description: `Cliente ${isEditing ? 'atualizado' : 'cadastrado'} com sucesso.`,
        variant: 'default',
      });
      
      onSuccess?.(result);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Ocorreu um erro ao salvar o cliente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={className}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <Input
              {...register('nome')}
              placeholder="Nome completo"
              className={errors.nome ? 'border-red-500' : ''}
            />
            {errors.nome && (
              <p className="text-red-500 text-sm mt-1">{errors.nome.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CPF *
            </label>
            <Input
              {...register('cpf')}
              placeholder="000.000.000-00"
              className={errors.cpf ? 'border-red-500' : ''}
            />
            {errors.cpf && (
              <p className="text-red-500 text-sm mt-1">{errors.cpf.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail *
            </label>
            <Input
              {...register('email')}
              type="email"
              placeholder="email@exemplo.com"
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefone *
            </label>
            <Input
              {...register('telefone')}
              placeholder="(11) 99999-9999"
              className={errors.telefone ? 'border-red-500' : ''}
            />
            {errors.telefone && (
              <p className="text-red-500 text-sm mt-1">{errors.telefone.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Endereço
          </label>
          <Input
            {...register('endereco')}
            placeholder="Endereço completo"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observações
          </label>
          <Textarea
            {...register('observacoes')}
            placeholder="Observações adicionais sobre o cliente"
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
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
          disabled={isSubmitting}
          className="gradient-eumaeus-green text-white hover:opacity-90"
        >
          {isSubmitting && (
            <LoadingSpinner size="sm" className="mr-2" />
          )}
          {isEditing ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
}

// Componente de formulário em modal
interface ClientFormModalProps extends ClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function ClientFormModal({ 
  isOpen, 
  onClose, 
  title, 
  client, 
  onSuccess,
  ...props 
}: ClientFormModalProps) {
  const handleSuccess = (result: Client) => {
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
              {title || (client ? 'Editar Cliente' : 'Novo Cliente')}
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
          <ClientForm
            client={client}
            onSuccess={handleSuccess}
            onCancel={onClose}
            {...props}
          />
        </div>
      </div>
    </div>
  );
}