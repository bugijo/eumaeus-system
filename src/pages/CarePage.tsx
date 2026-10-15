import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { careApi, useAdmit, useAdmissions, useCreateSurgery, useSurgeries } from '@/api/careApi';
import { usePets } from '@/api/petApi';
import { useAppointments } from '@/api/appointmentApi';
import { useSpecialists } from '@/api/specialistApi';

export default function CarePage() {
  const admissions = useAdmissions();
  const surgeries = useSurgeries();
  const pets = usePets({ page: 1, limit: 100 });
  const appointments = useAppointments();
  const specialists = useSpecialists();
  const admit = useAdmit();
  const createSurgery = useCreateSurgery();
  const [petId, setPetId] = useState('');
  const [userId, setUserId] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [veterinarianId, setVeterinarianId] = useState('');
  const [notes, setNotes] = useState('');
  const [surgeryNotes, setSurgeryNotes] = useState('');
  const [admissionId, setAdmissionId] = useState('');
  const [surgeryId, setSurgeryId] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [medication, setMedication] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dischargeNotes, setDischargeNotes] = useState('');
  const [handoffUserId, setHandoffUserId] = useState('');
  const [handoffNotes, setHandoffNotes] = useState('');
  const [budgetDescription, setBudgetDescription] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetVersionId, setBudgetVersionId] = useState('');
  const [consentNotes, setConsentNotes] = useState('');
  const [checklistLabel, setChecklistLabel] = useState('');
  const [instructionText, setInstructionText] = useState('');
  const [message, setMessage] = useState('');
  const [actionPending, setActionPending] = useState(false);
  const requiredText = (value: string) => value.trim().length > 0;
  const numericId = (value: string) => requiredText(value) && /^\d+$/.test(value) && Number(value) > 0;
  const nonEmpty = (value: string) => value.trim().length > 0;
  const submitAdmission = async () => { if (!numericId(petId) || !numericId(userId)) { setMessage('Informe o pet e o ID positivo do responsável autorizado.'); return; } try { setActionPending(true); await admit.mutateAsync({ petId: Number(petId), responsibleUserId: Number(userId), appointmentId: numericId(appointmentId) ? Number(appointmentId) : undefined, observations: notes.trim() || undefined }); setMessage('Admissão registrada.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Admissão recusada.'); } finally { setActionPending(false); } };
  const submitSurgery = async () => { if (!numericId(petId) || !numericId(veterinarianId)) { setMessage('Selecione o pet e uma veterinária autorizada.'); return; } try { setActionPending(true); await createSurgery.mutateAsync({ petId: Number(petId), veterinarianId: Number(veterinarianId), appointmentId: numericId(appointmentId) ? Number(appointmentId) : undefined, notes: surgeryNotes.trim() || undefined }); setMessage('Cirurgia planejada.'); } catch (error) { setMessage(error instanceof Error ? error.message : 'Cirurgia recusada.'); } finally { setActionPending(false); } };
  const run = async (action: () => Promise<unknown>, success: string) => { try { setActionPending(true); await action(); setMessage(success); await Promise.all([admissions.refetch(), surgeries.refetch()]); } catch (error) { setMessage(error instanceof Error ? error.message : 'Operação recusada.'); } finally { setActionPending(false); } };
  const submitBudget = () => {
    const amount = Number(budgetAmount.replace(',', '.'));
    if (!nonEmpty(budgetDescription) || !Number.isFinite(amount) || amount <= 0) { setMessage('Informe descrição e valor positivo para criar uma versão de orçamento.'); return; }
    void run(() => careApi.addBudget(Number(surgeryId), { description: budgetDescription.trim(), amount: amount.toFixed(2) }), 'Nova versão de orçamento registrada.');
  };
  const submitConsent = () => {
    if (!numericId(budgetVersionId) || !nonEmpty(consentNotes)) { setMessage('Informe a versão do orçamento e a observação do consentimento.'); return; }
    void run(() => careApi.addConsent(Number(surgeryId), { budgetVersionId: Number(budgetVersionId), notes: consentNotes.trim() }), 'Consentimento registrado.');
  };
  const submitChecklist = () => {
    if (!nonEmpty(checklistLabel)) { setMessage('Informe o item do checklist antes de adicionar.'); return; }
    void run(() => careApi.addChecklist(Number(surgeryId), { label: checklistLabel.trim() }), 'Item de checklist registrado.');
  };
  const submitInstruction = () => {
    if (!nonEmpty(instructionText)) { setMessage('Informe a orientação da veterinária antes de registrar.'); return; }
    void run(() => careApi.addInstruction(Number(surgeryId), { instruction: instructionText.trim() }), 'Orientação registrada para aprovação.');
  };
  const selectedAdmission = admissions.data?.find(item => String(item.id) === admissionId);
  const selectedSurgery = surgeries.data?.find(item => String(item.id) === surgeryId) as (typeof surgeries.data extends Array<infer T> ? T & { checklist?: Array<{ id: number; label: string; completedAt?: string | null }>; instructions?: Array<{ id: number; instruction: string; approvedAt?: string | null }> } : never) | undefined;
  if (admissions.isLoading || surgeries.isLoading || pets.isLoading || appointments.isLoading || specialists.isLoading) return <div className="p-8"><LoadingSpinner size="lg" /></div>;
  if (admissions.error || surgeries.error || pets.error || appointments.error || specialists.error) return <div className="p-8 text-destructive">Não foi possível carregar os registros assistenciais.</div>;
  const petOptions = pets.data?.data ?? [];
  const appointmentOptions = (appointments.data ?? []).filter(item => !petId || item.petId === Number(petId));
  const specialistOptions = (specialists.data ?? []).filter(item => item.active && item.user?.name);
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Internação e cirurgia</h1><p className="text-muted-foreground">Registros operacionais persistentes; prescrições e orientações dependem da veterinária.</p></div>
    <Card><CardHeader><CardTitle>Nova admissão ou planejamento</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <label className="grid min-w-0 gap-1 text-sm"><span>Pet</span><select aria-label="Pet" className="h-10 min-w-0 rounded-md border bg-background px-3" value={petId} onChange={e => { setPetId(e.target.value); setAppointmentId(''); }}><option value="">Selecione o pet</option>{petOptions.map(pet => <option key={pet.id} value={pet.id}>{pet.name} · #{pet.id}</option>)}</select></label>
      <label className="grid min-w-0 gap-1 text-sm xl:col-span-2"><span>Atendimento vinculado (opcional)</span><select aria-label="Atendimento vinculado" className="h-10 min-w-0 rounded-md border bg-background px-3" value={appointmentId} onChange={e => setAppointmentId(e.target.value)}><option value="">Sem atendimento vinculado</option>{appointmentOptions.map(item => <option key={item.id} value={item.id}>#{item.id} · {new Date(item.appointmentDate).toLocaleString('pt-BR')} · {item.status}</option>)}</select></label>
      <label className="grid min-w-0 gap-1 text-sm"><span>Responsável autorizado</span><Input aria-label="ID do responsável autorizado" type="number" min="1" placeholder="ID do usuário" value={userId} onChange={e => setUserId(e.target.value)} /></label>
      <label className="grid min-w-0 gap-1 text-sm"><span>Observação</span><Input aria-label="Observação" placeholder="Observação" value={notes} onChange={e => setNotes(e.target.value)} /></label>
      <label className="grid min-w-0 gap-1 text-sm xl:col-span-2"><span>Veterinária para cirurgia</span><select aria-label="Veterinária autorizada" className="h-10 min-w-0 rounded-md border bg-background px-3" value={veterinarianId} onChange={e => setVeterinarianId(e.target.value)}><option value="">Selecione a veterinária</option>{specialistOptions.map(item => <option key={item.userId} value={item.userId}>{item.user?.name} · {item.specialty}</option>)}</select></label>
      <div className="flex gap-2"><Button onClick={submitAdmission} disabled={actionPending}>Admitir</Button><Button variant="outline" onClick={submitSurgery} disabled={actionPending}>Planejar cirurgia</Button></div>
      <Input aria-label="Notas da cirurgia" className="md:col-span-4" placeholder="Notas informadas pela veterinária (opcional)" value={surgeryNotes} onChange={e => setSurgeryNotes(e.target.value)} />
      <p className="text-xs text-muted-foreground md:col-span-4">A lista de pets, atendimentos e veterinárias vem da clínica atual. O responsável da internação exige o ID do usuário autorizado porque ainda não há endpoint de usuários para seleção.</p>
      {message && <p role="status" aria-live="polite" className="md:col-span-4 text-sm">{message}</p>}
    </CardContent></Card>
    <div className="grid gap-6 lg:grid-cols-2"><Card><CardHeader><CardTitle>Internações</CardTitle></CardHeader><CardContent>{admissions.data?.length ? admissions.data.map(item => <button type="button" key={item.id} onClick={() => setAdmissionId(String(item.id))} className={`block w-full border-b py-2 text-left ${admissionId === String(item.id) ? 'bg-muted' : ''}`}>#{item.id} · pet {item.pet?.name ?? item.petId} · {item.status}</button>) : <p className="text-muted-foreground">Nenhuma admissão.</p>}</CardContent></Card><Card><CardHeader><CardTitle>Cirurgias planejadas</CardTitle></CardHeader><CardContent>{surgeries.data?.length ? surgeries.data.map(item => <button type="button" key={item.id} onClick={() => setSurgeryId(String(item.id))} className={`block w-full border-b py-2 text-left ${surgeryId === String(item.id) ? 'bg-muted' : ''}`}>#{item.id} · pet {item.pet?.name ?? item.petId} · {item.status} · {item.budgets.length} orçamento(s)</button>) : <p className="text-muted-foreground">Nenhuma cirurgia.</p>}</CardContent></Card></div>
    {admissionId && <Card><CardHeader><CardTitle>Operações da internação #{admissionId}</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-4"><Input aria-label="Título da tarefa" placeholder="Título da tarefa" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} /><Input aria-label="Observação da tarefa" placeholder="Observação" value={taskNotes} onChange={e => setTaskNotes(e.target.value)} /><Button disabled={actionPending || !taskTitle.trim()} onClick={() => run(() => careApi.addTask(Number(admissionId), { title: taskTitle.trim(), notes: taskNotes.trim() || undefined }), 'Tarefa registrada.')}>Registrar tarefa</Button><Button variant="outline" disabled={actionPending || !dischargeNotes.trim()} onClick={() => run(() => careApi.discharge(Number(admissionId), { notes: dischargeNotes.trim() }), 'Alta registrada para revisão.')}>Alta com justificativa</Button><Input aria-label="ID do próximo responsável" type="number" min="1" placeholder="ID próximo responsável autorizado" value={handoffUserId} onChange={e => setHandoffUserId(e.target.value)} /><Input aria-label="Observação da passagem" placeholder="Observação da passagem" value={handoffNotes} onChange={e => setHandoffNotes(e.target.value)} /><Button disabled={actionPending || !numericId(handoffUserId) || !handoffNotes.trim()} onClick={() => run(() => careApi.handoff(Number(admissionId), { toUserId: Number(handoffUserId), notes: handoffNotes.trim() }), 'Passagem registrada.')}>Passar responsabilidade</Button><Input aria-label="Medicamento prescrito" placeholder="Medicamento informado pela veterinária" value={medication} onChange={e => setMedication(e.target.value)} /><Input aria-label="Instruções da prescrição" placeholder="Instruções" value={instructions} onChange={e => setInstructions(e.target.value)} /><Button disabled={actionPending || !medication.trim() || !instructions.trim()} onClick={() => run(() => careApi.addPrescription(Number(admissionId), { medication: medication.trim(), instructions: instructions.trim() }), 'Prescrição registrada.')}>Registrar prescrição</Button><Input aria-label="Justificativa de alta" className="md:col-span-2" placeholder="Justificativa de alta" value={dischargeNotes} onChange={e => setDischargeNotes(e.target.value)} />{selectedAdmission?.tasks?.map(task => <div key={task.id} className="md:col-span-4 flex items-center justify-between border-b py-1"><span>{task.title} · {task.status}</span>{task.status !== 'EXECUTED' && <Button size="sm" variant="outline" disabled={actionPending} onClick={() => run(() => careApi.executeTask(task.id, { notes: taskNotes.trim() || undefined }), 'Tarefa marcada como executada.')}>Registrar execução real</Button>}</div>)}{selectedAdmission?.prescriptions?.map(prescription => <div key={prescription.id} className="md:col-span-4 rounded border p-2 text-sm"><div className="font-medium">Prescrição #{prescription.id} · {prescription.medication}</div><div className="text-muted-foreground">{prescription.instructions}</div></div>)}</CardContent></Card>}
    {surgeryId && <Card><CardHeader><CardTitle>Operações da cirurgia #{surgeryId}</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-4"><Input aria-label="Descrição do orçamento" placeholder="Descrição do orçamento" value={budgetDescription} onChange={e => setBudgetDescription(e.target.value)} /><Input aria-label="Valor do orçamento" type="number" min="0" step="0.01" placeholder="Valor Decimal" value={budgetAmount} onChange={e => setBudgetAmount(e.target.value)} /><Button disabled={actionPending || !nonEmpty(budgetDescription) || !(Number(budgetAmount.replace(',', '.')) > 0)} onClick={submitBudget}>Nova versão</Button><Input aria-label="ID da versão do orçamento" type="number" placeholder="ID versão para consentimento" value={budgetVersionId} onChange={e => setBudgetVersionId(e.target.value)} /><Input aria-label="Observação do consentimento" placeholder="Observação do consentimento" value={consentNotes} onChange={e => setConsentNotes(e.target.value)} /><Button disabled={actionPending || !numericId(budgetVersionId) || !nonEmpty(consentNotes)} onClick={submitConsent}>Registrar consentimento</Button><Input aria-label="Item do checklist" placeholder="Item do checklist" value={checklistLabel} onChange={e => setChecklistLabel(e.target.value)} /><Button disabled={actionPending || !nonEmpty(checklistLabel)} onClick={submitChecklist}>Adicionar checklist</Button><Input aria-label="Orientação cirúrgica" className="md:col-span-2" placeholder="Orientação informada pela veterinária" value={instructionText} onChange={e => setInstructionText(e.target.value)} /><Button disabled={actionPending || !nonEmpty(instructionText)} onClick={submitInstruction}>Registrar orientação</Button>{selectedSurgery?.checklist?.map(item => <div key={item.id} className="md:col-span-4 flex items-center justify-between border-b py-1"><span>{item.label}</span>{!item.completedAt && <Button size="sm" variant="outline" disabled={actionPending} onClick={() => run(() => careApi.completeChecklist(item.id, {}), 'Checklist preenchido.')}>Preencher checklist</Button>}</div>)}{selectedSurgery?.instructions?.map(item => <div key={item.id} className="md:col-span-4 flex items-center justify-between border-b py-1"><span>{item.instruction}</span>{!item.approvedAt && <Button size="sm" variant="outline" disabled={actionPending} onClick={() => run(() => careApi.approveInstruction(item.id), 'Orientação aprovada.')}>Aprovar orientação</Button>}</div>)}</CardContent></Card>}
  </div>;
}
