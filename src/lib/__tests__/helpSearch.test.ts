import { describe, expect, it } from 'vitest';
import type { HelpArticle } from '@/api/helpApi';
import { articlesForPath, searchHelp } from '../helpSearch';

const a = (id: string, title: string, paths: string[], keywords: string[] = [], body = 'texto'): HelpArticle => ({ id, title, category: 'Dia a dia', paths, keywords, body });
const ARTICLES = [
  a('venda', 'Como fazer uma venda no Caixa', ['/caixa'], ['pdv', 'pix']),
  a('cancelar', 'Cancelar uma venda', ['/caixa'], ['estornar']),
  a('inicio', 'Primeiros passos', ['/'], [], 'cadastre a venda depois'),
  a('acesso', 'Criar acesso para funcionários', ['/configuracoes'], ['senha']),
];

describe('searchHelp', () => {
  it('busca sem acento e põe o título na frente', () => {
    expect(searchHelp(ARTICLES, 'VENDA').map((x) => x.id)).toEqual(['venda', 'cancelar', 'inicio']);
    expect(searchHelp(ARTICLES, 'funcionarios').map((x) => x.id)).toEqual(['acesso']);
  });
  it('exige todos os termos e ignora consulta vazia', () => {
    expect(searchHelp(ARTICLES, 'cancelar pix')).toEqual([]);
    expect(searchHelp(ARTICLES, '  ')).toEqual([]);
  });
});

describe('articlesForPath', () => {
  it('casa a tela e subtelas, e "/" só na inicial', () => {
    expect(articlesForPath(ARTICLES, '/caixa').map((x) => x.id)).toEqual(['venda', 'cancelar']);
    expect(articlesForPath(ARTICLES, '/configuracoes/x').map((x) => x.id)).toEqual(['acesso']);
    expect(articlesForPath(ARTICLES, '/').map((x) => x.id)).toEqual(['inicio']);
    expect(articlesForPath(ARTICLES, '/estoque')).toEqual([]);
  });
});
