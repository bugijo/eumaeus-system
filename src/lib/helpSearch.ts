import type { HelpArticle } from '@/api/helpApi';

const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Busca sem acento; pontua título acima de palavra-chave e palavra-chave acima do texto. */
export function searchHelp(articles: HelpArticle[], query: string, limit = 8): HelpArticle[] {
  const terms = normalize(query).split(/\s+/).filter((term) => term.length > 1);
  if (!terms.length) return [];
  return articles
    .map((article) => {
      const title = normalize(article.title);
      const keywords = normalize(article.keywords.join(' '));
      const body = normalize(article.body);
      let score = 0;
      for (const term of terms) {
        if (title.includes(term)) score += 5;
        else if (keywords.includes(term)) score += 3;
        else if (body.includes(term)) score += 1;
        else return { article, score: 0 };
      }
      return { article, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.article);
}

/** Artigos ligados à tela aberta. "/" só casa com a tela inicial. */
export function articlesForPath(articles: HelpArticle[], path: string): HelpArticle[] {
  return articles.filter((article) => article.paths.some((p) => (p === '/' ? path === '/' : path === p || path.startsWith(`${p}/`))));
}
