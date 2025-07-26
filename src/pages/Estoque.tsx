import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { ProductFormModal } from '@/components/forms/ProductForm';
import {
  useProducts,
  useStockStats,
  useDeleteProduct,
  Product,
} from '@/api/productApi';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/useToast';
import {
  Package,
  DollarSign,
  AlertTriangle,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Eye,
} from 'lucide-react';

export default function StockPage() {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const { data: products = [], isLoading: productsLoading, error: productsError } = useProducts();
  const { data: stats, isLoading: statsLoading } = useStockStats();
  const deleteMutation = useDeleteProduct();
  const { toast } = useToast();

  // Filtrar e ordenar produtos
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.supplier.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (statusFilter === 'all') return matchesSearch;
      if (statusFilter === 'low-stock') return matchesSearch && product.quantity < 10;
      if (statusFilter === 'out-of-stock') return matchesSearch && product.quantity === 0;
      if (statusFilter === 'expiring') {
        const expDate = new Date(product.expirationDate);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        return matchesSearch && expDate <= thirtyDaysFromNow;
      }
      return matchesSearch;
    });

    // Ordenar produtos
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'quantity':
          return b.quantity - a.quantity;
        case 'price':
          return b.costPrice - a.costPrice;
        case 'expiration':
          return new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchTerm, statusFilter, sortBy]);

  const handleNewProduct = () => {
    setSelectedProduct(null);
    setIsFormModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsFormModalOpen(true);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await deleteMutation.mutateAsync(productToDelete.id);
      toast({
        title: 'Sucesso',
        description: 'Produto deletado com sucesso!',
      });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao deletar produto',
        variant: 'destructive',
      });
    }
  };

  const handleFormSuccess = () => {
    setIsFormModalOpen(false);
    setSelectedProduct(null);
  };

  const handleFormCancel = () => {
    setIsFormModalOpen(false);
    setSelectedProduct(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return { label: 'Sem Estoque', color: 'bg-red-100 text-red-800' };
    } else if (quantity < 10) {
      return { label: 'Estoque Baixo', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { label: 'Em Estoque', color: 'bg-green-100 text-green-800' };
    }
  };

  const isExpiringSoon = (expirationDate: string) => {
    const expDate = new Date(expirationDate);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expDate <= thirtyDaysFromNow;
  };

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Erro ao carregar produtos: {productsError.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Cabeçalho Principal */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl gradient-pink flex items-center justify-center shadow-lg">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Controle de Estoque</h1>
            <p className="text-gray-600 mt-1">Gerencie produtos e monitore o estoque</p>
          </div>
        </div>
        <Button onClick={handleNewProduct} className="gradient-pink text-white hover:opacity-90 shadow-lg">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Produto
        </Button>
      </div>

      {/* Barra de Filtros e Busca */}
      <Card className="border-gradient">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar produtos ou fornecedores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-primary/20 focus:border-primary"
                />
              </div>
            </div>
            
            {/* Filtros */}
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] border-primary/20">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="low-stock">Estoque Baixo</SelectItem>
                  <SelectItem value="out-of-stock">Sem Estoque</SelectItem>
                  <SelectItem value="expiring">Vencendo</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[160px] border-primary/20">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Nome A-Z</SelectItem>
                  <SelectItem value="quantity">Quantidade</SelectItem>
                  <SelectItem value="price">Preço</SelectItem>
                  <SelectItem value="expiration">Vencimento</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex border border-primary/20 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={viewMode === 'table' ? 'gradient-pink text-white' : ''}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'gradient-pink text-white' : ''}
                >
                  <Package className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="card-vet hover:scale-105 transition-all duration-300 border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Itens Cadastrados</CardTitle>
            <div className="p-2 rounded-lg bg-blue-100">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {statsLoading ? <LoadingSpinner size="sm" /> : stats?.totalItems || 0}
            </div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>Total de produtos</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-vet hover:scale-105 transition-all duration-300 border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Valor Total do Estoque</CardTitle>
            <div className="p-2 rounded-lg bg-green-100">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {statsLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                formatCurrency(stats?.totalValue || 0)
              )}
            </div>
            <div className="flex items-center text-sm text-green-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>Valor investido</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-vet hover:scale-105 transition-all duration-300 border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Estoque Baixo</CardTitle>
            <div className="p-2 rounded-lg bg-yellow-100">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 mb-1">
              {statsLoading ? <LoadingSpinner size="sm" /> : stats?.lowStockItems || 0}
            </div>
            <div className="flex items-center text-sm text-yellow-600">
              <TrendingDown className="w-4 h-4 mr-1" />
              <span>Requer atenção</span>
            </div>
          </CardContent>
        </Card>

        <Card className="card-vet hover:scale-105 transition-all duration-300 border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Vencendo em 30 dias</CardTitle>
            <div className="p-2 rounded-lg bg-red-100">
              <Calendar className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 mb-1">
              {statsLoading ? <LoadingSpinner size="sm" /> : stats?.expiringSoon || 0}
            </div>
            <div className="flex items-center text-sm text-red-600">
              <AlertTriangle className="w-4 h-4 mr-1" />
              <span>Ação urgente</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Produtos */}
      <Card className="card-vet">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold text-gray-900">Lista de Produtos</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {filteredAndSortedProducts.length} de {products.length} produtos
              </p>
            </div>
            <Badge variant="outline" className="text-primary border-primary/20">
              {filteredAndSortedProducts.length} itens
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {viewMode === 'table' ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="font-semibold text-gray-700">Nome</TableHead>
                    <TableHead className="font-semibold text-gray-700">Fornecedor</TableHead>
                    <TableHead className="font-semibold text-gray-700">Quantidade</TableHead>
                    <TableHead className="font-semibold text-gray-700">Preço</TableHead>
                    <TableHead className="font-semibold text-gray-700">Vencimento</TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="text-right font-semibold text-gray-700">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-3">
                          <Package className="w-12 h-12 text-gray-300" />
                          <div>
                            <p className="text-gray-500 font-medium">Nenhum produto encontrado</p>
                            <p className="text-gray-400 text-sm">Tente ajustar os filtros ou adicionar novos produtos</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedProducts.map((product) => {
                      const stockStatus = getStockStatus(product.quantity);
                      const expiring = isExpiringSoon(product.expirationDate);
                      
                      return (
                        <TableRow key={product.id} className="hover:bg-gray-50/50 transition-colors">
                          <TableCell className="font-medium text-gray-900">{product.name}</TableCell>
                          <TableCell className="text-gray-600">{product.supplier}</TableCell>
                          <TableCell>
                            <span className={`font-medium ${
                              product.quantity === 0 ? 'text-red-600' : 
                              product.quantity < 10 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {product.quantity}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">{formatCurrency(product.costPrice)}</TableCell>
                          <TableCell>
                            <span className={expiring ? 'text-red-600 font-medium' : 'text-gray-600'}>
                              {formatDate(product.expirationDate)}
                              {expiring && (
                                <AlertTriangle className="w-4 h-4 inline ml-1 text-red-600" />
                              )}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditProduct(product)}
                                className="hover:bg-primary/10 hover:border-primary/30"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(product)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-6">
              {filteredAndSortedProducts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="flex flex-col items-center space-y-3">
                    <Package className="w-12 h-12 text-gray-300" />
                    <div>
                      <p className="text-gray-500 font-medium">Nenhum produto encontrado</p>
                      <p className="text-gray-400 text-sm">Tente ajustar os filtros ou adicionar novos produtos</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredAndSortedProducts.map((product) => {
                    const stockStatus = getStockStatus(product.quantity);
                    const expiring = isExpiringSoon(product.expirationDate);
                    
                    return (
                      <Card key={product.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/30">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm leading-tight">{product.name}</h3>
                              <p className="text-xs text-gray-500 mt-1">{product.supplier}</p>
                            </div>
                            <Badge className={stockStatus.color} variant="secondary">
                              {stockStatus.label}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-gray-500">Quantidade</p>
                                <p className={`font-semibold ${
                                  product.quantity === 0 ? 'text-red-600' : 
                                  product.quantity < 10 ? 'text-yellow-600' : 'text-green-600'
                                }`}>
                                  {product.quantity}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Preço</p>
                                <p className="font-semibold text-gray-900">{formatCurrency(product.costPrice)}</p>
                              </div>
                            </div>
                            
                            <div>
                              <p className="text-gray-500 text-sm">Vencimento</p>
                              <p className={`text-sm font-medium ${
                                expiring ? 'text-red-600' : 'text-gray-700'
                              }`}>
                                {formatDate(product.expirationDate)}
                                {expiring && (
                                  <AlertTriangle className="w-3 h-3 inline ml-1" />
                                )}
                              </p>
                            </div>
                            
                            <div className="flex space-x-2 pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditProduct(product)}
                                className="flex-1 hover:bg-primary/10 hover:border-primary/30"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Editar
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteClick(product)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Formulário */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={handleFormCancel}
        product={selectedProduct}
        onSuccess={handleFormSuccess}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o produto "{productToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <LoadingSpinner size="sm" className="mr-2" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}