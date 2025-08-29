import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SelectField, InputField } from '@/components/ui/FormField';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useToast } from '@/hooks/useToast';
import { useProducts, useRegisterProductUsage, ProductUsageRequest } from '@/api/productApi';

interface ProductUsageItem {
  productId: number;
  productName: string;
  quantityUsed: number;
}

interface ProductUsageFormProps {
  appointmentId: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductUsageForm({ appointmentId, onSuccess, onCancel }: ProductUsageFormProps) {
  const { toast } = useToast();
  const { data: productsData, isLoading: productsLoading } = useProducts();
  const registerUsageMutation = useRegisterProductUsage();
  
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantityUsed, setQuantityUsed] = useState<string>('');
  const [usageList, setUsageList] = useState<ProductUsageItem[]>([]);

  // Opções de produtos para o dropdown
  const productOptions = productsData?.map(product => ({
    value: product.id.toString(),
    label: `${product.name} (Estoque: ${product.quantity})`
  })) || [];

  const handleAddProduct = () => {
    if (!selectedProductId || !quantityUsed || parseInt(quantityUsed) <= 0) {
      toast({
        title: 'Erro',
        description: 'Selecione um produto e informe uma quantidade válida.',
        variant: 'destructive'
      });
      return;
    }

    const productId = parseInt(selectedProductId);
    const quantity = parseInt(quantityUsed);
    const product = productsData?.find(p => p.id === productId);

    if (!product) {
      toast({
        title: 'Erro',
        description: 'Produto não encontrado.',
        variant: 'destructive'
      });
      return;
    }

    // Verificar se há estoque suficiente
    const totalUsedForThisProduct = usageList
      .filter(item => item.productId === productId)
      .reduce((sum, item) => sum + item.quantityUsed, 0);
    
    if (totalUsedForThisProduct + quantity > product.quantity) {
      toast({
        title: 'Estoque Insuficiente',
        description: `Estoque disponível: ${product.quantity}. Já selecionado: ${totalUsedForThisProduct}`,
        variant: 'destructive'
      });
      return;
    }

    // Verificar se o produto já está na lista
    const existingItemIndex = usageList.findIndex(item => item.productId === productId);
    
    if (existingItemIndex >= 0) {
      // Atualizar quantidade do produto existente
      const updatedList = [...usageList];
      updatedList[existingItemIndex].quantityUsed += quantity;
      setUsageList(updatedList);
    } else {
      // Adicionar novo produto à lista
      const newItem: ProductUsageItem = {
        productId,
        productName: product.name,
        quantityUsed: quantity
      };
      setUsageList([...usageList, newItem]);
    }

    // Limpar campos
    setSelectedProductId('');
    setQuantityUsed('');
  };

  const handleRemoveProduct = (productId: number) => {
    setUsageList(usageList.filter(item => item.productId !== productId));
  };

  const handleSubmit = async () => {
    if (usageList.length === 0) {
      toast({
        title: 'Erro',
        description: 'Adicione pelo menos um produto à lista.',
        variant: 'destructive'
      });
      return;
    }

    try {
      const products: ProductUsageRequest[] = usageList.map(item => ({
        productId: item.productId,
        quantityUsed: item.quantityUsed
      }));

      await registerUsageMutation.mutateAsync({
        appointmentId,
        products
      });

      toast({
        title: 'Sucesso!',
        description: 'Uso de materiais registrado com sucesso.',
        variant: 'default'
      });

      onSuccess();
    } catch (error) {
      console.error('Erro ao registrar uso de produtos:', error);
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao registrar o uso de materiais. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Registrar Uso de Materiais
        </h3>
        
        {/* Formulário para adicionar produtos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <SelectField
            label="Produto"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            options={productOptions}
            placeholder="Selecione um produto"
            disabled={productsLoading}
          />
          
          <InputField
            label="Quantidade Utilizada"
            type="number"
            min="1"
            value={quantityUsed}
            onChange={(e) => setQuantityUsed(e.target.value)}
            placeholder="Ex: 2"
          />
          
          <div className="flex items-end">
            <Button
              type="button"
              onClick={handleAddProduct}
              disabled={!selectedProductId || !quantityUsed || productsLoading}
              className="w-full gradient-eumaeus-teal text-white hover:opacity-90"
            >
              Adicionar
            </Button>
          </div>
        </div>

        {/* Lista de produtos selecionados */}
        {usageList.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium text-gray-700 mb-3">
              Materiais a serem baixados do estoque:
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              {usageList.map((item) => (
                <div key={item.productId} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                  <div>
                    <span className="font-medium">{item.productName}</span>
                    <span className="text-gray-500 ml-2">- Quantidade: {item.quantityUsed}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveProduct(item.productId)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Remover
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={registerUsageMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={registerUsageMutation.isPending || usageList.length === 0}
            className="gradient-eumaeus-cyan text-white hover:opacity-90"
          >
            {registerUsageMutation.isPending ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Registrando...
              </>
            ) : (
              'Salvar Uso e Finalizar'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}