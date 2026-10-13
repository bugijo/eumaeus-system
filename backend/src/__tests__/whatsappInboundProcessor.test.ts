import { InboundClaim, InboundEvent, InboundRepository, WhatsAppInboundProcessor } from '../services/whatsappInboundProcessor';

class ConcurrentMemoryRepository implements InboundRepository {
  readonly events: InboundEvent[];
  readonly linked: number[] = [];
  readonly aggregates = new Map<string, number>();
  failApply = false;

  constructor(events: InboundEvent[]) { this.events = events; }

  async claimReady({ limit, now, workerId, leaseUntil }: { limit: number; now: Date; workerId: string; leaseUntil: Date }): Promise<InboundClaim[]> {
    const result: InboundClaim[] = [];
    for (const event of this.events) {
      const available = event.availableAt <= now;
      const expired = event.status === 'PROCESSING' && !!event.leaseUntil && event.leaseUntil <= now;
      if (result.length >= limit || (!((event.status === 'QUEUED' && available) || expired))) continue;
      event.status = 'PROCESSING'; event.workerId = workerId; event.leaseUntil = leaseUntil; event.attempts += 1;
      result.push({ ...event, workerId });
    }
    return result;
  }

  async applyEvent({ event, workerId }: { event: InboundClaim; workerId: string }): Promise<{ applied: boolean; stale: boolean }> {
    const current = this.events.find((item) => item.id === event.id);
    if (!current || current.workerId !== workerId || current.status !== 'PROCESSING') throw new Error('claim perdido');
    if (this.failApply) throw new Error('falha transacional simulada');
    const key = event.aggregateKey ?? `event:${event.id}`;
    const previous = this.aggregates.get(key) ?? -1;
    const sequence = event.sequence ?? 0;
    const stale = sequence <= previous;
    if (!stale) this.aggregates.set(key, sequence);
    current.status = 'PROCESSED'; current.leaseUntil = null;
    if (event.correlationId) this.linked.push(event.id);
    return { applied: !stale, stale };
  }

  async markRetry({ id, workerId, availableAt, error }: { id: number; workerId: string; availableAt: Date; error: string }): Promise<void> {
    const event = this.events.find((item) => item.id === id);
    if (!event || event.workerId !== workerId) throw new Error('claim perdido');
    event.status = 'QUEUED'; event.availableAt = availableAt; event.leaseUntil = null; event.workerId = null; event.payload.lastError = error;
  }

  async markFailed({ id, workerId, error }: { id: number; workerId: string; error: string }): Promise<void> {
    const event = this.events.find((item) => item.id === id);
    if (!event || event.workerId !== workerId) throw new Error('claim perdido');
    event.status = 'FAILED'; event.leaseUntil = null; event.payload.lastError = error;
  }
}

const event = (id: number, overrides: Partial<InboundEvent> = {}): InboundEvent => ({
  id, clinicId: 1, eventId: `wamid-${id}`, dedupeKey: `wa:${id}`, eventType: 'message.text', aggregateKey: 'tutor:7',
  sequence: id, correlationId: id === 1 ? 'outbound-7' : null, payload: {}, status: 'QUEUED', attempts: 0,
  maxAttempts: 3, availableAt: new Date('2026-01-01T00:00:00Z'), leaseUntil: null, workerId: null, ...overrides,
});

describe('WhatsAppInboundProcessor', () => {
  const now = new Date('2026-01-01T00:00:10Z');

  it('permite apenas um claim quando dois workers disputam o mesmo evento', async () => {
    const repo = new ConcurrentMemoryRepository([event(1)]);
    const [a, b] = await Promise.all([
      new WhatsAppInboundProcessor(repo).processBatch({ workerId: 'a', now }),
      new WhatsAppInboundProcessor(repo).processBatch({ workerId: 'b', now }),
    ]);
    expect(a.claimed + b.claimed).toBe(1);
    expect(repo.events[0].status).toBe('PROCESSED');
  });

  it('reprocessa após falha com backoff e recupera após nova tentativa', async () => {
    const repo = new ConcurrentMemoryRepository([event(1)]); repo.failApply = true;
    const first = await new WhatsAppInboundProcessor(repo).processBatch({ workerId: 'a', now });
    expect(first.retried).toBe(1); expect(repo.events[0].status).toBe('QUEUED');
    expect(repo.events[0].availableAt.getTime()).toBe(now.getTime() + 1_000);
    repo.failApply = false;
    const second = await new WhatsAppInboundProcessor(repo).processBatch({ workerId: 'b', now: new Date(now.getTime() + 1_000) });
    expect(second.processed).toBe(1); expect(repo.events[0].status).toBe('PROCESSED');
  });

  it('recupera claim interrompido quando o lease expira', async () => {
    const repo = new ConcurrentMemoryRepository([event(1, { status: 'PROCESSING', workerId: 'dead', leaseUntil: new Date('2026-01-01T00:00:01Z') })]);
    const result = await new WhatsAppInboundProcessor(repo).processBatch({ workerId: 'recovery', now });
    expect(result.processed).toBe(1); expect(repo.events[0].status).toBe('PROCESSED');
  });

  it('não regride estado agregado quando eventos chegam fora de ordem e correlaciona outbound na mesma aplicação', async () => {
    const repo = new ConcurrentMemoryRepository([event(2), event(1)]);
    const result = await new WhatsAppInboundProcessor(repo).processBatch({ workerId: 'a', now });
    expect(result.processed).toBe(2); expect(result.stale).toBe(1);
    expect(repo.aggregates.get('tutor:7')).toBe(2); expect(repo.linked).toEqual([1]);
  });
});
