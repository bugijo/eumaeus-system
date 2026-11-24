import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, BookOpen, CircleHelp, PlayCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpArticle, useHelpArticles } from '@/api/helpApi';
import { articlesForPath, searchHelp } from '@/lib/helpSearch';
import ArticleBody from './ArticleBody';
import AssistantChat from './AssistantChat';
import { startTour } from './tourEvents';

function ArticleList({ articles, onOpen, empty }: { articles: HelpArticle[]; onOpen: (a: HelpArticle) => void; empty: string }) {
  if (!articles.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="space-y-1">
      {articles.map((article) => (
        <li key={article.id}>
          <button type="button" onClick={() => onOpen(article)} className="w-full rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <span className="block font-medium">{article.title}</span>
            <span className="block text-xs text-muted-foreground">{article.category}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Botão "?" do topo: ajuda da tela aberta, busca nos artigos e assistente. */
export default function HelpPanel() {
  const location = useLocation();
  const { data: articles = [], isLoading } = useHelpArticles();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [article, setArticle] = useState<HelpArticle | null>(null);

  const here = articlesForPath(articles, location.pathname);
  const found = searchHelp(articles, query);

  return (
    <Sheet open={open} onOpenChange={(value) => { setOpen(value); if (!value) setArticle(null); }}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" aria-label="Abrir ajuda" data-tour="help">
          <CircleHelp className="h-5 w-5" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col gap-4 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Ajuda</SheetTitle>
          <SheetDescription>Encontre o passo a passo ou pergunte ao assistente.</SheetDescription>
        </SheetHeader>
        <Tabs defaultValue="artigos" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="artigos">Artigos</TabsTrigger>
            <TabsTrigger value="assistente">Assistente</TabsTrigger>
          </TabsList>
          <TabsContent value="artigos" className="min-h-0 flex-1 overflow-y-auto">
            {article ? (
              <div>
                <button type="button" onClick={() => setArticle(null)} className="mb-3 inline-flex items-center gap-1 text-sm text-primary hover:underline">
                  <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar
                </button>
                <h3 className="mb-3 text-base font-semibold">{article.title}</h3>
                <ArticleBody body={article.body} />
              </div>
            ) : (
              <div className="space-y-5">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input aria-label="Buscar na ajuda" placeholder="Ex.: cancelar venda, senha, estoque" className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} />
                </div>
                {query.trim() ? (
                  <ArticleList articles={found} onOpen={setArticle} empty="Nada encontrado. Tente outra palavra ou pergunte ao assistente." />
                ) : (
                  <section>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nesta tela</h3>
                    {isLoading ? <p className="text-sm text-muted-foreground">Carregando…</p> : (
                      <ArticleList articles={here} onOpen={setArticle} empty="Sem artigo específico para esta tela. Use a busca acima." />
                    )}
                  </section>
                )}
                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  <Button asChild variant="outline" size="sm" onClick={() => setOpen(false)}>
                    <Link to="/ajuda"><BookOpen className="mr-2 h-4 w-4" aria-hidden />Central de ajuda</Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => { setOpen(false); startTour(); }}>
                    <PlayCircle className="mr-2 h-4 w-4" aria-hidden />Rever tutorial
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          <TabsContent value="assistente" className="min-h-0 flex-1">
            <AssistantChat />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
