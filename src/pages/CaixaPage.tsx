import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Banknote, Camera, CreditCard, Minus, Plus, Printer, QrCode, ScanBarcode, ShoppingCart, Trash2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProducts, type Product } from '@/api/productApi';
import { useResultCenters } from '@/api/financialApi';
import { saleApi, useCancelSale, useCreateSale, useSales, type Sale, type SalePaymentMethod } from '@/api/saleApi';
import CameraBarcodeScanner from '@/components/barcode/CameraBarcodeScanner';

type CartLine = { product: Product; quantity: number; unitPrice: number };
type PaymentLine = { method: SalePaymentMethod; amount: string };

const brl = (value: number | string) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const priceOf = (product: Product) => Number(product.salePrice ?? product.costPrice ?? 0);
const parseMoney = (value: string) => Number(String(value || '0').replace(/\./g, '').replace(',', '.')) || 0;
const today = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
const errorText = (error: unknown) => (error as any)?.response?.data?.error || (error as Error)?.message || 'Falha inesperada';
const newKey = () => (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

const METHODS: Array<{ value: SalePaymentMethod; label: string; icon: typeof Banknote }> = [
  { value: 'DINHEIRO', label: 'Dinheiro', icon: Banknote },
  { value: 'PIX', label: 'PIX', icon: QrCode },
  { value: 'DEBITO', label: 'Débito', icon: CreditCard },
  { value: 'CREDITO', label: 'Crédito', icon: CreditCard },
];
const METHOD_LABEL: Record<string, string> = { DINHEIRO: 'Dinheiro', PIX: 'PIX', DEBITO: 'Débito', CREDITO: 'Crédito', OUTRO: 'Outro' };

export default function CaixaPage() {
  const { data: products = [], isLoading } = useProducts();
  const { data: centers = [] } = useResultCenters();
  const { data: salesToday = [] } = useSales({ from: today(), to: today() });
  const createSale = useCreateSale();
  const cancelSale = useCancelSale();

  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState('');
  const [discount, setDiscount] = useState('');
  const [payments, setPayments] = useState<PaymentLine[]>([]);
  const [centerId, setCenterId] = useState<string>('auto');
  const [cameraOpen, setCameraOpen] = useState(false);
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(newKey);
  const [cancelTarget, setCancelTarget] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const scanRef = useRef<HTMLInputElement>(null);

  const focusScan = () => setTimeout(() => scanRef.current?.focus(), 50);
  useEffect(() => { focusScan(); }, []);

  const addProduct = useCallback((product: Product, quantity = 1) => {
    setCart((current) => {
      const index = current.findIndex((line) => line.product.id === product.id);
      const inCart = index >= 0 ? current[index].quantity : 0;
      if (inCart + quantity > product.quantity) {
        toast.error(`Estoque insuficiente de "${product.name}" (disponível: ${product.quantity})`);
        return current;
      }
      if (index >= 0) {
        const next = [...current];
        next[index] = { ...next[index], quantity: next[index].quantity + quantity };
        return next;
      }
      return [...current, { product, quantity, unitPrice: priceOf(product) }];
    });
  }, []);

  const handleCode = useCallback(async (raw: string) => {
    const code = raw.trim();
    if (!code) return;
    const local = products.find((product) => product.barcode && product.barcode === code);
    if (local) { addProduct(local); setSearch(''); return; }
    try {
      const found = await saleApi.byBarcode(code);
      addProduct(found);
      setSearch('');
    } catch {
      const byName = products.filter((product) => product.name.toLowerCase().includes(code.toLowerCase()));
      if (byName.length === 1) { addProduct(byName[0]); setSearch(''); return; }
      if (!byName.length) toast.error(`Nenhum produto com o código ou nome "${code}"`);
    }
  }, [products, addProduct]);

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (term.length < 2) return [];
    return products.filter((product) => product.name.toLowerCase().includes(term) || (product.barcode || '').includes(term)).slice(0, 8);
  }, [products, search]);

  const subtotal = cart.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  const discountValue = Math.min(parseMoney(discount), subtotal);
  const total = Math.max(subtotal - discountValue, 0);
  const paid = payments.reduce((sum, payment) => sum + parseMoney(payment.amount), 0);
  const missing = Math.max(total - paid, 0);
  const cashPaid = payments.filter((payment) => payment.method === 'DINHEIRO').reduce((sum, payment) => sum + parseMoney(payment.amount), 0);
  const change = Math.max(paid - total, 0);
  const changeInvalid = change > 0.004 && change - cashPaid > 0.004;

  const addPayment = (method: SalePaymentMethod) => {
    setPayments((current) => [...current, { method, amount: missing > 0 ? missing.toFixed(2).replace('.', ',') : '' }]);
  };

  const resetSale = () => {
    setCart([]); setPayments([]); setDiscount(''); setCenterId('auto'); setIdempotencyKey(newKey()); focusScan();
  };

  const finalize = async () => {
    if (!cart.length) { toast.error('O carrinho está vazio'); return; }
    if (missing > 0.004) { toast.error(`Falta receber ${brl(missing)}`); return; }
    if (changeInvalid) { toast.error('Troco só é possível em pagamento com dinheiro'); return; }
    try {
      const sale = await createSale.mutateAsync({
        items: cart.map((line) => ({ productId: line.product.id, quantity: line.quantity, unitPrice: line.unitPrice })),
        payments: payments.filter((payment) => parseMoney(payment.amount) > 0).map((payment) => ({ method: payment.method, amount: parseMoney(payment.amount) })),
        discount: discountValue,
        resultCenterId: centerId !== 'auto' ? Number(centerId) : undefined,
        idempotencyKey,
      });
      setReceipt(sale);
      toast.success(`Venda ${sale.number} concluída`);
      resetSale();
    } catch (error) {
      toast.error(errorText(error));
    }
  };

  const confirmCancel = async () => {
    if (!cancelTarget || !cancelReason.trim()) return;
    try {
      await cancelSale.mutateAsync({ id: cancelTarget.id, reason: cancelReason.trim() });
      toast.success(`Venda ${cancelTarget.number} cancelada e estoque devolvido`);
      setCancelTarget(null); setCancelReason('');
    } catch (error) { toast.error(errorText(error)); }
  };

  // Atalhos: F2 foca o leitor, F9 finaliza
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'F2') { event.preventDefault(); focusScan(); }
      if (event.key === 'F9') { event.preventDefault(); finalize(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const salesTotalToday = salesToday.filter((sale) => sale.status === 'COMPLETED').reduce((sum, sale) => sum + Number(sale.total), 0);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold"><ShoppingCart className="h-7 w-7 text-primary" /> Caixa</h1>
          <p className="text-sm text-muted-foreground">Bipe o código de barras (leitor USB ou câmera) ou busque pelo nome. Atalhos: F2 leitor · F9 finalizar.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Vendido hoje</p>
          <p className="text-xl font-semibold">{brl(salesTotalToday)}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); handleCode(search); }}>
                <div className="relative flex-1">
                  <ScanBarcode className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    ref={scanRef}
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Código de barras ou nome do produto"
                    className="h-12 pl-10 text-lg"
                    autoComplete="off"
                    inputMode="search"
                    aria-label="Código de barras ou nome do produto"
                  />
                </div>
                <Button type="button" variant="outline" className="h-12" onClick={() => setCameraOpen(true)} aria-label="Ler com a câmera">
                  <Camera className="h-5 w-5 md:mr-2" /><span className="hidden md:inline">Câmera</span>
                </Button>
              </form>
              {matches.length > 0 && (
                <div className="mt-2 divide-y rounded-md border">
                  {matches.map((product) => (
                    <button key={product.id} type="button" className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted" onClick={() => { addProduct(product); setSearch(''); focusScan(); }}>
                      <span><span className="font-medium">{product.name}</span>{product.barcode && <span className="ml-2 font-mono text-xs text-muted-foreground">{product.barcode}</span>}</span>
                      <span className="text-sm">{brl(priceOf(product))} · <span className={product.quantity > 0 ? 'text-muted-foreground' : 'text-destructive'}>{product.quantity} em estoque</span></span>
                    </button>
                  ))}
                </div>
              )}
              {isLoading && <p className="mt-2 text-sm text-muted-foreground">Carregando produtos…</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-lg">Carrinho ({cart.reduce((sum, line) => sum + line.quantity, 0)} itens)</CardTitle></CardHeader>
            <CardContent>
              {!cart.length ? (
                <p className="py-10 text-center text-muted-foreground">Nenhum item. Bipe um produto para começar.</p>
              ) : (
                <div className="divide-y">
                  {cart.map((line, index) => (
                    <div key={line.product.id} className="flex flex-wrap items-center gap-3 py-3">
                      <div className="min-w-[160px] flex-1">
                        <p className="font-medium">{line.product.name}</p>
                        <p className="text-xs text-muted-foreground">{brl(line.unitPrice)} un.{line.product.barcode ? ` · ${line.product.barcode}` : ''}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="outline" className="h-8 w-8" aria-label="Diminuir" onClick={() => setCart((current) => current.map((item, i) => (i === index ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item)))}><Minus className="h-4 w-4" /></Button>
                        <span className="w-8 text-center font-semibold">{line.quantity}</span>
                        <Button size="icon" variant="outline" className="h-8 w-8" aria-label="Aumentar" onClick={() => addProduct(line.product)}><Plus className="h-4 w-4" /></Button>
                      </div>
                      <span className="w-24 text-right font-semibold">{brl(line.quantity * line.unitPrice)}</span>
                      <Button size="icon" variant="ghost" aria-label="Remover item" onClick={() => setCart((current) => current.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit lg:sticky lg:top-4">
          <CardHeader><CardTitle>Pagamento</CardTitle><CardDescription>Combine formas de pagamento se precisar.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{brl(subtotal)}</span></div>
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="discount">Desconto (R$)</Label>
                <Input id="discount" value={discount} onChange={(event) => setDiscount(event.target.value)} placeholder="0,00" className="h-8 w-28 text-right" inputMode="decimal" />
              </div>
              <div className="flex justify-between border-t pt-2 text-xl font-bold"><span>Total</span><span>{brl(total)}</span></div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {METHODS.map(({ value, label, icon: Icon }) => (
                <Button key={value} variant="outline" onClick={() => addPayment(value)} disabled={!cart.length}><Icon className="mr-2 h-4 w-4" />{label}</Button>
              ))}
            </div>

            {payments.map((payment, index) => (
              <div key={index} className="flex items-center gap-2">
                <Badge variant="secondary" className="w-20 justify-center">{METHOD_LABEL[payment.method]}</Badge>
                <Input value={payment.amount} inputMode="decimal" onChange={(event) => setPayments((current) => current.map((item, i) => (i === index ? { ...item, amount: event.target.value } : item)))} className="h-9 text-right" aria-label={`Valor em ${METHOD_LABEL[payment.method]}`} />
                <Button size="icon" variant="ghost" aria-label="Remover pagamento" onClick={() => setPayments((current) => current.filter((_, i) => i !== index))}><XCircle className="h-4 w-4" /></Button>
              </div>
            ))}

            <div className="space-y-1 text-sm">
              {missing > 0.004 && <div className="flex justify-between text-destructive"><span>Falta receber</span><span>{brl(missing)}</span></div>}
              {change > 0.004 && <div className={`flex justify-between text-lg font-semibold ${changeInvalid ? 'text-destructive' : 'text-emerald-600'}`}><span>Troco</span><span>{brl(change)}</span></div>}
            </div>

            {centers.length > 0 && (
              <div className="space-y-1">
                <Label>Unidade / centro</Label>
                <Select value={centerId} onValueChange={setCenterId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Automático (pelo produto)</SelectItem>
                    {centers.map((center) => <SelectItem key={center.id} value={String(center.id)}>{center.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button className="h-12 w-full text-lg" onClick={finalize} disabled={!cart.length || createSale.isPending}>
              {createSale.isPending ? 'Registrando…' : `Finalizar venda (F9)`}
            </Button>
            {cart.length > 0 && <Button variant="ghost" className="w-full" onClick={resetSale}>Limpar venda</Button>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Vendas de hoje</CardTitle></CardHeader>
        <CardContent>
          {!salesToday.length ? <p className="text-sm text-muted-foreground">Nenhuma venda hoje.</p> : (
            <div className="divide-y text-sm">
              {salesToday.map((sale) => (
                <div key={sale.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="font-medium">Venda {sale.number}</span>
                  <span className="text-muted-foreground">{new Date(sale.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="text-muted-foreground">{sale.items.reduce((sum, item) => sum + item.quantity, 0)} itens · {sale.payments.map((payment) => METHOD_LABEL[payment.method]).join(' + ')}</span>
                  <span className={sale.status === 'CANCELLED' ? 'line-through text-muted-foreground' : 'font-semibold'}>{brl(sale.total)}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => setReceipt(sale)}><Printer className="mr-1 h-4 w-4" />Cupom</Button>
                    {sale.status === 'COMPLETED' ? <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setCancelTarget(sale)}>Cancelar</Button> : <Badge variant="outline">Cancelada</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CameraBarcodeScanner open={cameraOpen} continuous onClose={() => { setCameraOpen(false); focusScan(); }} onDetected={handleCode} />

      <Dialog open={!!receipt} onOpenChange={(open) => { if (!open) { setReceipt(null); focusScan(); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Venda {receipt?.number}</DialogTitle><DialogDescription>Comprovante sem valor fiscal.</DialogDescription></DialogHeader>
          {receipt && (
            <div id="cupom" className="space-y-1 font-mono text-xs">
              <p className="text-center font-bold">COMPROVANTE DE VENDA</p>
              <p className="text-center">Venda {receipt.number} · {new Date(receipt.createdAt).toLocaleString('pt-BR')}</p>
              <div className="my-2 border-t border-dashed" />
              {receipt.items.map((item) => (
                <div key={item.id}><p>{item.description}</p><p className="flex justify-between"><span>{item.quantity} x {brl(item.unitPrice)}</span><span>{brl(item.total)}</span></p></div>
              ))}
              <div className="my-2 border-t border-dashed" />
              <p className="flex justify-between"><span>Subtotal</span><span>{brl(receipt.subtotal)}</span></p>
              {Number(receipt.discount) > 0 && <p className="flex justify-between"><span>Desconto</span><span>-{brl(receipt.discount)}</span></p>}
              <p className="flex justify-between font-bold"><span>TOTAL</span><span>{brl(receipt.total)}</span></p>
              {receipt.payments.map((payment) => <p key={payment.id} className="flex justify-between"><span>{METHOD_LABEL[payment.method]}</span><span>{brl(payment.amount)}</span></p>)}
              {Number(receipt.change) > 0 && <p className="flex justify-between"><span>Troco</span><span>{brl(receipt.change)}</span></p>}
              <div className="my-2 border-t border-dashed" />
              <p className="text-center">Documento sem valor fiscal</p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setReceipt(null)}>Fechar</Button>
            <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Imprimir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!cancelTarget} onOpenChange={(open) => { if (!open) setCancelTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Cancelar venda {cancelTarget?.number}?</DialogTitle><DialogDescription>O estoque dos itens volta automaticamente.</DialogDescription></DialogHeader>
          <div className="space-y-1"><Label htmlFor="cancel-reason">Motivo</Label><Input id="cancel-reason" value={cancelReason} onChange={(event) => setCancelReason(event.target.value)} placeholder="Ex.: cliente desistiu" /></div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setCancelTarget(null)}>Voltar</Button>
            <Button variant="destructive" disabled={!cancelReason.trim() || cancelSale.isPending} onClick={confirmCancel}>Cancelar venda</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
