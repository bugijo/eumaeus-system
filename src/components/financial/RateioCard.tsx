import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Split, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  useAllocationRules, useCreateAllocatedExpense, useDeleteAllocationRule, useResultCenters, useSaveAllocationRule,
  type AllocationShare,
} from '@/api/financialApi';

const brl = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const parseMoney = (value: string) => Number(String(value || '').replace(/\./g, '').replace(',', '.')) || 0;
const errorText = (error: unknown) => (error as any)?.response?.data?.error || (error as Error)?.message || 'Falha inesperada';

/**
 * Lança contas compartilhadas (aluguel, energia, água) uma única vez e divide entre unidades
 * por percentual. As regras ficam salvas para reutilizar todo mês.
 */
export function RateioCard({ canWrite }: { canWrite: boolean }) {
  const { data: centers = [] } = useResultCenters();
  const { data: rules = [] } = useAllocationRules();
  const saveRule = useSaveAllocationRule();
  const deleteRule = useDeleteAllocationRule();
  const createAllocated = useCreateAllocatedExpense();

  const [ruleId, setRuleId] = useState<string>('custom');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [incurredAt, setIncurredAt] = useState(() => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }));
  const [percents, setPercents] = useState<Record<number, string>>({});
  const [ruleName, setRuleName] = useState('');

  const activeCenters = centers.filter((center) => center.active !== false);
  const selectedRule = rules.find((rule) => String(rule.id) === ruleId);
  const shares: AllocationShare[] = useMemo(() => {
    if (selectedRule) return selectedRule.shares;
    return activeCenters
      .map((center) => ({ resultCenterId: center.id, percent: Number(String(percents[center.id] ?? '').replace(',', '.')) || 0 }))
      .filter((share) => share.percent > 0);
  }, [selectedRule, activeCenters, percents]);
  const percentSum = shares.reduce((sum, share) => sum + share.percent, 0);
  const total = parseMoney(amount);
  const centerName = (id: number) => centers.find((center) => center.id === id)?.name || `Centro ${id}`;

  if (activeCenters.length < 2) {
    return (
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Split className="h-5 w-5" />Rateio de contas compartilhadas</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">Cadastre pelo menos dois centros de resultado (ex.: CLINICA e PETSHOP) para dividir contas como aluguel, energia e água.</p></CardContent>
      </Card>
    );
  }

  const submit = async () => {
    if (!description.trim()) { toast.error('Informe a descrição da conta'); return; }
    if (total <= 0) { toast.error('Informe o valor total da conta'); return; }
    if (Math.abs(percentSum - 100) > 0.001) { toast.error(`A soma dos percentuais precisa ser 100% (está ${percentSum.toFixed(2)}%)`); return; }
    try {
      await createAllocated.mutateAsync({ description: description.trim(), amount: total, incurredAt, ...(selectedRule ? { ruleId: selectedRule.id } : { shares }) });
      toast.success(`Conta de ${brl(total)} lançada e dividida entre ${shares.length} unidades`);
      setDescription(''); setAmount('');
    } catch (error) { toast.error(errorText(error)); }
  };

  const persistRule = async () => {
    if (!ruleName.trim()) { toast.error('Dê um nome à regra (ex.: Energia)'); return; }
    try {
      const saved = await saveRule.mutateAsync({ name: ruleName.trim(), shares });
      toast.success(`Regra "${saved.name}" salva`);
      setRuleId(String(saved.id)); setRuleName('');
    } catch (error) { toast.error(errorText(error)); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Split className="h-5 w-5" />Rateio de contas compartilhadas</CardTitle>
        <CardDescription>Lance a conta uma vez e o sistema divide entre as unidades. Ex.: aluguel 50/50, energia 25% clínica e 75% pet shop.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rules.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {rules.map((rule) => (
              <Badge key={rule.id} variant={String(rule.id) === ruleId ? 'default' : 'outline'} className="cursor-pointer gap-1 py-1" onClick={() => { setRuleId(String(rule.id)); if (!description) setDescription(rule.name); }}>
                {rule.name}: {rule.shares.map((share) => `${centerName(share.resultCenterId)} ${share.percent}%`).join(' / ')}
                {canWrite && <button type="button" aria-label={`Excluir regra ${rule.name}`} onClick={(event) => { event.stopPropagation(); deleteRule.mutate(rule.id); if (String(rule.id) === ruleId) setRuleId('custom'); }}><Trash2 className="h-3 w-3" /></button>}
              </Badge>
            ))}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-4">
          <div className="space-y-1 md:col-span-2"><Label htmlFor="rateio-desc">Conta</Label><Input id="rateio-desc" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Ex.: Energia novembro" /></div>
          <div className="space-y-1"><Label htmlFor="rateio-valor">Valor total (R$)</Label><Input id="rateio-valor" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="3.000,00" inputMode="decimal" /></div>
          <div className="space-y-1"><Label htmlFor="rateio-data">Data</Label><Input id="rateio-data" type="date" value={incurredAt} onChange={(event) => setIncurredAt(event.target.value)} /></div>
        </div>

        <div className="space-y-1">
          <Label>Divisão</Label>
          <Select value={ruleId} onValueChange={setRuleId}>
            <SelectTrigger className="md:w-80"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="custom">Percentuais manuais</SelectItem>
              {rules.map((rule) => <SelectItem key={rule.id} value={String(rule.id)}>Regra: {rule.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {!selectedRule && (
          <div className="grid gap-3 md:grid-cols-3">
            {activeCenters.map((center) => (
              <div key={center.id} className="space-y-1">
                <Label htmlFor={`pct-${center.id}`}>{center.name} (%)</Label>
                <Input id={`pct-${center.id}`} inputMode="decimal" placeholder="0" value={percents[center.id] ?? ''} onChange={(event) => setPercents({ ...percents, [center.id]: event.target.value })} />
              </div>
            ))}
          </div>
        )}

        <div className="rounded-md border bg-muted/30 p-3 text-sm">
          {shares.length ? shares.map((share) => (
            <p key={share.resultCenterId} className="flex justify-between"><span>{centerName(share.resultCenterId)} · {share.percent}%</span><span className="font-medium">{brl((total * share.percent) / 100)}</span></p>
          )) : <p className="text-muted-foreground">Informe os percentuais de cada unidade.</p>}
          <p className={`mt-1 flex justify-between border-t pt-1 font-semibold ${Math.abs(percentSum - 100) > 0.001 ? 'text-destructive' : ''}`}><span>Soma</span><span>{percentSum.toFixed(2)}%</span></p>
        </div>

        {canWrite && (
          <div className="flex flex-wrap items-end gap-2">
            <Button onClick={submit} disabled={createAllocated.isPending}>Lançar conta dividida</Button>
            {!selectedRule && (
              <>
                <Input className="w-48" placeholder="Nome da regra (ex.: Energia)" value={ruleName} onChange={(event) => setRuleName(event.target.value)} aria-label="Nome da regra de rateio" />
                <Button variant="outline" onClick={persistRule} disabled={saveRule.isPending || Math.abs(percentSum - 100) > 0.001}>Salvar como regra</Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RateioCard;
