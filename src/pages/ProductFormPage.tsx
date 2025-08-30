import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import { useProduct, useCreateProduct, useUpdateProduct } from '@/api/productApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/use-toast';
import { productSchema, type CreateProductData } from '@/schemas/productSchema';

const ProductFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const isEditing = !!id;
  const productId = id ? parseInt(id, 10) : undefined;

  // Queries e Mutations
  const { data: product, isLoading: isLoadingProduct } = useProduct(productId!);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  // Form setup
  const form = useForm<CreateProductData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      supplier: '',
      quantity: 0,
      costPrice: 0,
      expirationDate: '',
    },
  });

  // Preencher formulário quando editando
  useEffect(() => {
    if (isEditing && product) {
      form.reset({
        name: product.name,
        supplier: product.supplier,
        quantity: product.quantity,
        costPrice: product.costPrice,
        expirationDate: product.expirationDate.split('T')[0], // Formato YYYY-MM-DD para input date
      });
    }
  }, [product, isEditing, form]);

  // Função para submeter o formulário
  const onSubmit = async (data: CreateProductData) => {
    try {
      if (isEditing && productId) {
        await updateMutation.mutateAsync({
          id: productId,
          data,
        });
        toast({
          title: 'Produto atualizado',
          description: 'O produto foi atualizado com sucesso.',
        });
      } else {
        await createMutation.mutateAsync(data);
        toast({
          title: 'Produto criado',
          description: 'O produto foi criado com sucesso.',
        });
      }
      navigate('/estoque');
    } catch (error) {
      toast({
        title: 'Erro ao salvar produto',
        description: 'Ocorreu um erro ao salvar o produto. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  // Loading state para edição
  if (isEditing && isLoadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Produto não encontrado
  if (isEditing && !isLoadingProduct && !product) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl text-red-600 mb-2">Produto não encontrado</h2>
        <p className="text-gray-600 mb-4">O produto que você está tentando editar não foi encontrado.</p>
        <Button onClick={() => navigate('/estoque')} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Estoque
        </Button>
      </div>
    );
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/estoque')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? 'Editar Produto' : 'Novo Produto'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing
              ? 'Atualize as informações do produto'
              : 'Adicione um novo produto ao estoque'
            }
          </p>
        </div>
      </div>

      {/* Formulário */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Informações do Produto
          </CardTitle>
          <CardDescription>
            Preencha os dados do produto para {isEditing ? 'atualizar' : 'adicionar ao'} estoque
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Nome do Produto */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Produto *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Ração Premium para Cães"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fornecedor */}
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fornecedor *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Pet Shop Distribuidor Ltda"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Grid para Quantidade e Preço */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quantidade */}
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Preço de Custo */}
                <FormField
                  control={form.control}
                  name="costPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço de Custo *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Data de Vencimento */}
              <FormField
                control={form.control}
                name="expirationDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Vencimento *</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Botões de Ação */}
              <div className="flex items-center gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSubmitting
                    ? (isEditing ? 'Atualizando...' : 'Criando...')
                    : (isEditing ? 'Atualizar Produto' : 'Criar Produto')
                  }
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/estoque')}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductFormPage;