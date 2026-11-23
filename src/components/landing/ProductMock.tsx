/** Recorte do caixa real, em HTML: mostra o produto na primeira dobra da página de venda. */
export function ProductMock() {
  return (
    <figure aria-label="Prévia da tela de caixa do Eumaeus" className="rounded-2xl border border-border bg-card shadow-xl">
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="ml-3 text-xs text-muted-foreground">Caixa · Pet Shop</span>
      </div>
      <div className="grid gap-0 sm:grid-cols-[1.3fr_1fr]">
        <div className="space-y-3 p-5">
          <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-muted-foreground">
            <span aria-hidden>▌▌</span> Bipe o código de barras
          </div>
          <ul className="divide-y divide-border text-sm">
            {[
              ['Ração Premium 1 kg', '1', 'R$ 49,90'],
              ['Petisco Bifinho', '2', 'R$ 19,00'],
              ['Shampoo neutro 500 ml', '1', 'R$ 32,50'],
            ].map(([name, qty, price]) => (
              <li key={name} className="flex items-center justify-between py-3">
                <span>{name}</span>
                <span className="tabular-nums text-muted-foreground">{qty} × {price}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4 border-t border-border bg-muted/40 p-5 sm:border-l sm:border-t-0">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-3xl font-bold tabular-nums">R$ 101,40</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between rounded-md bg-background px-3 py-2"><span>Pix</span><span className="tabular-nums">R$ 101,40</span></div>
            <div className="flex justify-between rounded-md bg-background px-3 py-2 text-muted-foreground"><span>Dinheiro</span><span>—</span></div>
          </div>
          <div className="rounded-md bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground">Finalizar venda</div>
        </div>
      </div>
    </figure>
  );
}
