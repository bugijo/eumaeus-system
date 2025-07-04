import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { TutorService } from '../services/tutorService';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Plus, Users, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import type { Tutor } from '../types';

export const TutorListPage = () => {
  const [tutorToDelete, setTutorToDelete] = useState<Tutor | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { 
    data: tutorsResponse, 
    isLoading, 
    isError, 
    error 
  } = useQuery({
    queryKey: ['tutors'],
    queryFn: () => TutorService.findAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => TutorService.delete(id),
    onSuccess: () => {
      toast({
        title: 'Sucesso!',
        description: 'Tutor excluído com sucesso.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['tutors'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro!',
        description: error.message || 'Falha ao excluir tutor.',
        variant: 'destructive',
      });
    },
  });

  const handleDeleteConfirm = () => {
    if (tutorToDelete) {
      deleteMutation.mutate(tutorToDelete.id);
      setTutorToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando tutores...</span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-500 mb-2">❌ Erro ao carregar tutores</div>
          <p className="text-sm text-gray-600">
            {error instanceof Error ? error.message : 'Erro desconhecido'}
          </p>
        </div>
      </div>
    );
  }

  const tutors = tutorsResponse?.data || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Gestão de Tutores</h1>
          <Badge variant="secondary">{tutors.length} tutores</Badge>
        </div>
        <Link to="/tutores/novo">
          <Button className="flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Novo Tutor</span>
          </Button>
        </Link>
      </div>

      {/* Tutors Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Tutores</CardTitle>
        </CardHeader>
        <CardContent>
          {tutors.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum tutor cadastrado
              </h3>
              <p className="text-gray-500 mb-4">
                Comece adicionando o primeiro tutor ao sistema.
              </p>
              <Link to="/tutores/novo">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Tutor
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tutors.map((tutor) => (
                  <TableRow key={tutor.id}>
                    <TableCell className="font-medium">
                      <Link 
                        to={`/tutores/${tutor.id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {tutor.name}
                      </Link>
                    </TableCell>
                    <TableCell>{tutor.email}</TableCell>
                    <TableCell>{tutor.phone}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {tutor.address || 'Não informado'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link to={`/tutores/editar/${tutor.id}`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Editar
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setTutorToDelete(tutor)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                        <Link to={`/tutores/${tutor.id}`}>
                          <Button variant="outline" size="sm">
                            Ver Pets
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={!!tutorToDelete} onOpenChange={() => setTutorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso excluirá permanentemente o tutor
              "{tutorToDelete?.name}" e todos os seus dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTutorToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Confirmar Exclusão'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TutorListPage;