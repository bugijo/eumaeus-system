import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Camera, Package, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProduct, useCreateProduct, useUpdateProduct } from '@/api/productApi';
import { useResultCenters } from '@/api/financialApi';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useToast } from '@/components/ui/use-toast';
import CameraBarcodeScanner from '@/components/barcode/CameraBarcodeScanner';
import { productSchema, type CreateProductData } from '@/schemas/productSchema';
import CatalogSearch from '@/components/stock/CatalogSearch';

const CATEGORIES = ['Ração', 'Petisco', 'Higiene', 'Acessório', 'Brinquedo', 'Medicamento', 'Vacina', 'Material clínico', 'Outro'];
const numberOrNull = (value: string) => (value === '' ? null : Number(value.replace(',', '.')));

const ProductFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const isEditing = !!id;
  const productId = id ? parseInt(id, 10) : undefined;
  const [cameraOpen, setCameraOpen] = useState(false);

  const { data: product, isLoading: isLoadingProduct } = useProduct(productId!);
  const { data: centers = [] } = useResultCenters();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const form = useForm<CreateProductData>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', barcode: '', category: '', supplier: '', quantity: 0, costPrice: 0, salePrice: null, resultCenterId: null, expirationDate: '' },
  });

  useEffect(() => {
    if (isEditing && product) {
      form.reset({
        name: product.name,
        barcode: product.barcode || '',
        category: product.category || '',
        supplier: product.supplier === 'Não informado' ? '' : product.supplier,
        quantity: product.quantity,
        costPrice: product.costPrice,
        salePrice: product.salePrice ?? null,
        resultCenterId: product.resultCenterId ?? null,
        expirationDate: product.expirationDate ? product.expirationDate.split('T')[0] : '',
      });
    }
  }, [product, isEditing, form]);

  const onSubmit = async (data: CreateProductData) => {
    const payload = { ...data, barcode: data.barcode || null, category: data.category || null };
    try {
      if (isEditing && productId) {
        await updateMutation.mutateAsync({ id: productId, data: payload });
        toast({ title: 'Produto atualizado' });
      } else {
        await createMutation.mutateAsync(payload);
        toast({ title: 'Produto cadastrado' });
      }
      navigate('/estoque');
    } catch (error) {
      const message = (error as any)?.response?.data?.error || 'Não foi possível salvar. Confira os campos e tente novamente.';
      toast({ title: 'Erro ao salvar produto', description: message, variant: 'destructive' });
    }
  };

  if (isEditing && isLoadingProduct) {
    return <div className="flex min-h-[400px] items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  if (isEditing && !isLoadingProduct && !product) {
    return (
      <div className="p-8 text-center">
        <h2 className="mb-2 text-xl text-red-600">Produto não encontrado</h2>
        <Button onClick={() => navigate('/estoque')} variant="outline"><ArrowLeft className="mr-2 h-4 w-4" />Voltar para Estoque</Button>
      </div>
    );
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const cost = form.watch('costPrice');
  const sale = form.watch('salePrice');
  const margin = sale && cost > 0 ? ((sale - cost) / cost) * 100 : null;

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => navigate('/estoque')} aria-label="Voltar"><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{isEditing ? 'Editar produto' : 'Novo produto'}</h1>
          <p className="text-muted-foreground">Campos com * são obrigatórios.</p>
        </div>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Dados do produto</CardTitle>
          <CardDescription>Com o código de barras cadastrado, o produto entra no carrinho do caixa só de bipar.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {!isEditing && (
                <CatalogSearch onPick={(item) => {
                  form.setValue('name', item.name, { shouldValidate: true, shouldDirty: true });
                  form.setValue('category', item.category, { shouldDirty: true });
                }} />
              )}
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nome do produto *</FormLabel><FormControl><Input placeholder="Ex.: Ração Premium Cães Adultos 15 kg" {...field} /></FormControl><FormMessage /></FormItem>
              )} />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField control={form.control} name="barcode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de barras</FormLabel>
                    <div className="flex gap-2">
                      <FormControl><Input placeholder="Bipe ou digite o EAN" inputMode="numeric" {...field} value={field.value ?? ''} onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault(); }} /></FormControl>
                      <Button type="button" variant="outline" size="icon" onClick={() => setCameraOpen(true)} aria-label="Ler código com a câmera"><Camera className="h-4 w-4" /></Button>
                    </div>
                    <FormDescription>Clique no campo e use o leitor, ou a câmera.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Escolha uma categoria" /></SelectTrigger></FormControl>
                      <SelectContent>{CATEGORIES.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField control={form.control} name="quantity" render={({ field }) => (
                  <FormItem><FormLabel>Quantidade em estoque *</FormLabel><FormControl><Input type="number" min="0" step="1" {...field} onChange={(event) => field.onChange(event.target.value === '' ? 0 : parseInt(event.target.value, 10))} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="costPrice" render={({ field }) => (
                  <FormItem><FormLabel>Preço de custo (R$) *</FormLabel><FormControl><Input type="number" min="0" step="0.01" {...field} onChange={(event) => field.onChange(event.target.value === '' ? 0 : parseFloat(event.target.value))} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="salePrice" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de venda (R$)</FormLabel>
                    <FormControl><Input type="number" min="0" step="0.01" placeholder="Igual ao custo" value={field.value ?? ''} onChange={(event) => field.onChange(numberOrNull(event.target.value))} /></FormControl>
                    {margin !== null && <FormDescription>Margem: {margin.toFixed(1)}%</FormDescription>}
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField control={form.control} name="supplier" render={({ field }) => (
                  <FormItem><FormLabel>Fornecedor</FormLabel><FormControl><Input placeholder="Opcional" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="expirationDate" render={({ field }) => (
                  <FormItem><FormLabel>Validade</FormLabel><FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl><FormDescription>Deixe vazio se não vence.</FormDescription><FormMessage /></FormItem>
                )} />
                {centers.length > 0 && (
                  <FormField control={form.control} name="resultCenterId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade / centro</FormLabel>
                      <Select value={field.value ? String(field.value) : 'none'} onValueChange={(value) => field.onChange(value === 'none' ? null : Number(value))}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="none">Não definido</SelectItem>
                          {centers.map((center) => <SelectItem key={center.id} value={String(center.id)}>{center.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                )}
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <LoadingSpinner size="sm" /> : <Save className="mr-2 h-4 w-4" />}
                  {isEditing ? 'Salvar alterações' : 'Cadastrar produto'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/estoque')} disabled={isSubmitting}>Cancelar</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <CameraBarcodeScanner open={cameraOpen} onClose={() => setCameraOpen(false)} onDetected={(code) => form.setValue('barcode', code, { shouldDirty: true, shouldValidate: true })} />
    </div>
  );
};

export default ProductFormPage;
