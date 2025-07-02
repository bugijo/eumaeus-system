import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useCreateProduct, useUpdateProduct, Product } from '@/api/productApi';
import { useToast } from '@/hooks/useToast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSuccess?: () => void;
}

export function ProductFormModal({ isOpen, onClose, product, onSuccess }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    supplier: '',
    quantity: '',
    costPrice: '',
    expirationDate: '',
  });

  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const { toast } = useToast();

  const isEditing = !!product;
  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        supplier: product.supplier,
        quantity: product.quantity.toString(),
        costPrice: product.costPrice.toString(),
        expirationDate: product.expirationDate,
      });
    } else {
      setFormData({
        name: '',
        supplier: '',
        quantity: '',
        costPrice: '',
        expirationDate: '',
      });
    }
  }, [product, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome do produto é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.supplier.trim()) {
      toast({
        title: 'Erro',
        description: 'Fornecedor é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity) || quantity < 0) {
      toast({
        title: 'Erro',
        description: 'Quantidade deve ser um número válido e positivo',
        variant: 'destructive',
      });
      return;
    }

    const costPrice = parseFloat(formData.costPrice);
    if (isNaN(costPrice) || costPrice < 0) {
      toast({
        title: 'Erro',
        description: 'Preço deve ser um número válido e positivo',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.expirationDate) {
      toast({
        title: 'Erro',
        description: 'Data de vencimento é obrigatória',
        variant: 'destructive',
      });
      return;
    }

    const productData = {
      name: formData.name.trim(),
      supplier: formData.supplier.trim(),
      quantity,
      costPrice,
      expirationDate: formData.expirationDate,
    };

    try {
      if (isEditing && product) {
        await updateMutation.mutateAsync({ id: product.id, data: productData });
        toast({
          title: 'Sucesso',
          description: 'Produto atualizado com sucesso!',
        });
      } else {
        await createMutation.mutateAsync(productData);
        toast({
          title: 'Sucesso',
          description: 'Produto criado com sucesso!',
        });
      }
      
      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ex: Ração Premium Cães"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Fornecedor *</Label>
            <Input
              id="supplier"
              name="supplier"
              value={formData.supplier}
              onChange={handleInputChange}
              placeholder="Ex: Pet Food Brasil"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={handleInputChange}
                placeholder="0"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPrice">Preço (R$) *</Label>
              <Input
                id="costPrice"
                name="costPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.costPrice}
                onChange={handleInputChange}
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expirationDate">Data de Vencimento *</Label>
            <Input
              id="expirationDate"
              name="expirationDate"
              type="date"
              value={formData.expirationDate}
              onChange={handleInputChange}
              disabled={isLoading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
              {isEditing ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}