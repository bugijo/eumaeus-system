/**
 * Processing contract for durable inbound WhatsApp events.
 *
 * The repository is intentionally injected: the Prisma model/migration and
 * bootstrap wiring belong to the coordinator. This service only defines the
 * concurrency and state-machine rules and never sends a real message.
 */
export type InboundEventStatus = 'RECEIVED' | 'QUEUED' | 'RETRY' | 'PROCESSING' | 'PROCESSED' | 'FAILED' | 'CANCELLED';

export type InboundEvent = {
  id: number;
  clinicId: number;
  eventId: string;
  dedupeKey: string;
  eventType: string;
  aggregateKey?: string | null;
  sequence?: number | null;
  occurredAt?: Date | null;
  correlationId?: string | null;
  payload: Record<string, unknown>;
  status: InboundEventStatus;
  attempts: number;
  maxAttempts: number;
  availableAt: Date;
  leaseUntil?: Date | null;
  workerId?: string | null;
};

export type InboundClaim = InboundEvent & { workerId: string };

export type InboundRepository = {
  /** Must atomically claim rows. It may reclaim PROCESSING rows whose lease expired. */
  claimReady(input: { limit: number; now: Date; workerId: string; leaseUntil: Date }): Promise<InboundClaim[]>;
  /** Applies event/history/correlation and marks it processed in one transaction. */
  applyEvent(input: {
    event: InboundClaim;
    workerId: string;
  }): Promise<{ applied: boolean; stale: boolean }>;
  markRetry(input: { id: number; workerId: string; availableAt: Date; error: string }): Promise<void>;
  markFailed(input: { id: number; workerId: string; error: string }): Promise<void>;
};

export type InboundProcessResult = {
  claimed: number;
  processed: number;
  stale: number;
  failed: number;
  retried: number;
};

const backoffMs = (attempt: number): number => Math.min(60_000, 1_000 * (2 ** Math.max(0, attempt - 1)));

export class WhatsAppInboundProcessor {
  constructor(private readonly repository: InboundRepository) {}

  async processBatch(input: { workerId: string; limit?: number; now?: Date; leaseMs?: number }): Promise<InboundProcessResult> {
    const now = input.now ?? new Date();
    const leaseMs = input.leaseMs ?? 30_000;
    const claimed = await this.repository.claimReady({
      limit: input.limit ?? 50,
      now,
      workerId: input.workerId,
      leaseUntil: new Date(now.getTime() + leaseMs),
    });
    const result: InboundProcessResult = { claimed: claimed.length, processed: 0, stale: 0, failed: 0, retried: 0 };

    for (const event of claimed) {
      try {
        const applied = await this.repository.applyEvent({ event, workerId: input.workerId });
        result.processed += 1;
        if (applied.stale) result.stale += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha ao processar evento inbound';
        // claimReady increments attempts as part of the atomic claim. Do not
        // increment again here or the first failure would consume two retries.
        const nextAttempt = event.attempts;
        if (nextAttempt >= event.maxAttempts) {
          await this.repository.markFailed({ id: event.id, workerId: input.workerId, error: message });
          result.failed += 1;
        } else {
          await this.repository.markRetry({
            id: event.id,
            workerId: input.workerId,
            availableAt: new Date(now.getTime() + backoffMs(nextAttempt)),
            error: message,
          });
          result.retried += 1;
        }
      }
    }
    return result;
  }
}
