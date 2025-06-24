
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
  Edit
} from 'lucide-react';

const Financeiro = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('Este Mês');

  // Dados de exemplo para contas a receber
  const contasReceber = [
    {
      id: 1,
      cliente: "Fernanda Calixto - Consulta Rex",
      dataVencimento: "2025-01-15",
      valor: 150.00,
      status: "Pago"
    },
    {
      id: 2,
      cliente: "João Silva - Castração Bella",
      dataVencimento: "2025-01-18",
      valor: 350.00,
      status: "Pendente"
    },
    {
      id: 3,
      cliente: "Maria Santos - Vacinação Luna",
      dataVencimento: "2025-01-12",
      valor: 80.00,
      status: "Atrasado"
    },
    {
      id: 4,
      cliente: "Carlos Oliveira - Exame Thor",
      dataVencimento: "2025-01-20",
      valor: 220.00,
      status: "Pendente"
    }
  ];

  // Dados de exemplo para contas a pagar
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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Painel Financeiro</h1>
        
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
            <CardTitle className="text-sm font-medium">Receitas no Período</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ 12.750,00</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas no Período</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">R$ 4.320,00</div>
            <p className="text-xs text-muted-foreground">
              -5% em relação ao período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo do Período</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">R$ 8.430,00</div>
            <p className="text-xs text-muted-foreground">
              Resultado positivo no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas em Atraso</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">R$ 890,00</div>
            <p className="text-xs text-muted-foreground">
              3 contas pendentes
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
                    <TableHead>Cliente/Descrição</TableHead>
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
};

export default Financeiro;
