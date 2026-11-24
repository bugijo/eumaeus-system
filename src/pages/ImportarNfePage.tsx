import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Download, FileUp, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProducts, type Product } from '@/api/productApi';
import { useResultCenters } from '@/api/financialApi';
import { useMyAccess } from '@/api/userApi';
import { canAccessPath } from '@/lib/access';
import {
  purchaseInvoiceApi, useNfeImport, useNfeImports, useNfePreview,
  type LineAction, type LineDecision, type NfeImportResult, type NfePreview, type NfePreviewLine,
} from '@/api/purchaseInvoiceApi';

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const brl = (value: number | string) => Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const qty = (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 4 });
const date = (value: string | null) => (value ? new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—');
const formatDocument = (doc: string) => (doc.length === 14 ? doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') : doc);
const formatKey = (key: string) => key.replace(/(\d{4})(?=\d)/g, '$1 ');
const errorText = (error: unknown) => (error as { response?: { data?: { error?: string } } })?.response?.data?.error
  || (error instanceof Error ? error.message : 'Não foi possível concluir');
const readText = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result ?? ''));
  reader.onerror = () => reject(new Error('Não foi possível ler o arquivo'));
  reader.readAsText(file, 'utf-8');
});
const selectClass = 'h-10 w-full min-w-0 rounded-md border bg-background px-3 text-sm';

/** Quantidade que entra no estoque (mesma regra do servidor); null quando não dá número inteiro. */
export function stockUnits(quantity: number, unitsPerPackage: number): number | null {
  const total = quantity * unitsPerPackage;
  const rounded = Math.round(total);
  return Number.isInteger(unitsPerPackage) && unitsPerPackage > 0 && Math.abs(total - rounded) <= 1e-6 && rounded > 0 ? rounded : null;
}

export function initialDecisions(preview: NfePreview): Record<number, LineDecision> {
  return Object.fromEntries(preview.lines.map((line) => [line.nItem, line.suggestion
    ? { nItem: line.nItem, action: 'link' as const, productId: line.suggestion.productId, unitsPerPackage: line.suggestion.unitsPerPackage }
    : { nItem: line.nItem, action: 'create' as const, unitsPerPackage: 1, name: line.name, salePrice: null }]));
}

function ProductPicker({ id, products, value, onChange }: { id: string; products: Product[]; value?: number; onChange: (id: number | undefined) => void }) {
  const [term, setTerm] = useState('');
  const options = useMemo(() => {
    const needle = term.trim().toLowerCase();
    const matches = needle ? products.filter((p) => p.name.toLowerCase().includes(needle) || p.barcode?.includes(needle)) : products;
    const selected = products.find((p) => p.id === value);
    const list = matches.slice(0, 100);
    return selected && !list.includes(selected) ? [selected, ...list] : list;
  }, [products, term, value]);
  return (
    <div className="grid min-w-0 gap-1.5">
      <Input aria-label="Buscar produto do estoque" placeholder="Buscar pelo nome ou código de barras" value={term} onChange={(event) => setTerm(event.target.value)} />
      <select id={id} className={selectClass} value={value ?? ''} onChange={(event) => onChange(event.target.value ? Number(event.target.value) : undefined)}>
        <option value="">Escolha o produto</option>
        {options.map((product) => <option key={product.id} value={product.id}>{product.name}{product.barcode ? ` · ${product.barcode}` : ''}</option>)}
      </select>
    </div>
  );
}

function LineEditor({ line, decision, products, onChange }: { line: NfePreviewLine; decision: LineDecision; products: Product[]; onChange: (next: LineDecision) => void }) {
  const units = stockUnits(line.quantity, decision.unitsPerPackage);
  const prefix = `nfe-${line.nItem}`;
  return (
    <li className="min-w-0 rounded-xl border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words font-medium">{line.nItem}. {line.name}</p>
          <p className="break-words text-xs text-muted-foreground">
            Código {line.code || '—'}{line.ean ? ` · EAN ${line.ean}` : ''}{line.anvisa ? ` · ANVISA ${line.anvisa}` : ''}
          </p>
          {line.lots.length > 0 && (
            <p className="text-xs text-muted-foreground">Lotes: {line.lots.map((lot) => `${lot.code} (${qty(lot.quantity)}, val. ${date(lot.expiresAt)})`).join('; ')}</p>
          )}
        </div>
        <p className="shrink-0 text-right text-sm">
          {qty(line.quantity)} {line.unit} × {brl(line.unitCost)}<br />
          <span className="font-semibold">{brl(line.total)}</span>
        </p>
      </div>

      <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-[180px_1fr_150px]">
        <div className="grid min-w-0 gap-1.5">
          <Label htmlFor={`${prefix}-action`}>O que fazer</Label>
          <select id={`${prefix}-action`} className={selectClass} value={decision.action}
            onChange={(event) => onChange({ ...decision, action: event.target.value as LineAction, name: decision.name ?? line.name })}>
            <option value="link">Vincular a produto</option>
            <option value="create">Criar produto novo</option>
            <option value="skip">Ignorar item</option>
          </select>
        </div>
        {decision.action === 'link' && (
          <div className="grid min-w-0 gap-1.5">
            <Label htmlFor={`${prefix}-product`}>Produto do estoque{line.suggestion?.productId === decision.productId && line.suggestion ? <span className="ml-1 text-xs font-normal text-emerald-700">(encontrado pelo {line.suggestion.source === 'fornecedor' ? 'código do fornecedor' : 'código de barras'})</span> : null}</Label>
            <ProductPicker id={`${prefix}-product`} products={products} value={decision.productId} onChange={(productId) => onChange({ ...decision, productId })} />
          </div>
        )}
        {decision.action === 'create' && (
          <div className="grid min-w-0 gap-3 sm:grid-cols-[1fr_140px]">
            <div className="grid min-w-0 gap-1.5">
              <Label htmlFor={`${prefix}-name`}>Nome do produto</Label>
              <Input id={`${prefix}-name`} maxLength={200} value={decision.name ?? ''} onChange={(event) => onChange({ ...decision, name: event.target.value })} />
            </div>
            <div className="grid min-w-0 gap-1.5">
              <Label htmlFor={`${prefix}-price`}>Preço de venda</Label>
              <Input id={`${prefix}-price`} inputMode="decimal" placeholder="Opcional" value={decision.salePrice ?? ''}
                onChange={(event) => { const raw = event.target.value.replace(/\./g, '').replace(',', '.'); onChange({ ...decision, salePrice: raw === '' ? null : Number(raw) }); }} />
            </div>
          </div>
        )}
        {decision.action === 'skip' && <p className="self-end text-sm text-muted-foreground">Este item não entra no estoque.</p>}
        {decision.action !== 'skip' && (
          <div className="grid min-w-0 gap-1.5">
            <Label htmlFor={`${prefix}-units`}>Unidades por {line.unit}</Label>
            <Input id={`${prefix}-units`} type="number" min={1} max={10000} step={1} value={decision.unitsPerPackage}
              onChange={(event) => onChange({ ...decision, unitsPerPackage: Math.trunc(Number(event.target.value)) || 0 })} />
            <p className={`text-xs ${units === null ? 'text-destructive' : 'text-muted-foreground'}`} role={units === null ? 'alert' : undefined}>
              {units === null ? 'Não dá um número inteiro de unidades.' : `Entram ${units} un. no estoque.`}
            </p>
          </div>
        )}
      </div>
    </li>
  );
}

export function lineProblem(line: NfePreviewLine, decision: LineDecision): string | null {
  if (decision.action === 'skip') return null;
  if (stockUnits(line.quantity, decision.unitsPerPackage) === null) return `Item ${line.nItem}: ajuste as unidades por embalagem.`;
  if (decision.action === 'link' && !decision.productId) return `Item ${line.nItem}: escolha o produto do estoque.`;
  if (decision.action === 'create' && !decision.name?.trim()) return `Item ${line.nItem}: informe o nome do produto.`;
  if (decision.action === 'create' && decision.salePrice !== null && decision.salePrice !== undefined && (!Number.isFinite(decision.salePrice) || decision.salePrice < 0)) return `Item ${line.nItem}: preço de venda inválido.`;
  return null;
}

export default function ImportarNfePage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [xml, setXml] = useState('');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<NfePreview | null>(null);
  const [decisions, setDecisions] = useState<Record<number, LineDecision>>({});
  const [updateCost, setUpdateCost] = useState(true);
  const [createExpense, setCreateExpense] = useState(false);
  const [resultCenterId, setResultCenterId] = useState('');
  const [result, setResult] = useState<NfeImportResult | null>(null);
  const { data: products = [] } = useProducts();
  const { data: access } = useMyAccess(true);
  const canFinance = canAccessPath('/financeiro', access?.permissions);
  const { data: centers = [] } = useResultCenters();
  const { data: history = [] } = useNfeImports();
  const previewMutation = useNfePreview();
  const importMutation = useNfeImport();

  const sortedProducts = useMemo(() => [...products].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')), [products]);
  const problems = preview ? preview.lines.map((line) => lineProblem(line, decisions[line.nItem])).filter(Boolean) as string[] : [];
  const activeCount = preview ? preview.lines.filter((line) => decisions[line.nItem]?.action !== 'skip').length : 0;

  const reset = () => { setXml(''); setFileName(''); setPreview(null); setDecisions({}); setResult(null); if (fileRef.current) fileRef.current.value = ''; };

  const onFile = async (file?: File) => {
    if (!file) return;
    setResult(null);
    if (file.size > MAX_FILE_BYTES) { toast.error('Arquivo grande demais (máximo 4 MB)'); return; }
    try {
      const text = await readText(file);
      const data = await previewMutation.mutateAsync(text);
      setXml(text); setFileName(file.name); setPreview(data); setDecisions(initialDecisions(data));
    } catch (error) {
      setPreview(null);
      toast.error(errorText(error));
    }
  };

  const confirm = async () => {
    if (!preview) return;
    if (problems.length) { toast.error(problems[0]); return; }
    try {
      const data = await importMutation.mutateAsync({
        xml, lines: preview.lines.map((line) => decisions[line.nItem]), updateCost,
        createExpense: canFinance && createExpense, resultCenterId: createExpense && resultCenterId ? Number(resultCenterId) : undefined,
      });
      setResult(data); setPreview(null); setXml(''); if (fileRef.current) fileRef.current.value = '';
      toast.success('Nota importada');
    } catch (error) { toast.error(errorText(error)); }
  };

  const download = async (id: number, key: string) => {
    try {
      const blob = await purchaseInvoiceApi.downloadXml(id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url; anchor.download = `NFe${key}.xml`; anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) { toast.error(errorText(error)); }
  };

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <Link to="/estoque" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"><ArrowLeft className="h-4 w-4" aria-hidden />Estoque</Link>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Importar NF-e de compra</h1>
        <p className="text-muted-foreground">Envie o XML da nota do fornecedor. Os produtos entram no estoque com lote e validade, sem digitar item por item.</p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <input ref={fileRef} id="nfe-file" type="file" accept=".xml,text/xml,application/xml" className="sr-only" onChange={(event) => onFile(event.target.files?.[0])} />
          <Button onClick={() => fileRef.current?.click()} disabled={previewMutation.isPending}>
            <FileUp className="mr-2 h-4 w-4" aria-hidden />{previewMutation.isPending ? 'Lendo a nota…' : 'Escolher arquivo XML'}
          </Button>
          <p className="min-w-0 break-all text-sm text-muted-foreground">{fileName || 'O XML chega por e-mail do fornecedor ou pelo portal dele. PDF (DANFE) não serve.'}</p>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-emerald-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PackageCheck className="h-5 w-5 text-emerald-600" aria-hidden />NF-e {result.number} importada</CardTitle>
            <CardDescription>{result.supplierName} · {brl(result.total)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>{result.received} {result.received === 1 ? 'item entrou' : 'itens entraram'} no estoque ({result.units} un.){result.created ? `, ${result.created} produto(s) criado(s)` : ''}{result.skipped ? `, ${result.skipped} ignorado(s)` : ''}.</p>
            {result.expenseId && <p>A despesa foi lançada no Financeiro.</p>}
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline"><Link to="/estoque">Ver estoque</Link></Button>
              <Button onClick={reset}>Importar outra nota</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {preview && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="break-words">{preview.supplier.tradeName || preview.supplier.name}</CardTitle>
              <CardDescription className="break-words">{preview.supplier.name} · CNPJ/CPF {formatDocument(preview.supplier.document)}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <dl className="grid gap-3 sm:grid-cols-4">
                <div><dt className="text-muted-foreground">Nota</dt><dd className="font-medium">{preview.number} · série {preview.series}</dd></div>
                <div><dt className="text-muted-foreground">Emissão</dt><dd className="font-medium">{new Date(preview.issuedAt).toLocaleDateString('pt-BR')}</dd></div>
                <div><dt className="text-muted-foreground">Itens</dt><dd className="font-medium">{preview.lines.length}</dd></div>
                <div><dt className="text-muted-foreground">Total da nota</dt><dd className="font-semibold">{brl(preview.total)}</dd></div>
              </dl>
              <p className="break-all text-xs text-muted-foreground">Chave {formatKey(preview.accessKey)}</p>
              {preview.alreadyImported && (
                <p role="alert" className="flex gap-2 rounded-md bg-destructive/10 p-3 text-destructive">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                  Esta nota já foi importada em {new Date(preview.alreadyImported.at).toLocaleDateString('pt-BR')}{preview.alreadyImported.by ? ` por ${preview.alreadyImported.by}` : ''}. Importar de novo duplicaria o estoque.
                </p>
              )}
              {preview.warnings.map((warning) => (
                <p key={warning} className="flex gap-2 rounded-md bg-amber-500/10 p-3 text-amber-800 dark:text-amber-300"><AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />{warning}</p>
              ))}
            </CardContent>
          </Card>

          {!preview.alreadyImported && (
            <>
              <section aria-labelledby="nfe-items-title" className="space-y-3">
                <h2 id="nfe-items-title" className="text-lg font-semibold">Itens da nota</h2>
                <p className="text-sm text-muted-foreground">Confira cada item. Se o fornecedor vende em caixa e você vende por unidade, informe quantas unidades vêm na caixa. O sistema lembra essa escolha para as próximas notas deste fornecedor.</p>
                <ul className="space-y-3">
                  {preview.lines.map((line) => (
                    <LineEditor key={line.nItem} line={line} decision={decisions[line.nItem]} products={sortedProducts}
                      onChange={(next) => setDecisions((current) => ({ ...current, [line.nItem]: next }))} />
                  ))}
                </ul>
              </section>

              <Card>
                <CardContent className="space-y-4 pt-6 text-sm">
                  <label className="flex items-start gap-2">
                    <input type="checkbox" className="mt-0.5 h-4 w-4" checked={updateCost} onChange={(event) => setUpdateCost(event.target.checked)} />
                    <span>Atualizar o custo dos produtos vinculados com o valor desta nota</span>
                  </label>
                  {canFinance && (
                    <>
                      <label className="flex items-start gap-2">
                        <input type="checkbox" className="mt-0.5 h-4 w-4" checked={createExpense} onChange={(event) => setCreateExpense(event.target.checked)} />
                        <span>Lançar {brl(preview.total)} como despesa no Financeiro</span>
                      </label>
                      {createExpense && (
                        <div className="grid max-w-sm gap-1.5">
                          <Label htmlFor="nfe-center">Centro de resultado</Label>
                          <select id="nfe-center" className={selectClass} value={resultCenterId} onChange={(event) => setResultCenterId(event.target.value)}>
                            <option value="">Sem centro</option>
                            {centers.filter((center) => center.active).map((center) => <option key={center.id} value={center.id}>{center.name}</option>)}
                          </select>
                        </div>
                      )}
                    </>
                  )}
                  {problems.length > 0 && <p role="alert" className="text-destructive">{problems[0]}{problems.length > 1 ? ` (e mais ${problems.length - 1})` : ''}</p>}
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={confirm} disabled={importMutation.isPending || activeCount === 0 || problems.length > 0}>
                      {importMutation.isPending ? 'Importando…' : `Dar entrada em ${activeCount} ${activeCount === 1 ? 'item' : 'itens'}`}
                    </Button>
                    <Button variant="outline" onClick={reset}>Cancelar</Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notas importadas</CardTitle>
          <CardDescription>O XML original fica guardado para o contador.</CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? <p className="text-sm text-muted-foreground">Nenhuma nota importada ainda.</p> : (
            <ul className="divide-y">
              {history.map((row) => (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="break-words font-medium">NF-e {row.number} · {row.supplierName}</p>
                    <p className="text-xs text-muted-foreground">Emitida {new Date(row.issuedAt).toLocaleDateString('pt-BR')} · importada {new Date(row.createdAt).toLocaleDateString('pt-BR')}{row.importedBy ? ` por ${row.importedBy}` : ''} · {row.itemsCount} itens</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{brl(row.total)}</span>
                    <Button variant="ghost" size="sm" onClick={() => download(row.id, row.accessKey)} aria-label={`Baixar XML da NF-e ${row.number}`}><Download className="h-4 w-4" aria-hidden /></Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
