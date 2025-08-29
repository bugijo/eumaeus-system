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
  Users, 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  UserCheck,
  Calendar,
  Trash2,
  Phone,
  Mail
} from 'lucide-react';
import { useTutors, useDeleteTutor, useTutorStats } from '@/api/tutorApi';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Tutor } from '@/types';

export const TutorListPage = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tutorToDelete, setTutorToDelete] = useState<Tutor | null>(null);

  // Buscar tutores da API
  const {
    data: tutorsData,
    isLoading,
    isError,
    error
  } = useTutors({ page: 1, limit: 100 });

  // Hook para deletar tutor
  const deleteTutorMutation = useDeleteTutor();

  // Hook para estatísticas
  const { data: tutorStats, isLoading: isLoadingStats } = useTutorStats();

  const tutors = tutorsData?.data || [];

  // Filtrar tutores baseado no termo de busca
  const filteredTutors = tutors.filter(tutor =>
    tutor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tutor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tutor.phone && tutor.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEditTutor = (tutor: Tutor) => {
    navigate(`/tutores/editar/${tutor.id}`);
  };

  const handleCreateTutor = () => {
    navigate('/tutores/novo');
  };

  const handleDeleteTutor = (tutor: Tutor) => {
    setTutorToDelete(tutor);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (tutorToDelete) {
      deleteTutorMutation.mutate(tutorToDelete.id, {
        onSuccess: () => {
          setIsDeleteModalOpen(false);
          setTutorToDelete(null);
          // Aqui você pode adicionar uma notificação de sucesso
        },
        onError: (error) => {
          // Aqui você pode adicionar uma notificação de erro
          console.error('Erro ao excluir tutor:', error);
        }
      });
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setTutorToDelete(null);
  };

  const handleViewTutor = (tutor: Tutor) => {
    navigate(`/tutores/${tutor.id}`);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
        <span className="ml-2 text-lg">Carregando tutores...</span>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-500 text-lg">Erro ao carregar tutores</div>
        <div className="text-gray-600">{error?.message || 'Ocorreu um erro inesperado'}</div>
        <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg gradient-eumaeus-blue flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gradient">Gestão de Tutores</h1>
        </div>
        <Button 
          className="gradient-eumaeus-green text-white hover:opacity-90"
          onClick={handleCreateTutor}
        >
          <Plus className="h-4 w-4 mr-2" />
          Cadastrar Tutor
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="card-vet">
        <CardHeader className="border-gradient">
          <CardTitle className="text-gradient">Buscar Tutores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
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
              Total de Tutores
            </CardTitle>
            <div className="p-2 rounded-lg gradient-eumaeus-light">
              <Users className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{tutors.length}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Cadastrados no sistema
            </div>
          </CardContent>
        </Card>

        <Card className="card-vet border-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tutores Ativos
            </CardTitle>
            <div className="p-2 rounded-lg gradient-eumaeus-teal">
              <UserCheck className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {isLoadingStats ? '...' : tutorStats?.active ?? 0}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Tutores ativos
            </div>
          </CardContent>
        </Card>

        <Card className="card-vet border-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Com Pets
            </CardTitle>
            <div className="p-2 rounded-lg gradient-eumaeus-cyan">
              <UserCheck className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {tutors.filter(tutor => tutor.pets && tutor.pets.length > 0).length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Tutores com pets cadastrados
            </div>
          </CardContent>
        </Card>

        <Card className="card-vet border-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Novos Este Mês
            </CardTitle>
            <div className="p-2 rounded-lg gradient-eumaeus-blue">
              <Calendar className="h-4 w-4 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {tutors.filter(tutor => {
                const createdAt = new Date(tutor.createdAt || '');
                const now = new Date();
                return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
              }).length}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Cadastrados este mês
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tutors Table */}
      <Card className="card-vet">
        <CardHeader className="border-gradient">
          <CardTitle className="text-gradient">Lista de Tutores ({filteredTutors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tutor</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Pets</TableHead>
                <TableHead>Última Consulta</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Cadastro</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTutors.map((tutor) => {
                const petsCount = tutor.pets ? tutor.pets.length : 0;
                const createdAt = tutor.createdAt ? new Date(tutor.createdAt).toLocaleDateString('pt-BR') : 'N/A';
                
                return (
                  <TableRow key={tutor.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full gradient-eumaeus-green flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{tutor.name}</div>
                          <div className="text-sm text-muted-foreground">ID: {tutor.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{tutor.email}</span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{tutor.phone || 'N/A'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="text-sm truncate">{tutor.address || 'Não informado'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Badge className="bg-blue-100 text-blue-800">
                          {petsCount} pet{petsCount !== 1 ? 's' : ''}
                        </Badge>
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
                        {createdAt}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleViewTutor(tutor)}
                          title="Ver Detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEditTutor(tutor)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteTutor(tutor)}
                          title="Excluir"
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

      {/* Modal de confirmação de exclusão */}
      {isDeleteModalOpen && tutorToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar Exclusão
            </h3>
            <p className="text-gray-600 mb-6">
              Você tem certeza que deseja excluir <strong>{tutorToDelete.name}</strong>? 
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={handleCancelDelete}
                disabled={deleteTutorMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmDelete}
                disabled={deleteTutorMutation.isPending}
              >
                {deleteTutorMutation.isPending ? 'Excluindo...' : 'Confirmar Exclusão'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorListPage;