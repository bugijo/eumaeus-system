import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProducts } from '@/api/productApi';

export type UsedProduct = { productId: number; quantityUsed: number; name: string };

/** Medicamentos e materiais aplicados no atendimento. Ao registrar a evolução, o estoque recebe a baixa. */
export default function UsedProductsPicker({ value, onChange }: { value: UsedProduct[]; onChange: (next: UsedProduct[]) => void }) {
  const { data: products = [] } = useProducts();
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const available = products.filter((product) => product.quantity > 0 && !value.some((item) => item.productId === product.id));

  const add = () => {
    const product = products.find((item) => item.id === Number(productId));
    const qty = Math.floor(Number(quantity));
    if (!product || !(qty > 0)) return;
    onChange([...value, { productId: product.id, quantityUsed: Math.min(qty, product.quantity), name: product.name }]);
    setProductId('');
    setQuantity('1');
  };

  return (
    <fieldset className="min-w-0 space-y-2 rounded-md border border-border p-3">
      <legend className="px-1 text-sm font-medium">Medicamentos e materiais aplicados</legend>
      <p className="text-xs text-muted-foreground">Saem do estoque quando você registra a evolução.</p>
      <div className="flex flex-wrap gap-2">
        <select aria-label="Produto aplicado" className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm" value={productId} onChange={(event) => setProductId(event.target.value)}>
          <option value="">Escolha no estoque</option>
          {available.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.quantity} em estoque)</option>)}
        </select>
        <Input aria-label="Quantidade aplicada" type="number" min={1} className="w-24" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
        <Button type="button" variant="outline" onClick={add} disabled={!productId}><Plus className="mr-1 h-4 w-4" />Adicionar</Button>
      </div>
      {value.length > 0 && (
        <ul className="space-y-1">
          {value.map((item) => (
            <li key={item.productId} className="flex items-center justify-between rounded bg-muted/50 px-3 py-1.5 text-sm">
              <span>{item.name} · {item.quantityUsed} un.</span>
              <button type="button" aria-label={`Remover ${item.name}`} onClick={() => onChange(value.filter((other) => other.productId !== item.productId))}><X className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}
