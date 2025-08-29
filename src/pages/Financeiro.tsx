
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CalendarDays, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  Eye,
  Check,
  Edit,
  Loader2
} from 'lucide-react';
import { useFinancialStats, useInvoices } from '../api/invoiceApi';

export default function Financeiro() {
  const [selectedPeriod, setSelectedPeriod] = useState('Este Mês');
  
  // Buscar dados da API
  const { data: financialStats, isLoading: statsLoading, error: statsError } = useFinancialStats();
  const { data: invoices, isLoading: invoicesLoading, error: invoicesError } = useInvoices();
  
  // Transformar faturas em contas a receber
  const contasReceber = invoices?.map(invoice => ({
    id: invoice.id,
    cliente: `${invoice.appointment.pet.tutor.name} - ${invoice.appointment.pet.name}`,
    dataVencimento: invoice.createdAt,
    valor: invoice.totalAmount,
    status: invoice.status === 'PAID' ? 'Pago' : invoice.status === 'PENDING' ? 'Pendente' : 'Cancelado'
  })) || [];

  // Dados de exemplo para contas a pagar (mantidos como estático por enquanto)
  const contasPagar = [
    {
      id: 1,
      fornecedor: "Aluguel da Clínica",
      categoria: "Despesa Fixa",
      dataVencimento: "2025-01-05",
      valor: 2500.00,
      status: "Pago"
    },
    {
      id: 2,
      fornecedor: "Fornecedor de Medicamentos",
      categoria: "Estoque",
      dataVencimento: "2025-01-15",
      valor: 800.00,
      status: "Pendente"
    },
    {
      id: 3,
      fornecedor: "Energia Elétrica",
      categoria: "Despesa Fixa",
      dataVencimento: "2025-01-10",
      valor: 320.00,
      status: "Pago"
    },
    {
      id: 4,
      fornecedor: "Material de Limpeza",
      categoria: "Operacional",
      dataVencimento: "2025-01-25",
      valor: 150.00,
      status: "Pendente"
    }
  ];
  
  // Loading state
  if (statsLoading || invoicesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dados financeiros...</span>
      </div>
    );
  }
  
  // Error state
  if (statsError || invoicesError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">Erro ao carregar dados financeiros</p>
          <p className="text-sm text-gray-500 mt-1">
            {statsError?.message || invoicesError?.message || 'Erro desconhecido'}
          </p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Pago': { variant: 'default' as const, className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      'Pendente': { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
      'Atrasado': { variant: 'destructive' as const, className: 'bg-red-100 text-red-800 hover:bg-red-100' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Pendente'];
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  // Períodos disponíveis para o filtro
  const periodos = ['Este Mês', 'Últimos 30 dias', 'Este Ano', 'Personalizado'];

  return (
    <div className="bg-background p-6 space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-text-dark mb-6">Painel Financeiro</h1>
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Date Range Picker */}
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-muted-foreground" />
            <div className="flex space-x-1">
              {periodos.map((periodo) => (
                <Button
                  key={periodo}
                  variant={selectedPeriod === periodo ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(periodo)}
                >
                  {periodo}
                </Button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Nova Receita
            </Button>
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Nova Despesa
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas Pagas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(financialStats?.paid?.amount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialStats?.paid?.count || 0} faturas pagas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas Pendentes</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(financialStats?.pending?.amount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialStats?.pending?.count || 0} faturas pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Receitas</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatCurrency((financialStats?.paid?.amount || 0) + (financialStats?.pending?.amount || 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {(financialStats?.paid?.count || 0) + (financialStats?.pending?.count || 0)} faturas no total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturas Canceladas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(financialStats?.cancelled?.amount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialStats?.cancelled?.count || 0} faturas canceladas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed View - Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="receber" className="w-full">
            <div className="border-b">
              <TabsList className="grid w-full grid-cols-2 bg-transparent h-auto p-0">
                <TabsTrigger 
                  value="receber" 
                  className="py-4 px-6 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Contas a Receber
                </TabsTrigger>
                <TabsTrigger 
                  value="pagar"
                  className="py-4 px-6 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Contas a Pagar
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="receber" className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tutor/Descrição</TableHead>
                    <TableHead>Data de Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contasReceber.map((conta) => (
                    <TableRow key={conta.id}>
                      <TableCell className="font-medium">{conta.cliente}</TableCell>
                      <TableCell>{formatDate(conta.dataVencimento)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(conta.valor)}</TableCell>
                      <TableCell>{getStatusBadge(conta.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {conta.status !== 'Pago' && (
                            <Button size="sm" variant="outline">
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="pagar" className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fornecedor/Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Data de Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contasPagar.map((conta) => (
                    <TableRow key={conta.id}>
                      <TableCell className="font-medium">{conta.fornecedor}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{conta.categoria}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(conta.dataVencimento)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(conta.valor)}</TableCell>
                      <TableCell>{getStatusBadge(conta.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {conta.status !== 'Pago' && (
                            <Button size="sm" variant="outline">
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
