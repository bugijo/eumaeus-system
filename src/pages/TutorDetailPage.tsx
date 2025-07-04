import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { TutorService } from '../services/tutorService';
import { PetService } from '../services/petService';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { ArrowLeft, Plus, Phone, Mail, MapPin, Calendar, Edit, Trash2 } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PetFormModal } from '../components/forms/PetForm';
import { useDeletePet } from '../api/petApi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Pet } from '../types';

export const TutorDetailPage = () => {
  const { id: tutorId } = useParams<{ id: string }>();
  const [isPetModalOpen, setIsPetModalOpen] = useState(false);
  const [petToEdit, setPetToEdit] = useState<Pet | null>(null);
  const [petToDelete, setPetToDelete] = useState<Pet | null>(null);

  // Hook para exclusão de pet
  const deletePetMutation = useDeletePet();

  // Função para confirmar exclusão do pet
  const handleDeletePet = async () => {
    if (!petToDelete) return;
    
    try {
      await deletePetMutation.mutateAsync(petToDelete.id);
      setPetToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir pet:', error);
    }
  };

  // Query para buscar os dados do tutor
  const { data: tutor, isLoading: isLoadingTutor } = useQuery({
    queryKey: ['tutor', tutorId],
    queryFn: () => TutorService.findById(Number(tutorId!)),
    enabled: !!tutorId,
  });

  // Query para buscar a lista de pets deste tutor
  const { data: pets, isLoading: isLoadingPets } = useQuery({
    queryKey: ['pets', tutorId],
    queryFn: () => PetService.findByTutorId(Number(tutorId!)),
    enabled: !!tutorId,
  });

  if (isLoadingTutor || isLoadingPets) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Tutor não encontrado</h1>
          <Link to="/tutores">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para lista de tutores
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link to="/tutores">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Detalhes do Tutor</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações do Tutor */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-lg">
                    {tutor.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                {tutor.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{tutor.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{tutor.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{tutor.address}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  Cadastrado em {format(new Date(tutor.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Pets */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Pets Cadastrados
                  <Badge variant="secondary">{pets?.length || 0}</Badge>
                </CardTitle>
                <Button size="sm" onClick={() => setIsPetModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Pet
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {pets && pets.length > 0 ? (
                <div className="space-y-4">
                  {pets.map((pet) => (
                    <div
                      key={pet.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-semibold">
                            {pet.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{pet.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Badge variant="outline">{pet.species}</Badge>
                            <span>•</span>
                            <span>{pet.breed}</span>
                            <span>•</span>
                            <span>{pet.weight}kg</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setPetToEdit(pet)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setPetToDelete(pet)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </Button>
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhum pet cadastrado
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Este tutor ainda não possui pets cadastrados no sistema.
                  </p>
                  <Button onClick={() => setIsPetModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Cadastrar Primeiro Pet
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Cadastro/Edição de Pet */}
      <PetFormModal
        isOpen={isPetModalOpen || !!petToEdit}
        onClose={() => {
          setIsPetModalOpen(false);
          setPetToEdit(null);
        }}
        tutorId={tutorId}
        pet={petToEdit}
        title={petToEdit ? 'Editar Pet' : 'Novo Pet'}
        onSuccess={(pet: Pet) => {
          console.log(petToEdit ? 'Pet atualizado com sucesso:' : 'Pet criado com sucesso:', pet);
          setIsPetModalOpen(false);
          setPetToEdit(null);
        }}
      />

      {/* AlertDialog para confirmação de exclusão */}
      <AlertDialog open={!!petToDelete} onOpenChange={() => setPetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o pet <strong>{petToDelete?.name}</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPetToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePet}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletePetMutation.isPending}
            >
              {deletePetMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};