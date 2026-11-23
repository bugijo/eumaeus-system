import { useId, useState } from 'react';
import { brl } from './format';

const BILL_CENTS = 88000; // conta de energia de exemplo: R$ 880,00

/** Demonstração do rateio: o visitante move a regra e vê a conta dividida entre as unidades. */
export function SplitDemo() {
  const [clinic, setClinic] = useState(25);
  const sliderId = useId();
  const clinicCents = Math.round((BILL_CENTS * clinic) / 100);
  const shopCents = BILL_CENTS - clinicCents;

  return (
    <div className="rounded-2xl bg-card p-5 text-foreground shadow-[0_24px_48px_-24px_rgba(0,0,0,0.5)] sm:p-7">
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-semibold">Energia elétrica</p>
        <p className="text-xl font-semibold tabular-nums">{brl(BILL_CENTS / 100)}</p>
      </div>

      <label htmlFor={sliderId} className="mt-6 block text-sm text-muted-foreground">
        Regra de divisão: clínica <span className="font-medium tabular-nums text-foreground">{clinic}%</span>, pet shop{' '}
        <span className="font-medium tabular-nums text-foreground">{100 - clinic}%</span>
      </label>
      <input
        id={sliderId}
        type="range"
        min={0}
        max={100}
        step={5}
        value={clinic}
        onChange={(event) => setClinic(Number(event.target.value))}
        className="lp-range mt-3 w-full"
        aria-label="Parte da clínica na conta, em porcentagem"
        aria-valuetext={`Clínica ${clinic} por cento, pet shop ${100 - clinic} por cento`}
      />

      <dl className="mt-6 space-y-4" aria-live="polite">
        {[
          { unit: 'Clínica', cents: clinicCents, share: clinic, tone: 'bg-primary' },
          { unit: 'Pet Shop', cents: shopCents, share: 100 - clinic, tone: 'bg-secondary' },
        ].map((row) => (
          <div key={row.unit}>
            <div className="flex items-baseline justify-between text-sm">
              <dt>{row.unit}</dt>
              <dd className="font-semibold tabular-nums">{brl(row.cents / 100)}</dd>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
              <div className={`lp-bar h-full rounded-full ${row.tone}`} style={{ transform: `scaleX(${row.share / 100})` }} />
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}
