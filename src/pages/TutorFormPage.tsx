import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { tutorSchema, type TutorFormData } from '../schemas/tutorSchema';
import { TutorService } from '../services/tutorService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, User, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const TutorFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Determina se está no modo de edição
  const isEditMode = Boolean(id);
  const tutorId = id ? parseInt(id, 10) : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<TutorFormData>({
    resolver: zodResolver(tutorSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: ''
    }
  });
  
  // Busca os dados do tutor se estiver no modo de edição
  const { data: tutorData, isLoading: isLoadingTutor, error: tutorError } = useQuery({
    queryKey: ['tutor', tutorId],
    queryFn: () => TutorService.findById(tutorId!),
    enabled: isEditMode && tutorId !== null,
  });
  
  // Preenche o formulário quando os dados do tutor chegam
  useEffect(() => {
    if (tutorData && isEditMode) {
      reset({
        name: tutorData.name,
        email: tutorData.email,
        phone: tutorData.phone,
        address: tutorData.address || ''
      });
    }
  }, [tutorData, reset, isEditMode]);

  const onSubmit = async (data: TutorFormData) => {
    setIsSubmitting(true);
    
    try {
      if (isEditMode && tutorId) {
        // Modo de edição - atualiza o tutor existente
        await TutorService.update(tutorId, data);
        
        toast({
          title: 'Sucesso!',
          description: 'Tutor atualizado com sucesso.',
          variant: 'default'
        });
      } else {
        // Modo de criação - cria um novo tutor
        await TutorService.create(data);
        
        toast({
          title: 'Sucesso!',
          description: 'Tutor cadastrado com sucesso.',
          variant: 'default'
        });
      }
      
      navigate('/tutores');
    } catch (error) {
      console.error('Erro ao salvar tutor:', error);
      
      toast({
        title: 'Erro',
        description: isEditMode 
          ? 'Falha ao atualizar tutor. Tente novamente.'
          : 'Falha ao cadastrar tutor. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Loading state para modo de edição
  if (isEditMode && isLoadingTutor) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Carregando dados do tutor...</span>
          </div>
        </div>
      </div>
    );
  }
  
  // Error state para modo de edição
  if (isEditMode && tutorError) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-2">❌ Erro ao carregar tutor</div>
            <p className="text-sm text-gray-600 mb-4">
              {tutorError instanceof Error ? tutorError.message : 'Erro desconhecido'}
            </p>
            <Button onClick={() => navigate('/tutores')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Lista
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Se estiver no modo de edição mas não encontrou o tutor
  if (isEditMode && tutorData === null) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-yellow-500 mb-2">⚠️ Tutor não encontrado</div>
            <p className="text-sm text-gray-600 mb-4">
              O tutor que você está tentando editar não foi encontrado.
            </p>
            <Button onClick={() => navigate('/tutores')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Lista
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/tutores')}
            className="h-9 w-9"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Editar Tutor' : 'Novo Tutor'}
            </h1>
            <p className="text-sm text-gray-600">
              {isEditMode 
                ? 'Atualize as informações do tutor'
                : 'Cadastre um novo tutor no sistema'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Formulário */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Informações do Tutor</span>
          </CardTitle>
          <CardDescription>
            {isEditMode 
              ? 'Atualize as informações do tutor conforme necessário'
              : 'Preencha os dados do tutor para cadastrá-lo no sistema'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Nome */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                placeholder="Digite o nome completo"
                {...register('name')}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Telefone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone *</Label>
              <Input
                id="phone"
                placeholder="(11) 99999-9999"
                {...register('phone')}
                className={errors.phone ? 'border-red-500' : ''}
              />
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>

            {/* Endereço */}
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Textarea
                id="address"
                placeholder="Rua, número, bairro, cidade, estado"
                rows={3}
                {...register('address')}
                className={errors.address ? 'border-red-500' : ''}
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address.message}</p>
              )}
            </div>

            {/* Botões */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/tutores')}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>
                  {isSubmitting 
                    ? (isEditMode ? 'Atualizando...' : 'Salvando...') 
                    : (isEditMode ? 'Atualizar Tutor' : 'Salvar Tutor')
                  }
                </span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default TutorFormPage;