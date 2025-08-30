import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PawPrint, Search, FileText, Calendar, User } from 'lucide-react';
import { usePets } from '@/api/petApi';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function Prontuario() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Buscar pets da API
  const {
    data: petsData,
    isLoading,
    isError,
    error
  } = usePets({ page: 1, limit: 100 });

  const pets = petsData?.data || [];

  // Filtrar pets baseado no termo de busca
  const filteredPets = pets.filter(pet =>
    pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pet.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (pet.breed && pet.breed.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (pet.tutor?.name && pet.tutor.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getSpeciesIcon = (species: string) => {
    return species === 'Cão' ? '🐕' : '🐱';
  };

  const handleViewProntuario = (petId: number) => {
    navigate(`/prontuario/${petId}`);
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
        <div className="text-destructive text-lg">Erro ao carregar pets</div>
        <div className="text-muted-foreground">{error?.message || 'Ocorreu um erro inesperado'}</div>
        <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="!bg-background p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg gradient-eumaeus-cyan flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-6">Prontuários Médicos</h1>
        </div>
      </div>

      {/* Search */}
      <Card className="bg-card rounded-lg shadow-md">
        <CardHeader className="p-4 border-b border-border">
          <CardTitle className="text-foreground">Selecionar Pet para Prontuário</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do pet, espécie, raça ou tutor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="card-vet border-gradient">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Pets
            </CardTitle>
            <div className="p-2 rounded-lg gradient-eumaeus-light">
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
            <div className="p-2 rounded-lg gradient-eumaeus-blue">
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
            <div className="p-2 rounded-lg gradient-eumaeus-green">
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
      </div>

      {/* Pets Table */}
      <Card className="card-vet">
        <CardHeader className="border-gradient">
          <CardTitle className="text-gradient">Selecionar Pet ({filteredPets.length})</CardTitle>
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
                      <Button 
                        onClick={() => handleViewProntuario(pet.id)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Ver Prontuário
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
