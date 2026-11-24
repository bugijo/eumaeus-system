import { FormEvent, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bot, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatTurn, useAskAssistant, useAssistantStatus } from '@/api/helpApi';

const errorText = (error: unknown) =>
  (error as { response?: { data?: { error?: string } } })?.response?.data?.error || 'O assistente não respondeu agora. Tente de novo.';

/** Chat de dúvidas de uso. Responde só com base na central de ajuda; não vê dados do estabelecimento. */
export default function AssistantChat() {
  const location = useLocation();
  const status = useAssistantStatus();
  const ask = useAskAssistant();
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView?.({ block: 'end' }); }, [turns, ask.isPending]);

  const send = (event?: FormEvent) => {
    event?.preventDefault();
    const question = draft.trim();
    if (!question || ask.isPending) return;
    const next: ChatTurn[] = [...turns, { role: 'user', content: question }];
    setTurns(next);
    setDraft('');
    setError('');
    ask.mutate(
      { messages: next, path: location.pathname },
      {
        onSuccess: (data) => setTurns((current) => [...current, { role: 'assistant', content: data.answer }]),
        onError: (failure) => { setError(errorText(failure)); setTurns((current) => current.slice(0, -1)); setDraft(question); },
      },
    );
  };

  if (status.data && !status.data.enabled) {
    return (
      <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        O assistente ainda não foi ativado. Use a busca da central de ajuda para encontrar a resposta.
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1" aria-live="polite">
        {!turns.length && (
          <div className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
            <p className="flex items-center gap-2 font-medium text-foreground"><Bot className="h-4 w-4" aria-hidden /> Pergunte como fazer algo no sistema</p>
            <p className="mt-1">Ex.: “como cancelo uma venda?”, “como dou acesso para a recepção?”. Não escreva dados de clientes nem senhas.</p>
          </div>
        )}
        {turns.map((turn, index) => (
          <div key={index} className={turn.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
            <p className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${turn.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              {turn.content}
            </p>
          </div>
        ))}
        {ask.isPending && <p className="text-sm text-muted-foreground">Procurando a resposta…</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="mt-3 flex items-end gap-2">
        <label htmlFor="assistant-question" className="sr-only">Sua pergunta</label>
        <Textarea
          id="assistant-question"
          rows={2}
          maxLength={2000}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) send(event); }}
          placeholder="Digite sua dúvida"
          className="min-h-0 resize-none"
        />
        <Button type="submit" size="icon" disabled={!draft.trim() || ask.isPending} aria-label="Enviar pergunta">
          <Send className="h-4 w-4" aria-hidden />
        </Button>
      </form>
      <p className="mt-2 text-[11px] text-muted-foreground">Respostas automáticas podem errar. Na dúvida, confira na central de ajuda.</p>
    </div>
  );
}
