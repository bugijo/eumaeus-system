import { useMutation, useQuery } from '@tanstack/react-query';
import apiClient from './apiClient';

export type HelpCategory = 'Primeiros passos' | 'Dia a dia' | 'Atendimento' | 'Gestão' | 'Conta e acessos';
export interface HelpArticle { id: string; title: string; category: HelpCategory; paths: string[]; keywords: string[]; body: string }
export type ChatTurn = { role: 'user' | 'assistant'; content: string };

export const helpApi = {
  articles: async (): Promise<HelpArticle[]> => (await apiClient.get<HelpArticle[]>('/help/articles')).data,
  assistantStatus: async (): Promise<{ enabled: boolean }> => (await apiClient.get<{ enabled: boolean }>('/help/assistant/status')).data,
  ask: async (input: { messages: ChatTurn[]; path?: string }): Promise<{ answer: string; remaining: number }> =>
    (await apiClient.post<{ answer: string; remaining: number }>('/help/assistant', input)).data,
};

// Os artigos mudam só com nova versão do sistema: não precisa buscar de novo a cada abertura.
export const useHelpArticles = () => useQuery({ queryKey: ['help-articles'], queryFn: helpApi.articles, staleTime: 60 * 60 * 1000 });
export const useAssistantStatus = () => useQuery({ queryKey: ['help-assistant-status'], queryFn: helpApi.assistantStatus, staleTime: 5 * 60 * 1000 });
export const useAskAssistant = () => useMutation({ mutationFn: helpApi.ask });
