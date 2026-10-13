import { useCallback, useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { Button } from '@/components/ui/button';

type ServicePackage = { id: number; name: string; price: number | string; totalSessions: number; validityDays: number };
type PackageSession = { id: number; appointmentId: number; serviceId?: number | null; reversedAt?: string | null; reversalReason?: string | null };
type Contract = { id: number; contractedPrice: number | string; totalSessions: number; remainingSessions: number; expiresAt: string; package: ServicePackage; sessions: PackageSession[] };
type Notice = { id: number; eventType: string; category: string; status: string; createdAt: string };

const money = (value: number | string) => Number(value).toFixed(2).replace('.', ',');

export default function OperacaoPage() {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [contract, setContract] = useState<Contract | null>(null);
  const [history, setHistory] = useState<Notice[]>([]);
  const [tutorId, setTutorId] = useState('');
  const [petId, setPetId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [contractId, setContractId] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [loadError, setLoadError] = useState('');
  const communicationCategories = [
    ['BASIC', 'Básico'],
    ['PET_READY', 'Somente pet pronto'],
    ['FOLLOW_UP', 'Acompanhamento'],
    ['HEALTH', 'Saúde'],
    ['CAMPAIGNS', 'Campanhas'],
  ] as const;

  const validId = (value: string) => /^\d+$/.test(value) && Number(value) > 0;

  const load = useCallback(async () => {
    setLoading(true); setLoadError('');
    try {
      const packageResponse = await apiClient.get('/packages');
      setPackages(packageResponse.data.data ?? []);
      if (validId(tutorId)) {
        const historyResponse = await apiClient.get(`/tutors/${tutorId}/communication-history`);
        setHistory(historyResponse.data.data ?? []);
      } else setHistory([]);
      if (validId(contractId)) {
        const contractResponse = await apiClient.get(`/packages/contracts/${contractId}`);
        setContract(contractResponse.data.data ?? null);
      } else setContract(null);
    } catch (error: any) { setLoadError(error.response?.data?.error ?? 'Não foi possível carregar a operação.'); }
    finally { setLoading(false); }
  }, [contractId, tutorId]);

  useEffect(() => { void load(); }, [load]);

  const run = async (action: () => Promise<unknown>, success: string) => {
    try { setActionPending(true); await action(); setMessage(success); await load(); }
    catch (error: any) { setMessage(error.response?.data?.error ?? 'Operação recusada.'); }
    finally { setActionPending(false); }
  };

  const configure = async (category: string, enabled: boolean, stopAll = false, pausedUntil?: string | null) => {
    if (!validId(tutorId)) return setMessage('Informe um ID positivo de tutor.');
    await run(() => apiClient.put(`/tutors/${tutorId}/communication-preferences`, { sender: 'SYSTEM', category, enabled, stopAll, pausedUntil }), 'Preferência salva. O envio continua em modo simulação.');
  };

  return <main className="space-y-6 p-6">
    <header><h1 className="text-2xl font-semibold">Operação</h1><p className="text-muted-foreground">Banho e tosa, pacotes e comunicação simulada.</p></header>
    {loading && <p role="status" aria-live="polite" className="rounded-md border p-3 text-sm">Carregando operação...</p>}
    {loadError && <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">{loadError}</p>}
    {message && <p role="status" aria-live="polite" className="rounded-md border p-3 text-sm">{message}</p>}
    <section className="rounded-lg border bg-card p-4 space-y-4">
      <h2 className="text-lg font-medium">Preferências e histórico do tutor</h2>
      <div className="flex flex-wrap gap-2"><input aria-label="ID do tutor" className="h-10 rounded-md border bg-background px-3" placeholder="ID do tutor" value={tutorId} onChange={e => setTutorId(e.target.value)} />{communicationCategories.map(([category, label]) => <Button key={category} disabled={actionPending || !validId(tutorId)} variant="outline" onClick={() => configure(category, true)}>{label}</Button>)}<Button disabled={actionPending || !validId(tutorId)} variant="outline" onClick={() => configure('BASIC', true, false, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())}>Pausar 24h</Button><Button disabled={actionPending || !validId(tutorId)} variant="outline" onClick={() => configure('BASIC', false, true)}>Parada total</Button></div>
      <div className="space-y-2">{history.map(item => <div key={item.id} className="flex justify-between border-b py-2 text-sm"><span>{item.eventType} · {item.category}</span><span>{item.status}</span></div>)}{tutorId && !history.length && <p className="text-sm text-muted-foreground">Nenhum aviso para este tutor.</p>}</div>
    </section>
    <section className="rounded-lg border bg-card p-4 space-y-4">
      <h2 className="text-lg font-medium">Pacotes disponíveis</h2>
      <div className="grid gap-3 md:grid-cols-3">{packages.map(item => <article key={item.id} className="rounded-md border p-3"><h3 className="font-medium">{item.name}</h3><p>{item.totalSessions} sessões · {item.validityDays} dias</p><p className="font-semibold">R$ {money(item.price)}</p><Button className="mt-2" size="sm" onClick={() => setPackageId(String(item.id))}>Selecionar</Button></article>)}</div>
      {!packages.length && <p className="text-sm text-muted-foreground">Nenhum pacote ativo cadastrado.</p>}
      <div className="grid gap-2 md:grid-cols-3"><input aria-label="ID do pacote" className="h-10 rounded-md border bg-background px-3" placeholder="ID do pacote" value={packageId} onChange={e => setPackageId(e.target.value)} /><input aria-label="ID do pet" className="h-10 rounded-md border bg-background px-3" placeholder="ID do pet" value={petId} onChange={e => setPetId(e.target.value)} /><Button disabled={actionPending || !validId(packageId) || !validId(tutorId) || !validId(petId)} onClick={() => run(() => apiClient.post(`/packages/${packageId}/purchases`, { tutorId: Number(tutorId), petId: Number(petId) }).then(response => { setContractId(String(response.data.data.id)); }), 'Contrato criado e saldo disponível.')}>Criar contrato</Button></div>
    </section>
    <section className="rounded-lg border bg-card p-4 space-y-4">
      <h2 className="text-lg font-medium">Contrato e sessões</h2>
      <div className="grid gap-2 md:grid-cols-3"><input aria-label="ID do contrato" className="h-10 rounded-md border bg-background px-3" placeholder="ID do contrato" value={contractId} onChange={e => setContractId(e.target.value)} /><input aria-label="ID do atendimento" className="h-10 rounded-md border bg-background px-3" placeholder="ID do atendimento" value={appointmentId} onChange={e => setAppointmentId(e.target.value)} /><Button disabled={actionPending || !validId(contractId)} variant="outline" onClick={() => run(() => apiClient.get(`/packages/contracts/${contractId}`).then(response => setContract(response.data.data)), 'Contrato carregado.')}>Consultar contrato</Button></div>
      {contract && <div className="rounded-md border p-3 text-sm"><p><strong>{contract.package.name}</strong> · R$ {money(contract.contractedPrice)} · vence em {new Date(contract.expiresAt).toLocaleDateString('pt-BR')}</p><p>Saldo: {contract.remainingSessions}/{contract.totalSessions}</p><div className="mt-3 flex flex-wrap gap-2"><input aria-label="ID do serviço contratado" className="h-9 rounded-md border bg-background px-2" placeholder="ID do serviço" value={serviceId} onChange={e => setServiceId(e.target.value)} /><Button disabled={actionPending || !validId(appointmentId) || !validId(serviceId)} onClick={() => run(() => apiClient.post(`/packages/contracts/${contract.id}/consume`, { appointmentId: Number(appointmentId), serviceId: Number(serviceId) }), 'Sessão consumida.')}>Consumir sessão</Button></div>{contract.sessions.map(session => <div key={session.id} className="mt-2 flex flex-wrap items-center gap-2 border-t pt-2"><span>Sessão {session.id} · atendimento {session.appointmentId} · serviço {session.serviceId ?? 'não vinculado'} · {session.reversedAt ? `estornada: ${session.reversalReason}` : 'consumida'}</span>{!session.reversedAt && <><input aria-label={`Justificativa da sessão ${session.id}`} className="h-9 rounded-md border bg-background px-2" placeholder="Justificativa do estorno" value={sessionId === String(session.id) ? reason : ''} onChange={e => { setSessionId(String(session.id)); setReason(e.target.value); }} /><Button size="sm" variant="outline" disabled={actionPending || sessionId !== String(session.id) || !reason.trim()} onClick={() => run(() => apiClient.post(`/packages/sessions/${session.id}/reverse`, { reason: reason.trim() }), 'Sessão estornada e justificativa registrada.')}>Estornar</Button></>}</div>)}</div>}
    </section>
  </main>;
}
