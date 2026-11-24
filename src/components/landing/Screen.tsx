/** Captura real de uma tela do sistema, numa moldura de janela. As imagens ficam em public/landing. */
export function Screen({ src, alt, width = 1600, height = 1000, className = '' }: { src: string; alt: string; width?: number; height?: number; className?: string }) {
  return (
    <figure className={`lp-frame overflow-hidden rounded-2xl border border-border bg-card ${className}`}>
      <div aria-hidden className="flex h-8 items-center gap-1.5 border-b border-border bg-muted/60 px-3">
        <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
      </div>
      <img src={`/landing/${src}.webp`} alt={alt} width={width} height={height} loading="lazy" decoding="async" className="block h-auto w-full" />
    </figure>
  );
}
