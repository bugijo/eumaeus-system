import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search,
  Plus,
  Package,
  DollarSign,
  AlertTriangle,
  Clock,
  Edit,
  History,
  Minus,
  Eye
} from 'lucide-react';

const Estoque = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Dados de exemplo para produtos veterinários
  const produtos = [
    {
      id: 1,
      nome: "Vacina V10 Importada",
      fornecedor: "Zoetis",
      quantidade: 32,
      quantidadeMinima: 10,
      precoCusto: 45.50,
      dataVencimento: "2025-08-15",
      status: "Em Estoque"
    },
    {
      id: 2,
      nome: "Ração Super Premium 15kg",
      fornecedor: "Royal Canin",
      quantidade: 8,
      quantidadeMinima: 15,
      precoCusto: 180.00,
      dataVencimento: "2025-12-20",
      status: "Estoque Baixo"
    },
    {
      id: 3,
      nome: "Vermífugo Drontal Plus",
      fornecedor: "Bayer",
      quantidade: 0,
      quantidadeMinima: 20,
      precoCusto: 25.80,
      dataVencimento: "2025-03-10",
      status: "Esgotado"
    },
    {
      id: 4,
      nome: "Antibiótico Amoxicilina 500mg",
      fornecedor: "Ceva",
      quantidade: 45,
      quantidadeMinima: 25,
      precoCusto: 12.30,
      dataVencimento: "2025-02-28",
      status: "Em Estoque"
    },
    {
      id: 5,
      nome: "Anestésico Propofol 10ml",
      fornecedor: "Cristália",
      quantidade: 12,
      quantidadeMinima: 15,
      precoCusto: 38.90,
      dataVencimento: "2025-01-20",
      status: "Estoque Baixo"
    },
    {
      id: 6,
      nome: "Anti-inflamatório Meloxicam",
      fornecedor: "Ourofino",
      quantidade: 28,
      quantidadeMinima: 10,
      precoCusto: 15.75,
      dataVencimento: "2025-11-30",
      status: "Em Estoque"
    },
    {
      id: 7,
      nome: "Shampoo Medicinal Antisséptico",
      fornecedor: "Virbac",
      quantidade: 6,
      quantidadeMinima: 12,
      precoCusto: 32.40,
      dataVencimento: "2026-06-15",
      status: "Estoque Baixo"
    },
    {
      id: 8,
      nome: "Suplemento Vitamínico Pet",
      fornecedor: "Hertape",
      quantidade: 18,
      quantidadeMinima: 8,
      precoCusto: 28.60,
      dataVencimento: "2025-01-15",
      status: "Em Estoque"
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

  const isExpiringSoon = (dateString: string) => {
    const expirationDate = new Date(dateString);
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    return expirationDate <= thirtyDaysFromNow;
  };

  const isExpired = (dateString: string) => {
    const expirationDate = new Date(dateString);
    const today = new Date();
    
    return expirationDate < today;
  };

  const getStockLevel = (quantidade: number, quantidadeMinima: number) => {
    if (quantidade === 0) return 0;
    const percentage = (quantidade / (quantidadeMinima * 2)) * 100;
    return Math.min(percentage, 100);
  };

  const getStockLevelColor = (quantidade: number, quantidadeMinima: number) => {
    if (quantidade === 0) return 'bg-red-500';
    if (quantidade <= quantidadeMinima) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Em Estoque': { variant: 'default' as const, className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      'Estoque Baixo': { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
      'Esgotado': { variant: 'destructive' as const, className: 'bg-red-100 text-red-800 hover:bg-red-100' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Em Estoque'];
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  // Filtrar produtos baseado na busca
  const produtosFiltrados = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    produto.fornecedor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calcular estatísticas
  const totalItens = produtos.length;
  const valorTotalEstoque = produtos.reduce((total, produto) => total + (produto.quantidade * produto.precoCusto), 0);
  const itensEstoqueBaixo = produtos.filter(produto => produto.quantidade <= produto.quantidadeMinima && produto.quantidade > 0).length;
  const itensVencimentoProximo = produtos.filter(produto => isExpiringSoon(produto.dataVencimento)).length;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Controle de Estoque</h1>
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produto por nome ou código..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Action Button */}
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Produto
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Cadastrados</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalItens}</div>
            <p className="text-xs text-muted-foreground">
              Produtos únicos no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total do Estoque</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(valorTotalEstoque)}</div>
            <p className="text-xs text-muted-foreground">
              Valor total em produtos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens com Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{itensEstoqueBaixo} Itens</div>
            <p className="text-xs text-muted-foreground">
              Abaixo do estoque mínimo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Itens Próximos do Vencimento</CardTitle>
            <Clock className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{itensVencimentoProximo} Itens</div>
            <p className="text-xs text-muted-foreground">
              Vencem nos próximos 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Inventory Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Quantidade em Estoque</TableHead>
                  <TableHead>Preço de Custo (un.)</TableHead>
                  <TableHead>Data de Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtosFiltrados.map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell className="font-medium">{produto.nome}</TableCell>
                    <TableCell>{produto.fornecedor}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">{produto.quantidade} un.</span>
                        <div className="flex items-center space-x-1">
                          <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${getStockLevelColor(produto.quantidade, produto.quantidadeMinima)}`}
                              style={{ width: `${getStockLevel(produto.quantidade, produto.quantidadeMinima)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(produto.precoCusto)}</TableCell>
                    <TableCell>
                      <span className={`${isExpired(produto.dataVencimento) || isExpiringSoon(produto.dataVencimento) ? 'text-red-600 font-semibold' : ''}`}>
                        {formatDate(produto.dataVencimento)}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(produto.status)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline" title="Editar produto">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" title="Ver histórico">
                          <History className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" title="Ajustar estoque">
                          <Minus className="w-3 h-3" />
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Estoque;