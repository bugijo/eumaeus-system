import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useCreateMedicalRecord, useAvailableProducts } from '../../api/medicalRecordApi';
import { Trash2, Plus } from 'lucide-react';
import { toast } from '../../hooks/useToast';

const medicalRecordSchema = z.object({
  symptoms: z.string().min(1, 'Sintomas são obrigatórios'),
  diagnosis: z.string().min(1, 'Diagnóstico é obrigatório'),
  treatment: z.string().min(1, 'Tratamento é obrigatório'),
  notes: z.string().optional(),
  products: z.array(z.object({
    productId: z.number().min(1, 'Produto é obrigatório'),
    quantityUsed: z.number().min(1, 'Quantidade deve ser maior que 0')
  })).optional()
});

type MedicalRecordFormData = z.infer<typeof medicalRecordSchema>;

interface MedicalRecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: number;
  onSuccess?: () => void;
}

export function MedicalRecordForm({ isOpen, onClose, appointmentId, onSuccess }: MedicalRecordFormProps) {
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
  } = useForm<MedicalRecordFormData>({
    resolver: zodResolver(medicalRecordSchema),
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

  const onSubmit = async (data: MedicalRecordFormData) => {
    try {
      await createMutation.mutateAsync({
        appointmentId,
        data
      });
      
      toast({
        title: 'Sucesso',
        description: 'Prontuário criado com sucesso!',
        variant: 'default'
      });
      
      reset();
      onSuccess?.();
      onClose();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao criar prontuário. Tente novamente.',
        variant: 'destructive'
      });
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