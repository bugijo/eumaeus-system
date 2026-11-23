import { useEffect, useState } from 'react';
import {
  CalendarDays, FileText, Home, Package, PawPrint, ScanBarcode, ShoppingCart, Users, Wallet,
} from 'lucide-react';
import { brl } from './format';

/** Janela do caixa, em HTML: o produto em tamanho real na primeira tela da página de venda. */
const ITEMS = [
  { name: 'Ração Premium Adulto 1 kg', code: '7891000100103', qty: 1, price: 49.9 },
  { name: 'Petisco Bifinho 65 g', code: '7891000200200', qty: 2, price: 9.5 },
  { name: 'Shampoo Neutro 500 ml', code: '7891000300307', qty: 1, price: 32.5 },
];

const NAV = [
  { group: 'Dia a dia', items: [{ label: 'Início', icon: Home }, { label: 'Agendamentos', icon: CalendarDays }, { label: 'Caixa', icon: ShoppingCart, active: true }] },
  { group: 'Atendimento', items: [{ label: 'Tutores', icon: Users }, { label: 'Pets', icon: PawPrint }, { label: 'Prontuários', icon: FileText }] },
  { group: 'Gestão', items: [{ label: 'Estoque', icon: Package }, { label: 'Financeiro', icon: Wallet }] },
];

const PAYMENTS = ['Dinheiro', 'Pix', 'Débito', 'Crédito'];

function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function AppFrame() {
  // O carrinho se enche uma vez, como se três produtos fossem bipados. Sem movimento: já aparece cheio.
  const [count, setCount] = useState(() => (prefersReducedMotion() ? ITEMS.length : 0));

  useEffect(() => {
    if (count >= ITEMS.length) return;
    const timer = window.setTimeout(() => setCount((value) => value + 1), count === 0 ? 700 : 650);
    return () => window.clearTimeout(timer);
  }, [count]);

  const shown = ITEMS.slice(0, count);
  const total = shown.reduce((sum, item) => sum + item.qty * item.price, 0);
  const units = shown.reduce((sum, item) => sum + item.qty, 0);
  const last = shown[shown.length - 1];

  return (
    <div className="lp-frame overflow-hidden rounded-2xl bg-card text-left text-foreground" aria-hidden="true">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        <span className="mx-auto rounded-md bg-muted px-3 py-0.5 text-[11px] text-muted-foreground">eumaeus.com.br/caixa</span>
      </div>

      <div className="grid md:grid-cols-[1fr_17rem] lg:grid-cols-[12.5rem_1fr_18rem]">
        <nav className="hidden border-r border-border bg-muted/40 px-3 py-4 lg:block">
          <div className="mb-5 flex items-center gap-2 px-2">
            <img src="/logo.png" alt="" className="h-6 w-6 object-contain" />
            <span className="text-sm font-semibold">Eumaeus</span>
          </div>
          {NAV.map((section) => (
            <div key={section.group} className="mb-4">
              <p className="mb-1 px-2 text-[11px] font-medium text-muted-foreground">{section.group}</p>
              {section.items.map(({ label, icon: Icon, active }) => (
                <div key={label} className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13px] ${active ? 'bg-primary text-primary-foreground' : 'text-foreground/75'}`}>
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  {label}
                </div>
              ))}
            </div>
          ))}
        </nav>

        <div className="min-w-0 p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-base font-semibold">Caixa</p>
            <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-medium text-secondary">Pet Shop</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border-2 border-primary/70 bg-background px-3 py-2.5 text-sm">
            <ScanBarcode className="h-[18px] w-[18px] shrink-0 text-primary" strokeWidth={1.75} />
            <span className={`tabular-nums ${last ? 'text-foreground' : 'text-muted-foreground'}`}>
              {last ? last.code : 'Bipe o produto ou digite o nome'}
            </span>
            <span className="lp-caret ml-0.5 h-4 w-px bg-primary" />
          </div>

          <p className="mt-5 mb-1 text-xs text-muted-foreground tabular-nums">Carrinho ({units} {units === 1 ? 'item' : 'itens'})</p>
          <ul className="min-h-[9.75rem] divide-y divide-border">
            {shown.map((item) => (
              <li key={item.code} className="lp-row-in flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="min-w-0 truncate">{item.name}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {item.qty} × {brl(item.price)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-border bg-muted/40 p-4 sm:p-5 md:border-l md:border-t-0">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="mt-0.5 text-[2rem] font-semibold leading-none tracking-tight tabular-nums">{brl(total)}</p>
          <p className="mt-5 mb-2 text-xs text-muted-foreground">Pagamento</p>
          <div className="grid grid-cols-2 gap-1.5">
            {PAYMENTS.map((method) => (
              <span key={method} className={`rounded-lg px-3 py-2 text-center text-[13px] ${method === 'Pix' ? 'bg-primary/10 font-medium text-primary ring-1 ring-primary/40' : 'bg-background text-foreground/75 ring-1 ring-border'}`}>
                {method}
              </span>
            ))}
          </div>
          <span className="mt-5 block rounded-lg bg-secondary px-4 py-2.5 text-center text-sm font-semibold text-secondary-foreground">
            Finalizar venda
          </span>
        </div>
      </div>
    </div>
  );
}
