'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/DataTable';
import { LoadingWithText, FullPageLoading } from '@/components/ui/LoadingSpinner';
import { ErrorDisplay } from '@/components/ui/ErrorBoundary';
import { TutorFormModal } from '@/components/forms/TutorForm';
import { useTutors, useDeleteTutor } from '@/api/tutorApi';
import { useToast } from '@/hooks/useToast';
import { PAGINATION } from '@/constants';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Tutor, TutorSearchParams } from '@/types';

interface TutorsPageProps {
  className?: string;
}

export function TutorsPage({ className }: TutorsPageProps) {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchParams, setSearchParams] = useState<TutorSearchParams>({});
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [tutorToDelete, setTutorToDelete] = useState<Tutor | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const deleteTutorMutation = useDeleteTutor();
  
  // Query para buscar tutores
  const {
    data: tutorsData,
    isLoading,
    isError,
    error,
    refetch
  } = useTutors({
    page: currentPage,
    limit: PAGINATION.DEFAULT_PAGE_SIZE,
    ...searchParams,
  });

  // Colunas da tabela
  const columns = [
    {
      key: 'name' as keyof Tutor,
      label: 'Nome',
      sortable: true,
    },
    {
      key: 'email' as keyof Tutor,
      label: 'E-mail',
      sortable: true,
    },
    {
      key: 'phone' as keyof Tutor,
      label: 'Telefone',
      sortable: false,
    },
    {
      key: 'address' as keyof Tutor,
      label: 'Endereço',
      sortable: false,
      render: (value: string) => value || '-',
    },
    {
      key: 'createdAt' as keyof Tutor,
      label: 'Cadastrado em',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString('pt-BR'),
    },
  ];

  // Handlers
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setSearchParams({ search: term || undefined });
    setCurrentPage(1);
  };

  const handleEdit = (tutor: Tutor) => {
    setSelectedTutor(tutor);
    setIsFormModalOpen(true);
  };

  const handleDelete = (tutor: Tutor) => {
    setTutorToDelete(tutor);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!tutorToDelete) return;

    try {
      await deleteTutorMutation.mutateAsync(tutorToDelete.id);
      toast({
        title: 'Sucesso!',
        description: 'Tutor excluído com sucesso.',
        variant: 'default',
      });
      setIsDeleteModalOpen(false);
      setTutorToDelete(null);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir tutor.',
        variant: 'destructive',
      });
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setTutorToDelete(null);
  };

  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    setSelectedTutor(null);
    refetch();
  };

  const handleFormCancel = () => {
    setIsFormModalOpen(false);
    setSelectedTutor(null);
  };

  const handleNewTutor = () => {
    setSelectedTutor(null);
    setIsFormModalOpen(true);
  };

  // Loading state
  if (isLoading && currentPage === 1) {
    return <FullPageLoading text="Carregando tutores..." />;
  }

  // Error state
  if (isError) {
    return (
      <div className={className}>
        <ErrorDisplay
          title="Erro ao carregar tutores"
          message={error?.message || 'Ocorreu um erro ao carregar a lista de tutores.'}
          onRetry={() => refetch()}
          showDetails
          error={error as Error}
        />
      </div>
    );
  }

  const tutors = tutorsData?.data || [];
  const totalPages = tutorsData?.pagination?.totalPages || 1;
  const totalItems = tutorsData?.pagination?.total || 0;

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tutores</h1>
            <p className="text-gray-600 mt-1">
              Gerencie os tutores cadastrados no sistema
            </p>
          </div>
          
          <Button onClick={handleNewTutor}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Novo Tutor
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar por nome ou e-mail..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              {totalItems} {totalItems === 1 ? 'tutor encontrado' : 'tutores encontrados'}
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
          data={tutors}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isLoading={isLoading}
          emptyMessage="Nenhum tutor encontrado"
          emptyDescription="Comece cadastrando o primeiro tutor do sistema."
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
      <TutorFormModal
        isOpen={isFormModalOpen}
        onClose={handleFormCancel}
        tutor={selectedTutor || undefined}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir o tutor <strong>"{tutorToDelete?.name}"</strong>?
              <br />
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={cancelDelete}
              disabled={deleteTutorMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteTutorMutation.isPending}
            >
              {deleteTutorMutation.isPending ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}