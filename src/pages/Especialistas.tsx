import { FormEvent, useState } from 'react';
import { AlertTriangle, Loader2, Plus, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAddSpecialistAvailability, useCreateSpecialist, useSpecialists } from '@/api/specialistApi';

export default function Especialistas() {
  const { data = [], isLoading, error } = useSpecialists();
  const create = useCreateSpecialist();
  const addAvailability = useAddSpecialistAvailability();
  const [form, setForm] = useState({ userId: '', specialty: '', registration: '', repasseRate: '' });
  const [availability, setAvailability] = useState({ id: '', weekday: '1', startTime: '08:00', endTime: '17:00' });

  const submit = (event: FormEvent) => { event.preventDefault(); create.mutate({ userId: Number(form.userId), specialty: form.specialty, registration: form.registration || undefined, repasseRate: form.repasseRate ? Number(form.repasseRate) : undefined }); };
  const addTime = (event: FormEvent) => { event.preventDefault(); addAvailability.mutate({ id: Number(availability.id), weekday: Number(availability.weekday), startTime: availability.startTime, endTime: availability.endTime }); };

  if (isLoading) return <div className="flex items-center gap-2 p-6"><Loader2 className="animate-spin" /> Carregando especialistas...</div>;
  if (error) return <div className="p-6 text-red-600 flex gap-2"><AlertTriangle /> Não foi possível carregar especialistas. {error.message}</div>;

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Especialistas</h1><p className="text-sm text-muted-foreground">Cadastre apenas dados informados pela clínica. Habilitações e preços não são inferidos.</p></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Plus className="h-4 w-4" /> Novo especialista</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="grid gap-3 md:grid-cols-5"><Input aria-label="ID do usuário" placeholder="ID do usuário" value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })} required /><Input aria-label="Especialidade informada" placeholder="Especialidade informada" value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} required /><Input aria-label="Registro profissional" placeholder="Registro (opcional)" value={form.registration} onChange={e => setForm({ ...form, registration: e.target.value })} /><Input aria-label="Repasse" type="number" step="0.01" placeholder="Repasse % (opcional)" value={form.repasseRate} onChange={e => setForm({ ...form, repasseRate: e.target.value })} /><Button type="submit" disabled={create.isPending}>Cadastrar</Button></form>{create.isError && <p className="mt-2 text-sm text-red-600">{(create.error as Error).message}</p>}</CardContent></Card>
    <Card><CardHeader><CardTitle>Disponibilidade</CardTitle></CardHeader><CardContent><form onSubmit={addTime} className="grid gap-3 md:grid-cols-5"><Input aria-label="ID do especialista" placeholder="ID do especialista" value={availability.id} onChange={e => setAvailability({ ...availability, id: e.target.value })} required /><Input aria-label="Dia da semana" type="number" min="0" max="6" value={availability.weekday} onChange={e => setAvailability({ ...availability, weekday: e.target.value })} required /><Input aria-label="Início" type="time" value={availability.startTime} onChange={e => setAvailability({ ...availability, startTime: e.target.value })} required /><Input aria-label="Fim" type="time" value={availability.endTime} onChange={e => setAvailability({ ...availability, endTime: e.target.value })} required /><Button type="submit" disabled={addAvailability.isPending}>Adicionar horário</Button></form>{addAvailability.isError && <p className="mt-2 text-sm text-red-600">{(addAvailability.error as Error).message}</p>}</CardContent></Card>
    <div className="grid gap-4 md:grid-cols-2">{data.length === 0 ? <Card><CardContent className="p-6 text-sm text-muted-foreground">Nenhum especialista cadastrado.</CardContent></Card> : data.map(s => <Card key={s.id}><CardHeader><CardTitle className="flex items-center gap-2"><UserCheck className="h-4 w-4" /> {s.user?.name || `Usuário #${s.userId}`}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p><strong>Especialidade:</strong> {s.specialty}</p><p><strong>Registro:</strong> {s.registration || 'Não informado'}</p><p><strong>Repasse:</strong> {s.repasseRate ?? 'Não configurado'}</p><p><strong>Horários:</strong> {s.availabilities.length ? s.availabilities.map(a => `${a.weekday}: ${a.startTime}-${a.endTime}`).join(', ') : 'Nenhum informado'}</p></CardContent></Card>)}</div>
  </div>;
}
