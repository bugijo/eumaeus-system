import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  PawPrint, 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Heart,
  Calendar,
  User,
  Trash2,
  FileText
} from 'lucide-react';
import { usePets, useDeletePet } from '@/api/petApi';
import { PetFormModal } from '@/components/forms/PetForm';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Pet } from '@/types';

const Pets = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [petToDelete, setPetToDelete] = useState<Pet | null>(null);

  // Buscar pets da API
  const {
    data: petsData,
    isLoading,
    isError,
    error
  } = usePets({ page: 1, limit: 100 });

  // Hook para deletar pet
  const deletePetMutation = useDeletePet();

  const pets = petsData?.data || [];

  // Filtrar pets baseado no termo de busca
  const filteredPets = pets.filter(pet =>
    pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pet.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pet.breed && pet.breed.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getSpeciesIcon = (species: string) => {
    return species === 'Cão' ? '🐕' : '🐱';
  };

  const handleEditPet = (pet: Pet) => {
    setEditingPet(pet);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPet(null);
  };

  const handleCreatePet = () => {
    setEditingPet(null);
    setIsModalOpen(true);
  };

  const handleDeletePet = (pet: Pet) => {
    setPetToDelete(pet);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (petToDelete) {
      deletePetMutation.mutate(petToDelete.id, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setPetToDelete(null);
          // Aqui você pode adicionar uma notificação de sucesso
        },
        onError: (error) => {
          // Aqui você pode adicionar uma notificação de erro
          console.error('Erro ao excluir pet:', error);
        }
      });
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setPetToDelete(null);
  };

  const handleViewMedicalHistory = (pet: Pet) => {
    navigate(`/prontuario/${pet.id}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-lg">Carregando pets...</span>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-500 text-lg">Erro ao carregar pets</div>
        <div className="text-gray-600">{error?.message || 'Ocorreu um erro inesperado'}</div>
        <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg gradient-pink flex items-center justify-center">
            <PawPrint className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gradient">Gestão de Pets</h1>
        </div>
        <Button 
          className="gradient-pink text-white hover:opacity-90"
          onClick={handleCreatePet}
        >
          <Plus className="h-4 w-4 mr-2" />
          Cadastrar Pet
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="card-vet">
        <CardHeader className="border-gradient">
          <CardTitle className="text-gradient">Buscar Pets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, espécie, raça ou tutor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="btn-primary-vet">
              Filtros Avançados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-vet border-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Pets
            </CardTitle>
            <div className="p-2 rounded-lg gradient-pink">
              <PawPrint className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{pets.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Cadastrados no sistema
            </div>
          </CardContent>
        </Card>

        <Card className="card-vet border-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cães
            </CardTitle>
            <div className="p-2 rounded-lg gradient-pink">
              <span className="text-white text-sm">🐕</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {pets.filter(pet => pet.species === 'Cão').length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Caninos cadastrados
            </div>
          </CardContent>
        </Card>

        <Card className="card-vet border-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gatos
            </CardTitle>
            <div className="p-2 rounded-lg gradient-pink">
              <span className="text-white text-sm">🐱</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {pets.filter(pet => pet.species === 'Gato').length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Felinos cadastrados
            </div>
          </CardContent>
        </Card>

        <Card className="card-vet border-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outras Espécies
            </CardTitle>
            <div className="p-2 rounded-lg gradient-pink">
              <Heart className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {pets.filter(pet => pet.species !== 'Cão' && pet.species !== 'Gato').length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Outras espécies cadastradas
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pets Table */}
      <Card className="card-vet">
        <CardHeader className="border-gradient">
          <CardTitle className="text-gradient">Lista de Pets ({filteredPets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pet</TableHead>
                <TableHead>Espécie/Raça</TableHead>
                <TableHead>Idade/Peso</TableHead>
                <TableHead>Tutor</TableHead>
                <TableHead>Última Consulta</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Próxima Vacina</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPets.map((pet) => {
                const age = pet.birthDate ? 
                  Math.floor((new Date().getTime() - new Date(pet.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365)) 
                  : 'N/A';
                
                return (
                  <TableRow key={pet.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getSpeciesIcon(pet.species)}</span>
                        <div>
                          <div className="font-medium text-foreground">{pet.name}</div>
                          <div className="text-sm text-muted-foreground">ID: {pet.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{pet.species}</div>
                        <div className="text-sm text-muted-foreground">{pet.breed || 'Não informado'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{age} anos</div>
                        <div className="text-sm text-muted-foreground">{pet.weight ? `${pet.weight}kg` : 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{pet.tutor?.name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{pet.tutor?.phone || 'N/A'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">N/A</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">
                        Ativo
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        N/A
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleViewMedicalHistory(pet)}
                          title="Ver Prontuário"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEditPet(pet)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeletePet(pet)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de criação de pet */}
      <PetFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        pet={editingPet}
        onSuccess={() => {
          handleCloseModal();
        }}
      />

      {/* Modal de confirmação de exclusão */}
      {isDeleteModalOpen && petToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar Exclusão
            </h3>
            <p className="text-gray-600 mb-6">
              Você tem certeza que deseja excluir <strong>{petToDelete.name}</strong>? 
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={handleCancelDelete}
                disabled={deletePetMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmDelete}
                disabled={deletePetMutation.isPending}
              >
                {deletePetMutation.isPending ? 'Excluindo...' : 'Confirmar Exclusão'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pets;