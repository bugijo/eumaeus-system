import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { TOUR_EVENT, tourDoneKey } from './tourEvents';

export interface TourStep { target?: string; title: string; text: string }

/** Passos do tour. Passos cujo alvo não existe na tela (módulo fora do plano ou do acesso) são pulados. */
export const TOUR_STEPS: TourStep[] = [
  { title: 'Bem-vindo ao Eumaeus', text: 'Em menos de um minuto você conhece onde fica cada coisa. Dá para pular agora e rever depois pelo botão de ajuda.' },
  { target: 'nav-/', title: 'Início', text: 'O resumo do dia: próximos agendamentos, vendas e alertas de estoque.' },
  { target: 'nav-/agendamentos', title: 'Agendamentos', text: 'Marque consultas, vacinas, banhos e tosas. Os serviços vêm de Configurações, aba Serviços.' },
  { target: 'nav-/caixa', title: 'Caixa', text: 'Venda bipando o código de barras ou buscando pelo nome. O estoque baixa sozinho.' },
  { target: 'nav-/tutores', title: 'Tutores', text: 'Cadastre os clientes e os pets de cada um.' },
  { target: 'nav-/prontuario', title: 'Prontuários', text: 'Registre atendimentos e os produtos usados. Tudo fica no histórico do pet.' },
  { target: 'nav-/estoque', title: 'Estoque', text: 'Cadastre produtos. Para medicamentos, use a busca no catálogo para preencher mais rápido.' },
  { target: 'nav-/financeiro', title: 'Financeiro', text: 'Vendas, despesas e saldo do mês, com resumo para o contador.' },
  { target: 'nav-/configuracoes', title: 'Configurações', text: 'Dados do estabelecimento, serviços e os acessos de cada funcionário (aba Equipe e acessos).' },
  { target: 'help', title: 'Ajuda sempre à mão', text: 'Aqui ficam o passo a passo de cada tela, a central de ajuda e o assistente para tirar dúvidas.' },
];

type Rect = { top: number; left: number; width: number; height: number };

const findTarget = (target?: string) => (target ? document.querySelector<HTMLElement>(`[data-tour="${CSS.escape(target)}"]`) : null);

function visibleRect(element: HTMLElement | null): Rect | null {
  if (!element) return null;
  const box = element.getBoundingClientRect();
  const onScreen = box.width > 0 && box.height > 0 && box.right > 0 && box.bottom > 0 && box.left < window.innerWidth && box.top < window.innerHeight;
  return onScreen ? { top: box.top, left: box.left, width: box.width, height: box.height } : null;
}

const saveDone = (userId?: number | string) => { try { localStorage.setItem(tourDoneKey(userId), '1'); } catch { /* navegação privada: o tour volta no próximo acesso */ } };
const readDone = (userId?: number | string) => { try { return localStorage.getItem(tourDoneKey(userId)) === '1'; } catch { return false; } };

/** Tour do primeiro acesso. Roda uma vez por usuário neste navegador e volta pelo botão "Rever tutorial". */
export default function OnboardingTour({ userId, autoStart = true }: { userId?: number | string; autoStart?: boolean }) {
  const [steps, setSteps] = useState<TourStep[] | null>(null);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const start = useCallback(() => {
    // Mantém só passos sem alvo ou com alvo presente: o menu já esconde o que o plano não libera.
    setSteps(TOUR_STEPS.filter((step) => !step.target || findTarget(step.target)));
    setIndex(0);
  }, []);

  const finish = useCallback(() => { saveDone(userId); setSteps(null); }, [userId]);

  useEffect(() => {
    window.addEventListener(TOUR_EVENT, start);
    return () => window.removeEventListener(TOUR_EVENT, start);
  }, [start]);

  useEffect(() => {
    if (!autoStart || userId === undefined || readDone(userId)) return;
    const timer = window.setTimeout(start, 700); // espera o menu montar
    return () => window.clearTimeout(timer);
  }, [autoStart, userId, start]);

  const step = steps?.[index];

  useLayoutEffect(() => {
    if (!step) return;
    const update = () => setRect(visibleRect(findTarget(step.target)));
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true); };
  }, [step]);

  useEffect(() => { if (step) cardRef.current?.focus(); }, [step]);

  if (!steps || !step) return null;

  const last = index === steps.length - 1;
  const next = () => (last ? finish() : setIndex(index + 1));
  const back = () => setIndex(Math.max(0, index - 1));

  // Cartão à direita do alvo; se não couber, abaixo; sem alvo visível, no centro.
  const CARD_W = 320;
  const pad = 12;
  let cardStyle: React.CSSProperties = { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
  if (rect) {
    const roomRight = window.innerWidth - (rect.left + rect.width) > CARD_W + pad * 2;
    const left = roomRight ? rect.left + rect.width + pad : Math.min(Math.max(pad, rect.left), window.innerWidth - CARD_W - pad);
    const top = roomRight ? Math.min(Math.max(pad, rect.top - 8), window.innerHeight - 220) : Math.min(rect.top + rect.height + pad, window.innerHeight - 220);
    cardStyle = { left, top };
  }

  return (
    <div className="fixed inset-0 z-[60]" onKeyDown={(event) => {
      if (event.key === 'Escape') finish();
      if (event.key === 'ArrowRight') next();
      if (event.key === 'ArrowLeft') back();
    }}>
      {rect ? (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-xl ring-2 ring-primary transition-all duration-200"
          style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12, boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.55)' }}
        />
      ) : <div aria-hidden className="fixed inset-0 bg-slate-900/55" />}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-text"
        tabIndex={-1}
        className="fixed w-[min(320px,calc(100vw-24px))] rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-2xl focus:outline-none"
        style={cardStyle}
      >
        <p className="text-xs text-muted-foreground">{index + 1} de {steps.length}</p>
        <h2 id="tour-title" className="mt-1 text-base font-semibold">{step.title}</h2>
        <p id="tour-text" className="mt-2 text-sm text-muted-foreground">{step.text}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <button type="button" onClick={finish} className="text-sm text-muted-foreground underline-offset-4 hover:underline">Pular</button>
          <div className="flex gap-2">
            {index > 0 && <Button variant="outline" size="sm" onClick={back}>Voltar</Button>}
            <Button size="sm" onClick={next}>{last ? 'Concluir' : 'Próximo'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
