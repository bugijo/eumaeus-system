import { useCallback, useEffect, useState } from 'react';
import apiClient from '../api/apiClient';
import { Button } from '@/components/ui/button';
import { serviceApi, ServiceType } from '@/api/serviceApi';
import type { Appointment, Pet, Tutor } from '@/types';

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
  const [catalogServices, setCatalogServices] = useState<ServiceType[]>([]);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [packageForm, setPackageForm] = useState({ name: '', description: '', price: '', totalSessions: '3', validityDays: '30', coveredCatalogServiceId: '' });
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
  useEffect(() => {
    void Promise.all([
      apiClient.get('/tutors', { params: { limit: 100 } }).then(response => setTutors(response.data.data ?? [])),
      apiClient.get('/appointments').then(response => setAppointments(response.data ?? [])),
      serviceApi.getAllServices().then(setCatalogServices),
    ]).catch(() => setLoadError('Não foi possível carregar os dados da operação.'));
  }, []);

  useEffect(() => {
    if (!validId(tutorId)) {
      setPets([]);
      return;
    }
    void apiClient.get(`/tutors/${tutorId}/pets`)
      .then(response => setPets(response.data ?? []))
      .catch(() => setLoadError('Não foi possível carregar os pets do tutor selecionado.'));
  }, [tutorId]);

  const selectedTutor = tutors.find(tutor => String(tutor.id) === tutorId);
  const selectedPet = pets.find(pet => String(pet.id) === petId);
  const eligibleAppointments = appointments.filter(appointment =>
    String(appointment.tutorId) === tutorId && String(appointment.petId) === petId
  );
  const selectedAppointment = eligibleAppointments.find(appointment => String(appointment.id) === appointmentId);
  const appointmentServices = selectedAppointment?.services ?? [];

  const run = async (action: () => Promise<unknown>, success: string) => {
    try { setActionPending(true); await action(); setMessage(success); await load(); }
    catch (error: any) { setMessage(error.response?.data?.error ?? 'Operação recusada.'); }
    finally { setActionPending(false); }
  };

  const configure = async (category: string, enabled: boolean, stopAll = false, pausedUntil?: string | null) => {
    if (!validId(tutorId)) return setMessage('Informe um ID positivo de tutor.');
    await run(() => apiClient.put(`/tutors/${tutorId}/communication-preferences`, { sender: 'SYSTEM', category, enabled, stopAll, pausedUntil }), 'Preferência salva. O envio continua em modo simulação.');
  };

  const createPackage = async () => {
    try {
      setActionPending(true);
      await apiClient.post('/packages', { ...packageForm, price: Number(packageForm.price), totalSessions: Number(packageForm.totalSessions), validityDays: Number(packageForm.validityDays), coveredCatalogServiceId: Number(packageForm.coveredCatalogServiceId) });
      setPackageForm({ name: '', description: '', price: '', totalSessions: '3', validityDays: '30', coveredCatalogServiceId: '' });
      setMessage('Pacote persistido e vinculado ao serviço coberto.');
      await load();
    } catch (error: any) { setMessage(error.response?.data?.error ?? 'Pacote recusado.'); }
    finally { setActionPending(false); }
  };

  return <main className="space-y-6 p-6">
    <header><h1 className="text-2xl font-semibold">Operação</h1><p className="text-muted-foreground">Banho e tosa, pacotes e comunicação simulada.</p></header>
    {loading && <p role="status" aria-live="polite" className="rounded-md border p-3 text-sm">Carregando operação...</p>}
    {loadError && <p role="alert" className="rounded-md border border-destructive p-3 text-sm text-destructive">{loadError}</p>}
    {message && <p role="status" aria-live="polite" className="rounded-md border p-3 text-sm">{message}</p>}
    <section className="rounded-lg border bg-card p-4 space-y-4">
      <h2 className="text-lg font-medium">Preferências e histórico do tutor</h2>
      <div className="flex flex-wrap gap-2"><select aria-label="Tutor da operação" className="h-10 rounded-md border bg-background px-3" value={tutorId} onChange={e => { setTutorId(e.target.value); setPetId(''); setAppointmentId(''); }}>{<option value="">Selecione o tutor</option>}{tutors.map(tutor => <option key={tutor.id} value={tutor.id}>{tutor.name} · {tutor.email}</option>)}</select>{communicationCategories.map(([category, label]) => <Button key={category} disabled={actionPending || !validId(tutorId)} variant="outline" onClick={() => configure(category, true)}>{label}</Button>)}<Button disabled={actionPending || !validId(tutorId)} variant="outline" onClick={() => configure('BASIC', true, false, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())}>Pausar 24h</Button><Button disabled={actionPending || !validId(tutorId)} variant="outline" onClick={() => configure('BASIC', false, true)}>Parada total</Button></div>
      {selectedTutor && <p className="text-sm text-muted-foreground">Tutor selecionado: {selectedTutor.name}</p>}
      <div className="space-y-2">{history.map(item => <div key={item.id} className="flex justify-between border-b py-2 text-sm"><span>{item.eventType} · {item.category}</span><span>{item.status}</span></div>)}{tutorId && !history.length && <p className="text-sm text-muted-foreground">Nenhum aviso para este tutor.</p>}</div>
    </section>
    <section className="rounded-lg border bg-card p-4 space-y-4">
      <h2 className="text-lg font-medium">Pacotes disponíveis</h2>
      <div className="grid gap-2 md:grid-cols-3"><input aria-label="Nome do pacote" className="h-10 rounded-md border bg-background px-3" placeholder="Nome do pacote" value={packageForm.name} onChange={e => setPackageForm({ ...packageForm, name: e.target.value })} /><input aria-label="Preço do pacote" className="h-10 rounded-md border bg-background px-3" inputMode="decimal" placeholder="Preço" value={packageForm.price} onChange={e => setPackageForm({ ...packageForm, price: e.target.value })} /><select aria-label="Serviço coberto do pacote" className="h-10 rounded-md border bg-background px-3" value={packageForm.coveredCatalogServiceId} onChange={e => setPackageForm({ ...packageForm, coveredCatalogServiceId: e.target.value })}><option value="">Serviço coberto</option>{catalogServices.map(service => <option key={service.id} value={service.id}>{service.name} · {service.category}</option>)}</select><input aria-label="Sessões do pacote" className="h-10 rounded-md border bg-background px-3" type="number" min="1" value={packageForm.totalSessions} onChange={e => setPackageForm({ ...packageForm, totalSessions: e.target.value })} /><input aria-label="Validade do pacote" className="h-10 rounded-md border bg-background px-3" type="number" min="1" value={packageForm.validityDays} onChange={e => setPackageForm({ ...packageForm, validityDays: e.target.value })} /><input aria-label="Descrição do pacote" className="h-10 rounded-md border bg-background px-3" placeholder="Descrição" value={packageForm.description} onChange={e => setPackageForm({ ...packageForm, description: e.target.value })} /><Button disabled={actionPending || !packageForm.name.trim() || !packageForm.price || !packageForm.coveredCatalogServiceId} onClick={createPackage}>Criar pacote</Button></div>
      <div className="grid gap-3 md:grid-cols-3">{packages.map(item => <article key={item.id} className="rounded-md border p-3"><h3 className="font-medium">{item.name}</h3><p>{item.totalSessions} sessões · {item.validityDays} dias</p><p className="font-semibold">R$ {money(item.price)}</p><Button className="mt-2" size="sm" onClick={() => setPackageId(String(item.id))}>Selecionar</Button></article>)}</div>
      {!packages.length && <p className="text-sm text-muted-foreground">Nenhum pacote ativo cadastrado.</p>}
      <div className="grid gap-2 md:grid-cols-3"><select aria-label="Pet do tutor" className="h-10 rounded-md border bg-background px-3" value={petId} disabled={!validId(tutorId)} onChange={e => { setPetId(e.target.value); setAppointmentId(''); }}><option value="">Selecione o pet</option>{pets.map(pet => <option key={pet.id} value={pet.id}>{pet.name} · {pet.species}</option>)}</select><Button disabled={actionPending || !validId(packageId) || !validId(tutorId) || !validId(petId)} onClick={() => run(() => apiClient.post(`/packages/${packageId}/purchases`, { tutorId: Number(tutorId), petId: Number(petId) }).then(response => { setContractId(String(response.data.data.id)); }), 'Contrato criado e saldo disponível.')}>Contratar pacote selecionado</Button>{selectedPet && <p className="self-center text-sm text-muted-foreground">Pet selecionado: {selectedPet.name}</p>}</div>
    </section>
    <section className="rounded-lg border bg-card p-4 space-y-4">
      <h2 className="text-lg font-medium">Contrato e sessões</h2>
      <div className="grid gap-2 md:grid-cols-3"><input aria-label="ID do contrato para recuperar" className="h-10 rounded-md border bg-background px-3" placeholder="ID do contrato (recuperar)" value={contractId} onChange={e => setContractId(e.target.value)} /><select aria-label="Atendimento para consumo" className="h-10 rounded-md border bg-background px-3" value={appointmentId} disabled={!selectedPet} onChange={e => { setAppointmentId(e.target.value); setServiceId(''); }}><option value="">Selecione o atendimento</option>{eligibleAppointments.map(appointment => <option key={appointment.id} value={appointment.id}>{new Date(appointment.appointmentDate).toLocaleString('pt-BR')} · {appointment.status}</option>)}</select><Button disabled={actionPending || !validId(contractId)} variant="outline" onClick={() => run(() => apiClient.get(`/packages/contracts/${contractId}`).then(response => setContract(response.data.data)), 'Contrato carregado.')}>Consultar contrato</Button></div>
      {contract && <div className="rounded-md border p-3 text-sm"><p><strong>{contract.package.name}</strong> · R$ {money(contract.contractedPrice)} · vence em {new Date(contract.expiresAt).toLocaleDateString('pt-BR')}</p><p>Saldo: {contract.remainingSessions}/{contract.totalSessions}</p><div className="mt-3 flex flex-wrap gap-2"><select aria-label="Serviço do atendimento para consumo" className="h-9 rounded-md border bg-background px-2" value={serviceId} disabled={!selectedAppointment} onChange={e => setServiceId(e.target.value)}><option value="">Selecione o serviço</option>{appointmentServices.map(service => <option key={service.id} value={service.id}>{service.name} · R$ {money(service.price)}</option>)}</select><Button disabled={actionPending || !validId(appointmentId) || !validId(serviceId)} onClick={() => run(() => apiClient.post(`/packages/contracts/${contract.id}/consume`, { appointmentId: Number(appointmentId), serviceId: Number(serviceId) }), 'Sessão consumida.')}>Consumir sessão</Button></div>{contract.sessions.map(session => <div key={session.id} className="mt-2 flex flex-wrap items-center gap-2 border-t pt-2"><span>Sessão {session.id} · atendimento {session.appointmentId} · serviço {session.serviceId ?? 'não vinculado'} · {session.reversedAt ? `estornada: ${session.reversalReason}` : 'consumida'}</span>{!session.reversedAt && <><input aria-label={`Justificativa da sessão ${session.id}`} className="h-9 rounded-md border bg-background px-2" placeholder="Justificativa do estorno" value={sessionId === String(session.id) ? reason : ''} onChange={e => { setSessionId(String(session.id)); setReason(e.target.value); }} /><Button size="sm" variant="outline" disabled={actionPending || sessionId !== String(session.id) || !reason.trim()} onClick={() => run(() => apiClient.post(`/packages/sessions/${session.id}/reverse`, { reason: reason.trim() }), 'Sessão estornada e justificativa registrada.')}>Estornar</Button></>}</div>)}</div>}
    </section>
  </main>;
}
