import Anthropic from '@anthropic-ai/sdk';
import { HELP_ARTICLES } from './articles';

/**
 * Assistente de suporte: responde dúvidas de uso com base só nos artigos da central de ajuda.
 * Não recebe dados de clientes nem age no sistema. Desligado enquanto ANTHROPIC_API_KEY não estiver definida.
 */
export const ASSISTANT_MODEL = process.env.HELP_ASSISTANT_MODEL || 'claude-haiku-5-5';
const DAILY_LIMIT = Number(process.env.HELP_ASSISTANT_DAILY_LIMIT || 80);
const MAX_TURNS = 10;
const MAX_CHARS = 2000;

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

export class AssistantUnavailableError extends Error {}
export class AssistantQuotaError extends Error {}

const knowledge = HELP_ARTICLES
  .map((article) => `## ${article.title}\nCategoria: ${article.category}\n\n${article.body}`)
  .join('\n\n---\n\n');

// Texto fixo (instruções + artigos) fica em cache: só a pergunta muda de uma chamada para outra.
const SYSTEM_PROMPT = `Você é o assistente de suporte do Eumaeus, sistema de gestão para clínica veterinária e pet shop.
Responda em português do Brasil, em poucas frases e com passos numerados quando for um procedimento.

Regras:
- Use só as informações dos artigos abaixo. Se a resposta não estiver neles, diga que não sabe e sugira falar com o suporte, sem inventar telas, botões ou funções.
- Se perguntarem por algo que os artigos dizem estar em desenvolvimento, diga isso com clareza.
- Você não vê os dados do estabelecimento e não executa ações no sistema. Não peça nem repita dados pessoais de clientes, senhas ou documentos.
- Não dê orientação clínica, dose de medicamento nem conselho jurídico ou fiscal; diga que isso cabe ao veterinário ou ao contador.

# Artigos da central de ajuda

${knowledge}`;

const usage = new Map<string, number>();

/** Cota por estabelecimento e por dia, em memória (zera ao reiniciar a API). */
export function consumeQuota(clinicId: number, now = new Date()): number {
  const key = `${clinicId}:${now.toISOString().slice(0, 10)}`;
  const used = usage.get(key) || 0;
  if (used >= DAILY_LIMIT) throw new AssistantQuotaError('Limite diário de perguntas ao assistente atingido. Use a central de ajuda ou fale com o suporte.');
  usage.set(key, used + 1);
  if (usage.size > 5000) usage.clear();
  return DAILY_LIMIT - used - 1;
}

export function sanitizeHistory(raw: unknown): ChatTurn[] {
  if (!Array.isArray(raw)) return [];
  const turns = raw
    .filter((turn): turn is ChatTurn => Boolean(turn) && (turn.role === 'user' || turn.role === 'assistant') && typeof turn.content === 'string')
    .map((turn) => ({ role: turn.role, content: turn.content.trim().slice(0, MAX_CHARS) }))
    .filter((turn) => turn.content.length > 0)
    .slice(-MAX_TURNS);
  // A API exige começar pelo usuário e terminar com uma pergunta.
  while (turns.length && turns[0].role !== 'user') turns.shift();
  if (!turns.length || turns[turns.length - 1].role !== 'user') return [];
  return turns;
}

let client: Anthropic | null = null;
const getClient = () => {
  if (!process.env.ANTHROPIC_API_KEY) throw new AssistantUnavailableError('O assistente ainda não foi ativado neste servidor.');
  client ??= new Anthropic();
  return client;
};

export async function askAssistant(history: ChatTurn[], currentPath?: string): Promise<string> {
  const anthropic = getClient();
  const messages: Anthropic.MessageParam[] = history.map((turn, index) => {
    const isLast = index === history.length - 1;
    const screen = isLast && currentPath ? `[Tela aberta: ${currentPath.slice(0, 80)}]\n` : '';
    return { role: turn.role, content: screen + turn.content };
  });

  const response = await anthropic.messages.create({
    model: ASSISTANT_MODEL,
    max_tokens: 4000,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    output_config: { effort: 'low' },
    messages,
  });

  if (response.stop_reason === 'refusal') return 'Não consigo ajudar com isso. Procure a central de ajuda ou fale com o suporte.';
  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();
  return text || 'Não encontrei uma resposta. Procure a central de ajuda ou fale com o suporte.';
}
