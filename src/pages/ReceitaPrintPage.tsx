import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { prescriptionApi, Prescription } from '@/api/prescriptionApi';

const formatDate = (value?: string) => {
  if (!value) return 'Não informado';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Não informado' : date.toLocaleDateString('pt-BR');
};

export function ReceitaPrintPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const prescriptionId = Number(id);
    if (!Number.isInteger(prescriptionId) || prescriptionId <= 0) {
      setError('Identificador de receita inválido.');
      setLoading(false);
      return () => { active = false; };
    }

    prescriptionApi.getPrescriptionById(prescriptionId)
      .then((data) => { if (active) setPrescription(data); })
      .catch((requestError: any) => {
        if (active) setError(requestError.response?.data?.error || 'Não foi possível carregar a receita persistida.');
      })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [id]);

  if (loading) return <div className="p-8 text-center" role="status">Carregando receita persistida...</div>;
  if (error || !prescription) {
    return <div className="mx-auto max-w-xl space-y-4 p-8" role="alert">
      <h1 className="text-xl font-semibold">Receita indisponível</h1>
      <p className="text-red-700">{error || 'A receita não foi encontrada ou não está disponível para esta clínica.'}</p>
      <button type="button" className="rounded border px-4 py-2" onClick={() => navigate(-1)}>Voltar</button>
    </div>;
  }

  const medicalRecord = prescription.medicalRecord;
  const appointment = medicalRecord?.appointment;
  const pet = appointment?.pet;

  return <main className="min-h-screen bg-white p-4 text-black print:p-0">
    <div className="mx-auto max-w-4xl print:max-w-none">
      <div className="mb-4 flex justify-between gap-3 print:hidden">
        <button type="button" className="rounded border px-4 py-2" onClick={() => navigate(-1)}>Voltar</button>
        <button type="button" className="rounded bg-blue-700 px-4 py-2 text-white" onClick={() => window.print()}>Imprimir</button>
      </div>
      <article className="space-y-6 border-2 border-gray-800 p-8 print:border-0">
        <header className="border-b-2 border-gray-800 pb-5 text-center">
          <h1 className="text-2xl font-bold">RECEITUÁRIO VETERINÁRIO</h1>
          <p className="mt-2">Receita #{prescription.id} · emitida em {formatDate(prescription.createdAt)}</p>
          <p className="mt-1 text-sm">Status: {prescription.status || 'RASCUNHO'}</p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <div><h2 className="font-semibold">Animal</h2><p>{prescription.petNameSnapshot || pet?.name || 'Não informado'} · {pet?.species || 'Espécie não informada'} · {pet?.breed || 'Raça não informada'}</p></div>
          <div><h2 className="font-semibold">Tutor</h2><p>{prescription.tutorNameSnapshot || pet?.tutor?.name || 'Não informado'}</p></div>
          <div><h2 className="font-semibold">Atendimento</h2><p>#{medicalRecord?.id || 'Não informado'} · agendamento #{appointment?.id || 'Não informado'}</p></div>
          <div><h2 className="font-semibold">Clínica</h2><p>{prescription.clinicNameSnapshot || 'Não informada'}</p></div>
          <div><h2 className="font-semibold">Veterinária responsável</h2><p>{prescription.veterinarianNameSnapshot || 'Não informada'}</p></div>
          <div><h2 className="font-semibold">Versão</h2><p>{prescription.currentVersion || 1}</p></div>
        </section>

        <section>
          <h2 className="mb-3 border-b pb-2 text-lg font-semibold">Prescrição</h2>
          <ol className="space-y-3">
            {prescription.items.map((item, index) => <li key={item.id || `${item.medication}-${index}`} className="rounded border p-4">
              <p className="font-semibold"><span>{index + 1}.</span> <span>{item.medication}</span></p>
              <p>Dosagem: {item.dosage} · Frequência: {item.frequency} · Duração: {item.duration}</p>
              {item.instructions && <p>Instruções: {item.instructions}</p>}
            </li>)}
          </ol>
          {!prescription.items.length && <p className="text-muted-foreground">Nenhum item persistido nesta receita.</p>}
        </section>

        <footer className="border-t pt-4 text-sm">
          <p>Assinatura: {prescription.signatureMode || 'VISUAL_ONLY'}.</p>
          <p className="mt-1">Esta impressão reproduz os dados persistidos pela aplicação e não declara assinatura digital verificável ou conformidade regulatória.</p>
        </footer>
      </article>
    </div>
  </main>;
}

export default ReceitaPrintPage;
