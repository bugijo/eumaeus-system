'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { LoadingWithText, FullPageLoading } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorBoundary';
import { PetFormModal } from '@/components/forms/PetForm';
import { usePets, useDeletePet } from '@/api/petApi';
import { useTutors } from '@/api/tutorApi';
import { useToast } from '@/hooks/useToast';
import { PAGINATION, COMMON_SPECIES } from '@/constants';
import type { Pet, PetSearchParams } from '@/types';

interface PetsPageProps {
  className?: string;
}

export function PetsPage({ className }: PetsPageProps) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams, setSearchParams] = useState<PetSearchParams>({});
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [selectedTutor, setSelectedTutor] = useState('');
  
  const deletePetMutation = useDeletePet();
  
  // Query para buscar pets
  const {
    data: petsData,
    isLoading,
    isError,
    error,
    refetch
  } = usePets({
    page: currentPage,
    limit: PAGINATION.DEFAULT_PAGE_SIZE,
    ...searchParams,
  });

  // Query para buscar tutores (para filtro)
  const { data: tutorsData } = useTutors({ page: 1, limit: 100 });

  // Colunas da tabela
  const columns = [
    {
      key: 'name' as keyof Pet,
      label: 'Nome',
      sortable: true,
    },
    {
      key: 'species' as keyof Pet,
      label: 'Espécie',
      sortable: true,
    },
    {
      key: 'breed' as keyof Pet,
      label: 'Raça',
      sortable: false,
      render: (value: string) => value || '-',
    },
    {
      key: 'tutor' as keyof Pet,
      label: 'Tutor',
      sortable: false,
      render: (value: any) => value?.name || '-',
    },
    {
      key: 'birthDate' as keyof Pet,
      label: 'Idade',
      sortable: true,
      render: (value: string) => {
        if (!value) return '-';
        const birthDate = new Date(value);
        const today = new Date();
        const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                           (today.getMonth() - birthDate.getMonth());
        
        if (ageInMonths < 12) {
          return `${ageInMonths} ${ageInMonths === 1 ? 'mês' : 'meses'}`;
        } else {
          const years = Math.floor(ageInMonths / 12);
          const months = ageInMonths % 12;
          if (months === 0) {
            return `${years} ${years === 1 ? 'ano' : 'anos'}`;
          }
          return `${years}a ${months}m`;
        }
      },
    },
    {
      key: 'weight' as keyof Pet,
      label: 'Peso',
      sortable: false,
      render: (value: number) => value ? `${value} kg` : '-',
    },
  ];

  // Handlers
  const handleSearch = () => {
    const params: PetSearchParams = {};
    
    if (searchTerm) params.search = searchTerm;
    if (selectedSpecies) params.species = selectedSpecies;
    if (selectedTutor) params.tutorId = selectedTutor;
    
    setSearchParams(params);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedSpecies('');
    setSelectedTutor('');
    setSearchParams({});
    setCurrentPage(1);
  };

  const handleEdit = (pet: Pet) => {
    setSelectedPet(pet);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (pet: Pet) => {
    if (!confirm(`Tem certeza que deseja excluir o pet "${pet.name}"?`)) {
      return;
    }

    try {
      await deletePetMutation.mutateAsync(pet.id);
      toast({
        title: 'Sucesso!',
        description: 'Pet excluído com sucesso.',
        variant: 'default',
      });
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir pet.',
        variant: 'destructive',
      });
    }
  };

  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    setSelectedPet(null);
    refetch();
  };

  const handleFormCancel = () => {
    setIsFormModalOpen(false);
    setSelectedPet(null);
  };

  const handleNewPet = () => {
    setSelectedPet(null);
    setIsFormModalOpen(true);
  };

  // Loading state
  if (isLoading && currentPage === 1) {
    return <FullPageLoading text="Carregando pets..." />;
  }

  // Error state
  if (isError) {
    return (
      <div className={className}>
        <ErrorDisplay
          title="Erro ao carregar pets"
          message={error?.message || 'Ocorreu um erro ao carregar a lista de pets.'}
          onRetry={() => refetch()}
          showDetails
          error={error as Error}
        />
      </div>
    );
  }

  const pets = petsData?.data || [];
  const totalPages = petsData?.pagination?.totalPages || 1;
  const totalItems = petsData?.pagination?.total || 0;
  const tutors = tutorsData?.data || [];

  const hasActiveFilters = searchTerm || selectedSpecies || selectedTutor;

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pets</h1>
            <p className="text-gray-600 mt-1">
              Gerencie os pets cadastrados no sistema
            </p>
          </div>
          
          <Button onClick={handleNewPet}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Novo Pet
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg border p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <input
              type="text"
              placeholder="Nome do pet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Species Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Espécie
            </label>
            <select
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas as espécies</option>
              {COMMON_SPECIES.map(species => (
                <option key={species} value={species}>{species}</option>
              ))}
            </select>
          </div>

          {/* Tutor Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tutor
            </label>
            <select
              value={selectedTutor}
              onChange={(e) => setSelectedTutor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os tutores</option>
              {tutors.map(tutor => (
                <option key={tutor.id} value={tutor.id}>{tutor.name}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-end space-x-2">
            <Button onClick={handleSearch} className="flex-1">
              Filtrar
            </Button>
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                onClick={handleClearFilters}
                className="flex-1"
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {totalItems} {totalItems === 1 ? 'pet encontrado' : 'pets encontrados'}
              {hasActiveFilters && ' (filtrado)'}
            </span>
            {isLoading && (
              <LoadingWithText text="Atualizando..." size="sm" />
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border">
        <DataTable
          data={pets}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoading}
          emptyMessage="Nenhum pet encontrado"
          emptyDescription="Comece cadastrando o primeiro pet do sistema."
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Página {currentPage} de {totalPages}
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              Anterior
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || isLoading}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <PetFormModal
        isOpen={isFormModalOpen}
        onClose={handleFormCancel}
        pet={selectedPet || undefined}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
}