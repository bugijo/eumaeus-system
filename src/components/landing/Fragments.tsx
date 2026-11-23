import { Printer } from 'lucide-react';

/** Recortes das telas reais, em HTML, para a seção de módulos. Dados de exemplo. */

const panel = 'rounded-xl bg-muted/60 p-4 text-sm';

export function AgendaFragment() {
  const rows = [
    { time: '09:00', pet: 'Thor', what: 'Consulta', status: 'Confirmado', tone: 'text-secondary bg-secondary/10' },
    { time: '10:30', pet: 'Mel', what: 'Banho e tosa', status: 'Em andamento', tone: 'text-primary bg-primary/10' },
    { time: '14:00', pet: 'Nina', what: 'Vacina V10', status: 'Aguardando', tone: 'text-muted-foreground bg-background' },
  ];
  return (
    <ul className={`${panel} divide-y divide-border/70`} aria-hidden="true">
      {rows.map((row) => (
        <li key={row.time} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <span className="w-11 shrink-0 font-medium tabular-nums">{row.time}</span>
          <span className="min-w-0 flex-1 truncate">{row.what} · {row.pet}</span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${row.tone}`}>{row.status}</span>
        </li>
      ))}
    </ul>
  );
}

export function StockFragment() {
  const rows = [
    { name: 'Vacina V10', detail: 'Lote 2231 · vence em 15 dias', badge: 'Sai primeiro', tone: 'text-amber-800 bg-amber-100' },
    { name: 'Antipulgas 10 a 25 kg', detail: '2 unidades no estoque', badge: 'Estoque baixo', tone: 'text-red-700 bg-red-100' },
    { name: 'Ração Premium Adulto 1 kg', detail: '12 unidades · vence em 4 meses', badge: 'Em dia', tone: 'text-secondary bg-secondary/10' },
  ];
  return (
    <ul className={`${panel} divide-y divide-border/70`} aria-hidden="true">
      {rows.map((row) => (
        <li key={row.name} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
          <span className="min-w-0">
            <span className="block truncate font-medium">{row.name}</span>
            <span className="block truncate text-xs text-muted-foreground">{row.detail}</span>
          </span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${row.tone}`}>{row.badge}</span>
        </li>
      ))}
    </ul>
  );
}

export function PrescriptionFragment() {
  return (
    <div className={panel} aria-hidden="true">
      <div className="rounded-lg bg-background p-4 shadow-[0_8px_20px_-12px_rgba(0,40,80,0.35)]">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="font-semibold">Receituário</span>
          <span className="inline-flex items-center gap-1.5 text-xs text-primary">
            <Printer className="h-3.5 w-3.5" strokeWidth={1.75} /> Imprimir
          </span>
        </div>
        <p className="mt-2.5 text-xs text-muted-foreground">Paciente: Thor · canino · 18 kg</p>
        <p className="mt-2 font-medium">Uso oral</p>
        <p className="text-foreground/80">Amoxicilina 250 mg, 1 comprimido a cada 12 horas, por 7 dias.</p>
      </div>
    </div>
  );
}

export function TeamFragment() {
  const rows = [
    { role: 'Veterinário', can: 'Prontuários, receitas, estoque' },
    { role: 'Recepção', can: 'Agenda, tutores, caixa' },
    { role: 'Financeiro', can: 'Financeiro, caixa, relatórios' },
  ];
  return (
    <ul className={`${panel} divide-y divide-border/70`} aria-hidden="true">
      {rows.map((row) => (
        <li key={row.role} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
            {row.role.slice(0, 2)}
          </span>
          <span className="min-w-0">
            <span className="block font-medium">{row.role}</span>
            <span className="block truncate text-xs text-muted-foreground">{row.can}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
