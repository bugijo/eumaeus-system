import React, { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { useCreateMedicalRecord, useAvailableProducts, useCreateMedicalRecordWithProducts, useAllProducts, Product } from '../../api/medicalRecordApi';
import { medicalRecordSchema, MedicalRecordFormData, UsedProduct } from '../../schemas/medicalRecordSchema';
import { Trash2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';

// Schema legado para compatibilidade
const legacyMedicalRecordSchema = z.object({
  symptoms: z.string().min(1, 'Sintomas são obrigatórios'),
  diagnosis: z.string().min(1, 'Diagnóstico é obrigatório'),
  treatment: z.string().min(1, 'Tratamento é obrigatório'),
  notes: z.string().optional(),
  products: z.array(z.object({
    productId: z.number().min(1, 'Produto é obrigatório'),
    quantityUsed: z.number().min(1, 'Quantidade deve ser maior que 0')
  })).optional()
});

type LegacyMedicalRecordFormData = z.infer<typeof legacyMedicalRecordSchema>;

// Props para o formulário legado (baseado em appointment)
interface LegacyMedicalRecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: number;
  onSuccess?: () => void;
}

// Props para o novo formulário (baseado em pet)
interface MedicalRecordFormProps {
  petId: number;
  petName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Props para o dialog de seleção de produtos
interface ProductSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product, quantity: number) => void;
  selectedProducts: UsedProduct[];
}

// Dialog de seleção de produtos
function ProductSelectionDialog({ isOpen, onClose, onSelectProduct, selectedProducts }: ProductSelectionDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  const { data: productsData, isLoading } = useAllProducts();
  
  // --- BARREIRA DE CONTENÇÃO DE DADOS ---
  const cleanedProducts = useMemo(() => {
    // Se não há dados ou se a lista está vazia, retorna um array vazio.
    if (!productsData) return [];
    
    // Mapeia os dados "crus", garantindo que cada produto tenha preços válidos.
    return productsData.map(product => ({
      ...product,
      price: product.price ?? 0, // Garante que o preço é um número.
      salePrice: product.salePrice ?? 0, // Garante que o preço de venda é um número.
      costPrice: product.costPrice ?? 0, // Garante que o preço de custo é um número.
      stock: product.stock ?? product.quantity ?? 0, // Garante que o estoque é um número.
      quantity: product.quantity ?? product.stock ?? 0, // Garante que a quantidade é um número.
    }));
  }, [productsData]); // Este "filtro" só roda novamente quando os dados da API mudam.
  // -----------------------------------------
  
  const filteredProducts = cleanedProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !selectedProducts.some(sp => sp.productId === product.id)
  );
  
  const handleSelectProduct = () => {
    if (selectedProduct && quantity > 0) {
      if (quantity > (selectedProduct.stock || selectedProduct.quantity || 0)) {
        toast.error('Quantidade solicitada maior que o estoque disponível');
        return;
      }
      
      onSelectProduct(selectedProduct, quantity);
      setSelectedProduct(null);
      setQuantity(1);
      setSearchTerm('');
      onClose();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Selecionar Produto</DialogTitle>
          <DialogDescription>
            Busque e selecione um produto para adicionar ao prontuário médico.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Campo de busca */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Lista de produtos */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-4">Carregando produtos...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                {searchTerm ? 'Nenhum produto encontrado' : 'Todos os produtos já foram selecionados'}
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedProduct?.id === product.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{product.name}</h4>
                      {product.description && (
                        <p className="text-sm text-gray-600">{product.description}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        Estoque: {product.stock || product.quantity || 0} | 
                        Preço: R$ {(product.price ?? 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Seleção de quantidade */}
          {selectedProduct && (
            <div className="border-t pt-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <h4 className="font-medium mb-2">Produto Selecionado: {selectedProduct.name}</h4>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label htmlFor="quantity">Quantidade</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={selectedProduct.stock || selectedProduct.quantity || 0}
                      value={quantity}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="mt-1"
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Disponível: {selectedProduct.stock || selectedProduct.quantity || 0}</p>
                    <p>Total: R$ {((selectedProduct.price ?? 0) * quantity).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSelectProduct}
              disabled={!selectedProduct || quantity <= 0}
            >
              Adicionar Produto
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Novo formulário de prontuário médico
export function MedicalRecordForm({ petId, petName, onSuccess, onCancel }: MedicalRecordFormProps) {
  const [selectedProducts, setSelectedProducts] = useState<UsedProduct[]>([]);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  
  const createMutation = useCreateMedicalRecordWithProducts();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<MedicalRecordFormData>({
    resolver: zodResolver(medicalRecordSchema),
    defaultValues: {
      petId,
      usedProducts: [],
    },
  });
  
  const handleSelectProduct = (product: Product, quantity: number) => {
    const newProduct: UsedProduct = {
      productId: product.id,
      quantity,
      unitPrice: product.price,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        stock: product.stock || product.quantity || 0,
      },
    };
    
    setSelectedProducts(prev => [...prev, newProduct]);
  };
  
  const handleRemoveProduct = (productId: number) => {
    setSelectedProducts(prev => prev.filter(p => p.productId !== productId));
  };
  
  const calculateTotal = () => {
    return selectedProducts.reduce((total, product) => {
      return total + (product.quantity * product.unitPrice);
    }, 0);
  };
  
  const onSubmit = async (data: MedicalRecordFormData) => {
    try {
      // Transformar usedProducts para o formato esperado pelo backend
      const transformedProducts = selectedProducts.map(product => ({
        productId: product.productId,
        quantityUsed: product.quantity // Backend espera 'quantityUsed', não 'quantity'
      }));
      
      const formData = {
        ...data,
        notes: data.observations, // Backend espera 'notes', não 'observations'
        usedProducts: transformedProducts,
      };
      
      // Remove observations do objeto pois já foi mapeado para notes
      delete formData.observations;
      
      // 🕵️‍♂️ DEBUG VETDEV - PAYLOAD QUE O FRONTEND ESTÁ ENVIANDO:
      console.log('🕵️‍♂️ DEBUG VETDEV - PAYLOAD QUE O FRONTEND ESTÁ ENVIANDO:', formData);
      console.log('🔍 PRODUTOS TRANSFORMADOS:', transformedProducts);
      
      await createMutation.mutateAsync(formData);
      
      // Reset form
      reset();
      setSelectedProducts([]);
      
      // Call success callback
      onSuccess?.();
    } catch (error) {
      // Error is handled by the mutation
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Novo Prontuário Médico
            {petName && <span className="text-base font-normal text-gray-600 ml-2">- {petName}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações Clínicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 5.2"
                  {...register('weight', { valueAsNumber: true })}
                />
                {errors.weight && (
                  <p className="text-sm text-red-600">{errors.weight.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperatura (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 38.5"
                  {...register('temperature', { valueAsNumber: true })}
                />
                {errors.temperature && (
                  <p className="text-sm text-red-600">{errors.temperature.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="heartRate">Freq. Cardíaca (bpm)</Label>
                <Input
                  id="heartRate"
                  type="number"
                  placeholder="Ex: 120"
                  {...register('heartRate', { valueAsNumber: true })}
                />
                {errors.heartRate && (
                  <p className="text-sm text-red-600">{errors.heartRate.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="respiratoryRate">Freq. Respiratória (rpm)</Label>
                <Input
                  id="respiratoryRate"
                  type="number"
                  placeholder="Ex: 30"
                  {...register('respiratoryRate', { valueAsNumber: true })}
                />
                {errors.respiratoryRate && (
                  <p className="text-sm text-red-600">{errors.respiratoryRate.message}</p>
                )}
              </div>
            </div>
            
            {/* Campos de texto */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="symptoms">Sintomas *</Label>
                <Textarea
                  id="symptoms"
                  placeholder="Descreva os sintomas apresentados pelo animal..."
                  rows={3}
                  {...register('symptoms')}
                />
                {errors.symptoms && (
                  <p className="text-sm text-red-600">{errors.symptoms.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="diagnosis">Diagnóstico *</Label>
                <Textarea
                  id="diagnosis"
                  placeholder="Diagnóstico médico..."
                  rows={3}
                  {...register('diagnosis')}
                />
                {errors.diagnosis && (
                  <p className="text-sm text-red-600">{errors.diagnosis.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="treatment">Tratamento *</Label>
                <Textarea
                  id="treatment"
                  placeholder="Tratamento prescrito..."
                  rows={3}
                  {...register('treatment')}
                />
                {errors.treatment && (
                  <p className="text-sm text-red-600">{errors.treatment.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  placeholder="Observações adicionais..."
                  rows={2}
                  {...register('observations')}
                />
                {errors.observations && (
                  <p className="text-sm text-red-600">{errors.observations.message}</p>
                )}
              </div>
            </div>
            
            {/* Produtos Utilizados */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Produtos Utilizados</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsProductDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Produto
                </Button>
              </div>
              
              {selectedProducts.length > 0 ? (
                <div className="space-y-2">
                  {selectedProducts.map((product, index) => (
                    <div key={`${product.productId}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{product.product?.name}</h4>
                        <p className="text-sm text-gray-600">
                          Quantidade: {product.quantity} | 
                          Preço unitário: R$ {(product.unitPrice ?? 0).toFixed(2)} | 
                          Total: R$ {(product.quantity * (product.unitPrice ?? 0)).toFixed(2)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveProduct(product.productId)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <div className="flex justify-end pt-2 border-t">
                    <Badge variant="secondary" className="text-base px-3 py-1">
                      Total Geral: R$ {(calculateTotal() ?? 0).toFixed(2)}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  <p>Nenhum produto adicionado</p>
                  <p className="text-sm">Clique em "Adicionar Produto" para incluir produtos utilizados</p>
                </div>
              )}
            </div>
            
            {/* Botões */}
            <div className="flex justify-end gap-3 pt-6 border-t">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar Prontuário'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      {/* Dialog de seleção de produtos */}
      <ProductSelectionDialog
        isOpen={isProductDialogOpen}
        onClose={() => setIsProductDialogOpen(false)}
        onSelectProduct={handleSelectProduct}
        selectedProducts={selectedProducts}
      />
    </div>
  );
}

// Formulário legado para compatibilidade com appointments
export function LegacyMedicalRecordForm({ isOpen, onClose, appointmentId, onSuccess }: LegacyMedicalRecordFormProps) {
  const { data: products = [], isLoading: loadingProducts } = useAvailableProducts();
  const createMutation = useCreateMedicalRecord();
  
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
    setValue,
    watch
  } = useForm<LegacyMedicalRecordFormData>({
    resolver: zodResolver(legacyMedicalRecordSchema),
    defaultValues: {
      symptoms: '',
      diagnosis: '',
      treatment: '',
      notes: '',
      products: []
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'products'
  });

  const onSubmit = async (data: LegacyMedicalRecordFormData) => {
    try {
      await createMutation.mutateAsync({
        appointmentId,
        data
      });
      
      toast.success('Prontuário criado com sucesso!');
      
      reset();
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error('Erro ao criar prontuário. Tente novamente.');
    }
  };

  const addProduct = () => {
    append({ productId: 0, quantityUsed: 1 });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Prontuário Médico</DialogTitle>
          <DialogDescription>
            Preencha as informações do prontuário médico para este agendamento.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Sintomas */}
          <div className="space-y-2">
            <Label htmlFor="symptoms">Sintomas *</Label>
            <Textarea
              id="symptoms"
              {...register('symptoms')}
              placeholder="Descreva os sintomas apresentados pelo animal..."
              className="min-h-[80px]"
            />
            {errors.symptoms && (
              <p className="text-sm text-red-500">{errors.symptoms.message}</p>
            )}
          </div>

          {/* Diagnóstico */}
          <div className="space-y-2">
            <Label htmlFor="diagnosis">Diagnóstico *</Label>
            <Textarea
              id="diagnosis"
              {...register('diagnosis')}
              placeholder="Diagnóstico médico..."
              className="min-h-[80px]"
            />
            {errors.diagnosis && (
              <p className="text-sm text-red-500">{errors.diagnosis.message}</p>
            )}
          </div>

          {/* Tratamento */}
          <div className="space-y-2">
            <Label htmlFor="treatment">Tratamento *</Label>
            <Textarea
              id="treatment"
              {...register('treatment')}
              placeholder="Tratamento prescrito..."
              className="min-h-[80px]"
            />
            {errors.treatment && (
              <p className="text-sm text-red-500">{errors.treatment.message}</p>
            )}
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Observações adicionais..."
              className="min-h-[60px]"
            />
          </div>

          {/* Produtos utilizados */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Produtos Utilizados</Label>
              <Button
                type="button"
                onClick={addProduct}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar Produto
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="flex items-end gap-2 p-3 border rounded-lg">
                <div className="flex-1">
                  <Label htmlFor={`products.${index}.productId`}>Produto</Label>
                  <Select
                    onValueChange={(value) => setValue(`products.${index}.productId`, parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id.toString()}>
                          {product.name} - Estoque: {product.quantity}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.products?.[index]?.productId && (
                    <p className="text-sm text-red-500">
                      {errors.products[index]?.productId?.message}
                    </p>
                  )}
                </div>

                <div className="w-24">
                  <Label htmlFor={`products.${index}.quantityUsed`}>Qtd</Label>
                  <Input
                    type="number"
                    min="1"
                    {...register(`products.${index}.quantityUsed`, { valueAsNumber: true })}
                    placeholder="1"
                  />
                  {errors.products?.[index]?.quantityUsed && (
                    <p className="text-sm text-red-500">
                      {errors.products[index]?.quantityUsed?.message}
                    </p>
                  )}
                </div>

                <Button
                  type="button"
                  onClick={() => remove(index)}
                  variant="outline"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending}
              className="bg-green-500 hover:bg-green-600"
            >
              {createMutation.isPending ? 'Salvando...' : 'Salvar Prontuário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}