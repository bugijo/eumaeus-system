import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  CalendarDays, 
  Plus, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle,
  Eye,
  Check,
  Loader2
} from 'lucide-react';
import { useApplyInvoiceDiscount, useFinancialStats, useInvoices } from '../api/invoiceApi';
import { ACCOUNTS_PAYABLE_DATA_SOURCE } from '../constants';
import { useCreateExpense, useExpenses, useReceivePayment, useResultCenters, useReversePayment } from '@/api/financialApi';
import { useAuthStore } from '@/stores/authStore';
import { decimalToNumber, formatBRL, normalizeDecimalInput } from '@/lib/decimal';

const newPaymentIdempotencyKey = () => `ui-payment-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

export default function Financeiro() {
  const [selectedPeriod, setSelectedPeriod] = useState('Este Mês');
  
  // Buscar dados da API
  const { data: financialStats, isLoading: statsLoading, error: statsError } = useFinancialStats();
  const { data: invoices, isLoading: invoicesLoading, error: invoicesError } = useInvoices();
  const discountMutation = useApplyInvoiceDiscount();
  const paymentMutation = useReceivePayment();
  const reverseMutation = useReversePayment();
  const { data: resultCenters = [] } = useResultCenters();
  const { data: expenses = [] } = useExpenses();
  const expenseMutation = useCreateExpense();
  const [expense, setExpense] = useState({ description: '', amount: '', reason: '', resultCenterId: '' });
  const [paymentDraft, setPaymentDraft] = useState({ invoiceId: '', amount: '', method: 'PIX', idempotencyKey: newPaymentIdempotencyKey() });
  const [reversalDraft, setReversalDraft] = useState({ paymentId: '', amount: '', reason: '' });
  const role = useAuthStore(state => state.user?.role);
  const canWriteFinancial = role === 'DONO' || role === 'FINANCEIRO';
  const canApplyDiscount = role === 'DONO' || role === 'FINANCEIRO';
  
  // Transformar faturas em contas a receber
  const contasReceber = invoices?.map(invoice => ({
    id: invoice.id,
    cliente: `${invoice.appointment.pet.tutor.name} - ${invoice.appointment.pet.name}`,
    dataVencimento: invoice.createdAt,
    valor: invoice.totalAmount,
    status: invoice.status === 'PAID' ? 'Pago' : invoice.status === 'PENDING' ? 'Pendente' : 'Cancelado'
  })) || [];

  // Loading state
  if (statsLoading || invoicesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dados financeiros...</span>
      </div>
    );
  }
  
  // Error state
  if (statsError || invoicesError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600">Erro ao carregar dados financeiros</p>
          <p className="text-sm text-gray-500 mt-1">
            {statsError?.message || invoicesError?.message || 'Erro desconhecido'}
          </p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Pago': { variant: 'default' as const, className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      'Pendente': { variant: 'secondary' as const, className: 'bg-warning-muted text-warning-muted-foreground hover:bg-warning-muted' },
      'Atrasado': { variant: 'destructive' as const, className: 'bg-red-100 text-red-800 hover:bg-red-100' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Pendente'];
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    );
  };

  // Períodos disponíveis para o filtro
  const periodos = ['Este Mês', 'Últimos 30 dias', 'Este Ano', 'Personalizado'];

  return (
    <div className="!bg-background p-6 space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-text-dark mb-6">Painel Financeiro</h1>
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Date Range Picker */}
          <div className="flex items-center space-x-2">
            <CalendarDays className="w-5 h-5 text-muted-foreground" />
            <div className="flex space-x-1">
              {periodos.map((periodo) => (
                <Button
                  key={periodo}
                  variant={selectedPeriod === periodo ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(periodo)}
                >
                  {periodo}
                </Button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Nova Receita
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas Pagas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatBRL(financialStats?.paid?.amount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialStats?.paid?.count || 0} faturas pagas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas Pendentes</CardTitle>
            <TrendingDown className="h-4 w-4 text-warning-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning-muted-foreground">
              {formatBRL(financialStats?.pending?.amount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialStats?.pending?.count || 0} faturas pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Receitas</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatBRL(decimalToNumber(financialStats?.paid?.amount) + decimalToNumber(financialStats?.pending?.amount))}
            </div>
            <p className="text-xs text-muted-foreground">
              {(financialStats?.paid?.count || 0) + (financialStats?.pending?.count || 0)} faturas no total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturas Canceladas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatBRL(financialStats?.cancelled?.amount)}
            </div>
            <p className="text-xs text-muted-foreground">
              {financialStats?.cancelled?.count || 0} faturas canceladas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed View - Tabs */}
      <Card><CardHeader><CardTitle>Centros de resultado</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2">{resultCenters.length ? resultCenters.map(center => <Badge key={center.id} variant="outline">{center.code} · {center.name}</Badge>) : <span className="text-sm text-muted-foreground">Nenhum centro classificado; registros antigos permanecem sem atribuição.</span>}</div></CardContent></Card>
      <Card><CardHeader><CardTitle>Despesas classificadas</CardTitle></CardHeader><CardContent className="space-y-4">
        {canWriteFinancial ? <form className="grid gap-2 md:grid-cols-5" onSubmit={(event) => { event.preventDefault(); const amount = normalizeDecimalInput(expense.amount); if (!expense.description.trim() || !amount || !expense.reason.trim()) return; expenseMutation.mutate({ description: expense.description.trim(), amount, reason: expense.reason.trim(), resultCenterId: expense.resultCenterId ? Number(expense.resultCenterId) : undefined }, { onSuccess: () => setExpense({ description: '', amount: '', reason: '', resultCenterId: '' }) }); }}>
          <input aria-label="Descrição da despesa" className="rounded-md border px-3 py-2 text-sm" placeholder="Descrição" value={expense.description} onChange={event => setExpense({ ...expense, description: event.target.value })} />
          <input aria-label="Valor da despesa" className="rounded-md border px-3 py-2 text-sm" placeholder="Valor" inputMode="decimal" value={expense.amount} onChange={event => setExpense({ ...expense, amount: event.target.value })} />
          <select aria-label="Centro da despesa" className="rounded-md border px-3 py-2 text-sm" value={expense.resultCenterId} onChange={event => setExpense({ ...expense, resultCenterId: event.target.value })}><option value="">Sem centro</option>{resultCenters.map(center => <option key={center.id} value={center.id}>{center.code} · {center.name}</option>)}</select>
          <input aria-label="Justificativa da despesa" className="rounded-md border px-3 py-2 text-sm" placeholder="Justificativa" value={expense.reason} onChange={event => setExpense({ ...expense, reason: event.target.value })} />
          <Button type="submit" disabled={expenseMutation.isPending}>Registrar despesa</Button>
        </form> : <p className="text-sm text-muted-foreground" role="status">Perfil somente leitura: despesas podem ser consultadas, mas apenas DONO ou FINANCEIRO podem registrá-las.</p>}
        {expenseMutation.isError && <p className="text-sm text-red-600">{(expenseMutation.error as Error).message}</p>}
        {expenses.length ? <Table><TableHeader><TableRow><TableHead>Descrição</TableHead><TableHead>Centro</TableHead><TableHead>Valor</TableHead><TableHead>Justificativa</TableHead></TableRow></TableHeader><TableBody>{expenses.map(item => <TableRow key={item.id}><TableCell>{item.description}</TableCell><TableCell>{item.resultCenter ? `${item.resultCenter.code} · ${item.resultCenter.name}` : 'Sem centro'}</TableCell><TableCell>{formatBRL(item.amount)}</TableCell><TableCell>{item.reason}</TableCell></TableRow>)}</TableBody></Table> : <p className="text-sm text-muted-foreground">Nenhuma despesa registrada.</p>}
      </CardContent></Card>
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="receber" className="w-full">
            <div className="border-b">
              <TabsList className={`grid w-full ${ACCOUNTS_PAYABLE_DATA_SOURCE.visible ? 'grid-cols-2' : 'grid-cols-1'} bg-transparent h-auto p-0`}>
                <TabsTrigger 
                  value="receber" 
                  className="py-4 px-6 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Contas a Receber
                </TabsTrigger>
                {ACCOUNTS_PAYABLE_DATA_SOURCE.visible && (
                  <TabsTrigger
                    value="pagar"
                    className="py-4 px-6 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                  >
                    Contas a Pagar
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            <TabsContent value="receber" className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tutor/Descrição</TableHead>
                    <TableHead>Data de Vencimento</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Recebimentos</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contasReceber.map((conta) => (
                    <TableRow key={conta.id}>
                      <TableCell className="font-medium">{conta.cliente}</TableCell>
                      <TableCell>{formatDate(conta.dataVencimento)}</TableCell>
                      <TableCell className="font-semibold">{formatBRL(conta.valor)}</TableCell>
                      <TableCell>{getStatusBadge(conta.status)}</TableCell>
                      <TableCell>{(invoices?.find(invoice => invoice.id === conta.id)?.payments ?? []).map(payment => `${formatBRL(payment.amount)} · ${payment.status}`).join(' | ') || 'Nenhum'}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {conta.status === 'Pendente' && (
                            <Button size="sm" variant="outline" aria-label={`Registrar recebimento da fatura ${conta.id}`} onClick={() => setPaymentDraft({ invoiceId: String(conta.id), amount: '', method: 'PIX', idempotencyKey: newPaymentIdempotencyKey() })}>
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          {conta.status === 'Pendente' && canApplyDiscount && (
                            <Button size="sm" variant="outline" onClick={() => {
                              const amount = window.prompt('Valor do desconto (R$):');
                              const reason = window.prompt('Justificativa obrigatória:');
                              if (amount && reason) discountMutation.mutate({ invoiceId: conta.id, amount: Number(amount.replace(',', '.')), reason });
                            }}>Desconto</Button>
                          )}
                          <Button size="sm" variant="outline" aria-label={`Visualizar fatura ${conta.id}`}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {conta.status === 'Pago' && (invoices?.find(invoice => invoice.id === conta.id)?.payments ?? []).filter(payment => payment.status === 'POSTED').map(payment => (
                            <Button key={payment.id} size="sm" variant="outline" onClick={() => setReversalDraft({ paymentId: String(payment.id), amount: String(payment.amount), reason: '' })}>Estornar recebimento</Button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {paymentDraft.invoiceId && (
                <div className="mt-4 rounded-md border p-4" aria-label="Formulário de recebimento">
                  <h3 className="font-medium">Registrar recebimento — fatura #{paymentDraft.invoiceId}</h3>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <label className="grid gap-1 text-sm">Valor recebido (R$)
                      <input aria-label="Valor recebido" className="h-9 rounded-md border bg-background px-2" value={paymentDraft.amount} onChange={e => setPaymentDraft(current => ({ ...current, amount: e.target.value }))} placeholder="5,00" />
                    </label>
                    <label className="grid gap-1 text-sm">Forma de pagamento
                      <select aria-label="Forma de pagamento" className="h-9 rounded-md border bg-background px-2" value={paymentDraft.method} onChange={e => setPaymentDraft(current => ({ ...current, method: e.target.value }))}>
                        <option value="PIX">PIX</option><option value="cartão">Cartão</option><option value="dinheiro">Dinheiro</option>
                      </select>
                    </label>
                    <div className="flex items-end gap-2">
                      <Button disabled={!normalizeDecimalInput(paymentDraft.amount) || paymentMutation.isPending} onClick={() => { const amount = normalizeDecimalInput(paymentDraft.amount); if (!amount) return; paymentMutation.mutate({ invoiceId: Number(paymentDraft.invoiceId), amount, method: paymentDraft.method, idempotencyKey: paymentDraft.idempotencyKey }, { onSuccess: () => setPaymentDraft({ invoiceId: '', amount: '', method: 'PIX', idempotencyKey: newPaymentIdempotencyKey() }) }); }}>Registrar recebimento</Button>
                      <Button type="button" variant="outline" onClick={() => setPaymentDraft({ invoiceId: '', amount: '', method: 'PIX', idempotencyKey: newPaymentIdempotencyKey() })}>Cancelar</Button>
                    </div>
                  </div>
                  {paymentMutation.error && <p role="alert" className="mt-2 text-sm text-red-600">{paymentMutation.error instanceof Error ? paymentMutation.error.message : 'Não foi possível registrar o recebimento.'}</p>}
                </div>
              )}
              {reversalDraft.paymentId && (
                <div className="mt-4 rounded-md border p-4" aria-label="Formulário de estorno">
                  <h3 className="font-medium">Estornar recebimento #{reversalDraft.paymentId}</h3>
                  <p className="text-sm text-muted-foreground">Valor original: R$ {reversalDraft.amount}</p>
                  <label className="mt-3 grid gap-1 text-sm">Justificativa do estorno
                    <input aria-label="Justificativa do estorno" className="h-9 rounded-md border bg-background px-2" value={reversalDraft.reason} onChange={e => setReversalDraft(current => ({ ...current, reason: e.target.value }))} placeholder="Justificativa sintética obrigatória" />
                  </label>
                  <div className="mt-3 flex gap-2">
                    <Button disabled={!reversalDraft.reason.trim() || reverseMutation.isPending} onClick={() => reverseMutation.mutate({ paymentId: Number(reversalDraft.paymentId), reason: reversalDraft.reason.trim() }, { onSuccess: () => setReversalDraft({ paymentId: '', amount: '', reason: '' }) })}>Registrar estorno</Button>
                    <Button type="button" variant="outline" onClick={() => setReversalDraft({ paymentId: '', amount: '', reason: '' })}>Cancelar</Button>
                  </div>
                  {reverseMutation.error && <p role="alert" className="mt-2 text-sm text-red-600">{reverseMutation.error instanceof Error ? reverseMutation.error.message : 'Não foi possível registrar o estorno.'}</p>}
                </div>
              )}
            </TabsContent>

          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
