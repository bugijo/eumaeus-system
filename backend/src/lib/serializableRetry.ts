/**
 * Transações Serializable podem ser abortadas pelo Postgres quando duas operações concorrem
 * (ex.: dois caixas vendendo ao mesmo tempo). Isso é esperado nesse nível de isolamento:
 * a transação abortada deve ser repetida, não devolvida como erro ao usuário.
 */
export const BUSY_MESSAGE = 'Muitas operações ao mesmo tempo. Tente de novo em instantes.';

export function isSerializationFailure(error: unknown, retryOnUnique = false): boolean {
  const code = (error as { code?: string } | null)?.code;
  if (code === 'P2034') return true;
  if (retryOnUnique && code === 'P2002') return true;
  const text = error instanceof Error ? error.message : '';
  return /write conflict or a deadlock|could not serialize access|deadlock detected/i.test(text);
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withSerializableRetry<T>(run: () => Promise<T>, options: { attempts?: number; retryOnUnique?: boolean } = {}): Promise<T> {
  const attempts = options.attempts ?? 6;
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      if (!isSerializationFailure(error, options.retryOnUnique)) throw error;
      if (attempt >= attempts) throw new Error(BUSY_MESSAGE);
      await wait(attempt * 15 + Math.floor(Math.random() * 25));
    }
  }
}
