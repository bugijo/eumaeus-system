import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ClientFormModal } from '@/components/forms/ClientForm';
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
  Phone, 
  Mail,
  PawPrint
} from 'lucide-react';

const Clientes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Sample clients data
  const clients = [
    {
      id: 1,
      nome: 'Ana Silva',
      email: 'ana.silva@email.com',
      telefone: '(11) 98765-4321',
      cpf: '123.456.789-01',
      petsCadastrados: 2,
      ultimaVisita: '2024-06-20',
      status: 'Ativo'
    },
    {
      id: 2,
      nome: 'Carlos Santos',
      email: 'carlos.santos@email.com',
      telefone: '(11) 99876-5432',
      cpf: '234.567.890-12',
      petsCadastrados: 1,
      ultimaVisita: '2024-06-18',
      status: 'Ativo'
    },
    {
      id: 3,
      nome: 'Maria Oliveira',
      email: 'maria.oliveira@email.com',
      telefone: '(11) 97654-3210',
      cpf: '345.678.901-23',
      petsCadastrados: 3,
      ultimaVisita: '2024-06-15',
      status: 'Ativo'
    },
    {
      id: 4,
      nome: 'João Pereira',
      email: 'joao.pereira@email.com',
      telefone: '(11) 96543-2109',
      cpf: '456.789.012-34',
      petsCadastrados: 1,
      ultimaVisita: '2024-05-30',
      status: 'Inativo'
    },
    {
      id: 5,
      nome: 'Lucia Costa',
      email: 'lucia.costa@email.com',
      telefone: '(11) 95432-1098',
      cpf: '567.890.123-45',
      petsCadastrados: 2,
      ultimaVisita: '2024-06-22',
      status: 'Ativo'
    },
    {
      id: 6,
      nome: 'Pedro Rocha',
      email: 'pedro.rocha@email.com',
      telefone: '(11) 94321-0987',
      cpf: '678.901.234-56',
      petsCadastrados: 1,
      ultimaVisita: '2024-06-19',
      status: 'Ativo'
    },
    {
      id: 7,
      nome: 'Amanda Lima',
      email: 'amanda.lima@email.com',
      telefone: '(11) 93210-9876',
      cpf: '789.012.345-67',
      petsCadastrados: 4,
      ultimaVisita: '2024-06-21',
      status: 'Ativo'
    },
    {
      id: 8,
      nome: 'Roberto Alves',
      email: 'roberto.alves@email.com',
      telefone: '(11) 92109-8765',
      cpf: '890.123.456-78',
      petsCadastrados: 1,
      ultimaVisita: '2024-06-17',
      status: 'Ativo'
    }
  ];

  const filteredClients = clients.filter(client =>
    client.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cpf.includes(searchTerm) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    return status === 'Ativo' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  // Handlers para o modal
  const handleNewClient = () => {
    setSelectedClient(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (client: any) => {
    setSelectedClient(client);
    setIsFormModalOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    setSelectedClient(null);
    // Aqui você pode adicionar lógica para atualizar a lista de clientes
  };

  const handleFormCancel = () => {
    setIsFormModalOpen(false);
    setSelectedClient(null);
  };

  return (
    <div className="!bg-background p-6 rounded-xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg gradient-eumaeus-light flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Gestão de Clientes</h1>
            <p className="text-muted-foreground">Cadastre e gerencie informações dos tutores</p>
          </div>
        </div>
        <Button 
          className="bg-primary text-primary-foreground font-bold py-2 px-4 rounded-lg hover:bg-primary/90 shadow-sm transition-colors duration-200"
          onClick={handleNewClient}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente por nome ou CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{clients.length}</div>
              <div className="text-sm text-muted-foreground">Total de Clientes</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">
                {clients.filter(c => c.status === 'Ativo').length}
              </div>
              <div className="text-sm text-muted-foreground">Clientes Ativos</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Cliente</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead className="text-center">Pets Cadastrados</TableHead>
                  <TableHead>Última Visita</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="font-medium">{client.nome}</div>
                      <div className="text-sm text-muted-foreground">{client.cpf}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        {client.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        {client.telefone}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center">
                        <PawPrint className="h-4 w-4 mr-1 text-primary" />
                        <span className="font-semibold">{client.petsCadastrados}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(client.ultimaVisita).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(client.status)}>
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center space-x-2">
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleEdit(client)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredClients.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum cliente encontrado</p>
              <p className="text-sm">Tente ajustar os termos de busca</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Formulário */}
      <ClientFormModal
        isOpen={isFormModalOpen}
        onClose={handleFormCancel}
        client={selectedClient || undefined}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default Clientes;