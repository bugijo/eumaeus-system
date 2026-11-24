import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowLeft, PlayCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HelpArticle, HelpCategory, useHelpArticles } from '@/api/helpApi';
import { searchHelp } from '@/lib/helpSearch';
import ArticleBody from '@/components/help/ArticleBody';
import AssistantChat from '@/components/help/AssistantChat';
import { startTour } from '@/components/help/tourEvents';

const CATEGORY_ORDER: HelpCategory[] = ['Primeiros passos', 'Dia a dia', 'Atendimento', 'Gestão', 'Conta e acessos'];

/** Central de ajuda: busca, artigos por assunto e assistente. O artigo aberto fica na URL (?artigo=id). */
export default function AjudaPage() {
  const { data: articles = [], isLoading, isError } = useHelpArticles();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const current = articles.find((article) => article.id === params.get('artigo')) || null;

  const grouped = useMemo(() => CATEGORY_ORDER
    .map((category) => ({ category, items: articles.filter((article) => article.category === category) }))
    .filter((group) => group.items.length), [articles]);
  const found = searchHelp(articles, query, 12);

  const open = (article: HelpArticle | null) => setParams(article ? { artigo: article.id } : {});

  const linkList = (items: HelpArticle[]) => (
    <ul className="space-y-1">
      {items.map((article) => (
        <li key={article.id}>
          <button type="button" onClick={() => open(article)} className="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            {article.title}
          </button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-2 md:p-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Central de ajuda</h1>
          <p className="text-sm text-muted-foreground">Passo a passo das tarefas do dia a dia. Não achou? Pergunte ao assistente.</p>
        </div>
        <Button variant="outline" onClick={startTour}><PlayCircle className="mr-2 h-4 w-4" aria-hidden />Rever tutorial</Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="min-w-0 rounded-2xl border border-border bg-card p-4 md:p-6">
          {current ? (
            <article>
              <button type="button" onClick={() => open(null)} className="mb-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                <ArrowLeft className="h-4 w-4" aria-hidden /> Todos os artigos
              </button>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{current.category}</p>
              <h2 className="mb-4 mt-1 text-xl font-semibold">{current.title}</h2>
              <ArticleBody body={current.body} />
            </article>
          ) : (
            <div className="space-y-6">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input aria-label="Buscar artigos" placeholder="O que você quer fazer? Ex.: cancelar venda, criar acesso" className="h-11 pl-9" value={query} onChange={(event) => setQuery(event.target.value)} />
              </div>
              {isLoading && <p className="text-sm text-muted-foreground">Carregando artigos…</p>}
              {isError && <p role="alert" className="text-sm text-destructive">Não foi possível carregar os artigos. Tente recarregar a página.</p>}
              {query.trim() ? (
                found.length ? linkList(found) : <p className="text-sm text-muted-foreground">Nada encontrado. Tente outra palavra ou pergunte ao assistente.</p>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                  {grouped.map((group) => (
                    <div key={group.category}>
                      <h2 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.category}</h2>
                      {linkList(group.items)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <aside className="flex h-[32rem] min-w-0 flex-col rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-4">
          <h2 className="mb-3 text-base font-semibold">Assistente</h2>
          <div className="min-h-0 flex-1"><AssistantChat /></div>
        </aside>
      </div>
    </div>
  );
}
