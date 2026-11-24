import { useState } from 'react';
import { toast } from 'sonner';
import { ArrowDownToLine, ArrowUpFromLine, Lock, LockOpen, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CashSession, useCashHistory, useCashMovement, useCloseCash, useOpenCash } from '@/api/cashApi';

export const brl = (value: number | string) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
/** Aceita "1.234,56", "1234,56" e "1234.56". */
export const parseBrl = (value: string) => {
  const text = String(value || '').trim();
  const normalized = text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : NaN;
};
const errorText = (error: unknown) => (error as any)?.response?.data?.error || (error as Error)?.message || 'Falha inesperada';
const time = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const dateTime = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const METHOD_LABEL: Record<string, string> = { DINHEIRO: 'Dinheiro (líquido de troco)', PIX: 'PIX', DEBITO: 'Débito', CREDITO: 'Crédito', OUTRO: 'Outro' };

/** Sem caixa aberto: pede o troco inicial. */
export function OpenCashCard() {
  const openCash = useOpenCash();
  const [amount, setAmount] = useState('');
  const { data: history = [] } = useCashHistory(5);
  const submit = async () => {
    const value = amount.trim() === '' ? 0 : parseBrl(amount);
    if (!Number.isFinite(value) || value < 0) { toast.error('Informe um valor válido para o troco inicial'); return; }
    try { await openCash.mutateAsync(value); toast.success('Caixa aberto'); } catch (error) { toast.error(errorText(error)); }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LockOpen className="h-5 w-5 text-primary" aria-hidden /> Abrir o caixa</CardTitle>
          <CardDescription>Conte o dinheiro da gaveta e informe o troco inicial. As vendas só são liberadas com o caixa aberto.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); submit(); }}>
            <div className="space-y-1.5">
              <Label htmlFor="opening-amount">Troco inicial (R$)</Label>
              <Input id="opening-amount" inputMode="decimal" placeholder="0,00" className="w-40" value={amount} onChange={(event) => setAmount(event.target.value)} autoFocus />
            </div>
            <Button type="submit" disabled={openCash.isPending}>Abrir caixa</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Últimos fechamentos</CardTitle></CardHeader>
        <CardContent>
          {!history.length ? <p className="text-sm text-muted-foreground">Nenhum fechamento ainda.</p> : (
            <ul className="divide-y divide-border text-sm">
              {history.map((session) => {
                const diff = Number(session.difference || 0);
                return (
                  <li key={session.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="min-w-0">
                      <span className="block truncate">{session.closedAt ? dateTime(session.closedAt) : '—'} · {session.closedBy || '—'}</span>
                      <span className="block text-xs text-muted-foreground">{session.summary.salesCount} vendas · {brl(session.summary.salesTotal)}</span>
                    </span>
                    <span className={`shrink-0 text-xs font-medium ${diff === 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                      {diff === 0 ? 'Conferido' : `${diff > 0 ? 'Sobra' : 'Falta'} ${brl(Math.abs(diff))}`}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/** Caixa aberto: resumo, sangria, suprimento e fechamento com conferência. */
export function CashSessionBar({ session, onClosed }: { session: CashSession; onClosed?: (closed: CashSession) => void }) {
  const movement = useCashMovement();
  const closeCash = useCloseCash();
  const [movementType, setMovementType] = useState<'SANGRIA' | 'SUPRIMENTO' | null>(null);
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [closing, setClosing] = useState(false);
  const [counted, setCounted] = useState('');
  const [note, setNote] = useState('');

  const summary = session.summary;
  const countedValue = parseBrl(counted);
  const difference = counted.trim() && Number.isFinite(countedValue) ? Math.round((countedValue - Number(summary.expectedCash)) * 100) / 100 : null;

  const submitMovement = async () => {
    const value = parseBrl(movementAmount);
    if (!Number.isFinite(value) || value <= 0) { toast.error('Informe um valor maior que zero'); return; }
    if (!movementReason.trim()) { toast.error('Informe o motivo'); return; }
    try {
      await movement.mutateAsync({ type: movementType!, amount: value, reason: movementReason.trim() });
      toast.success(movementType === 'SANGRIA' ? 'Sangria registrada' : 'Suprimento registrado');
      setMovementType(null); setMovementAmount(''); setMovementReason('');
    } catch (error) { toast.error(errorText(error)); }
  };

  const submitClose = async () => {
    if (!Number.isFinite(countedValue) || countedValue < 0 || !counted.trim()) { toast.error('Informe o dinheiro contado na gaveta'); return; }
    if (difference !== 0 && !note.trim()) { toast.error('Explique a diferença na observação'); return; }
    try {
      const result = await closeCash.mutateAsync({ countedCash: countedValue, note: note.trim() || undefined });
      setClosing(false); setCounted(''); setNote('');
      // O caixa some da tela quando fecha: quem mostra o resumo é a página (onClosed).
      onClosed?.(result);
    } catch (error) { toast.error(errorText(error)); }
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-4 py-3">
        <p className="flex min-w-0 items-center gap-2 text-sm">
          <Wallet className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
          <span className="min-w-0">
            <span className="font-medium">Caixa aberto</span> por {session.openedBy || '—'} às {time(session.openedAt)}
            <span className="text-muted-foreground"> · dinheiro esperado na gaveta </span>
            <span className="font-semibold">{brl(summary.expectedCash)}</span>
          </span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setMovementType('SUPRIMENTO')}><ArrowDownToLine className="mr-1.5 h-4 w-4" aria-hidden />Suprimento</Button>
          <Button variant="outline" size="sm" onClick={() => setMovementType('SANGRIA')}><ArrowUpFromLine className="mr-1.5 h-4 w-4" aria-hidden />Sangria</Button>
          <Button size="sm" onClick={() => setClosing(true)}><Lock className="mr-1.5 h-4 w-4" aria-hidden />Fechar caixa</Button>
        </div>
      </div>

      <Dialog open={!!movementType} onOpenChange={(open) => { if (!open) setMovementType(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{movementType === 'SANGRIA' ? 'Sangria' : 'Suprimento'}</DialogTitle>
            <DialogDescription>{movementType === 'SANGRIA' ? 'Retirada de dinheiro da gaveta (ex.: depósito, pagamento).' : 'Entrada de dinheiro na gaveta (ex.: reforço de troco).'}</DialogDescription>
          </DialogHeader>
          <form id="cash-movement" className="space-y-3" onSubmit={(event) => { event.preventDefault(); submitMovement(); }}>
            <div className="space-y-1.5"><Label htmlFor="movement-amount">Valor (R$)</Label><Input id="movement-amount" inputMode="decimal" placeholder="0,00" value={movementAmount} onChange={(event) => setMovementAmount(event.target.value)} autoFocus /></div>
            <div className="space-y-1.5"><Label htmlFor="movement-reason">Motivo</Label><Input id="movement-reason" maxLength={300} value={movementReason} onChange={(event) => setMovementReason(event.target.value)} /></div>
          </form>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setMovementType(null)}>Cancelar</Button>
            <Button type="submit" form="cash-movement" disabled={movement.isPending}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closing} onOpenChange={setClosing}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Fechar caixa</DialogTitle>
            <DialogDescription>Conte o dinheiro da gaveta e confira as outras formas de pagamento com a maquininha e o extrato.</DialogDescription>
          </DialogHeader>
          <SummaryTable summary={summary} />
          <form id="cash-close" className="space-y-3" onSubmit={(event) => { event.preventDefault(); submitClose(); }}>
            <div className="space-y-1.5">
              <Label htmlFor="counted-cash">Dinheiro contado na gaveta (R$)</Label>
              <Input id="counted-cash" inputMode="decimal" placeholder="0,00" value={counted} onChange={(event) => setCounted(event.target.value)} autoFocus />
              {difference !== null && (
                <p role="status" className={`text-sm font-medium ${difference === 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                  {difference === 0 ? 'Bateu com o esperado.' : `${difference > 0 ? 'Sobra' : 'Falta'} de ${brl(Math.abs(difference))}.`}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="close-note">Observação {difference ? '(obrigatória: explique a diferença)' : '(opcional)'}</Label>
              <Textarea id="close-note" rows={2} maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
          </form>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setClosing(false)}>Voltar</Button>
            <Button type="submit" form="cash-close" disabled={closeCash.isPending}>Confirmar fechamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}

/** Resumo do caixa recém-fechado, com impressão. Fica fora do CashSessionBar porque ele desmonta ao fechar. */
export function ClosedCashDialog({ closed, onDone }: { closed: CashSession | null; onDone: () => void }) {
  return (
    <Dialog open={!!closed} onOpenChange={(open) => { if (!open) onDone(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Caixa fechado</DialogTitle>
          <DialogDescription>{closed?.closedAt ? `Fechado por ${closed.closedBy || '—'} em ${dateTime(closed.closedAt)}.` : ''}</DialogDescription>
        </DialogHeader>
        {closed && <SummaryTable summary={closed.summary} counted={closed.countedCash} difference={closed.difference} />}
        {closed?.closingNote && <p className="text-sm"><span className="text-muted-foreground">Observação:</span> {closed.closingNote}</p>}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => window.print()}>Imprimir</Button>
          <Button onClick={() => onDone()}>Concluir</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SummaryTable({ summary, counted, difference }: { summary: CashSession['summary']; counted?: string | null; difference?: string | null }) {
  const rows: Array<[string, string, boolean?]> = [
    ['Troco inicial', summary.opening],
    ...Object.entries(summary.byMethod).map(([method, value]) => [METHOD_LABEL[method] || method, value] as [string, string]),
    ['Suprimentos', summary.suprimentos],
    ['Sangrias', String(-Number(summary.sangrias) || 0)],
    ['Dinheiro esperado na gaveta', summary.expectedCash, true],
  ];
  if (counted != null) rows.push(['Dinheiro contado', counted, true]);
  if (difference != null) rows.push(['Diferença', difference, true]);
  return (
    <div className="rounded-lg border border-border text-sm">
      <p className="border-b border-border px-3 py-2 text-xs text-muted-foreground">{summary.salesCount} vendas ({brl(summary.salesTotal)}){summary.cancelledCount ? ` · ${summary.cancelledCount} canceladas` : ''}</p>
      <table className="w-full">
        <tbody>
          {rows.map(([label, value, strong]) => (
            <tr key={label} className={strong ? 'font-semibold' : ''}>
              <td className="px-3 py-1.5">{label}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{brl(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
