import { syncService, SyncResult } from '../services/sync.service';
import { nextRetryDelayMs } from './backoff';
import { LocalStore, OutboxItem } from './local-store.interface';

const BATCH = 20;

export interface SyncOutcome {
  sent: number;
  duplicates: number;
  failed: number;
  /** items the server rejected for good (validation, permission) — the user has to be told */
  permanent: OutboxItem[];
}

/**
 * Drains the outbox (design §7, §13–15). Items go up in the order they were written, the API is
 * idempotent, and a 4xx stops the retries for that item only — one bad message never blocks the rest.
 * The engine holds no timers of its own: `useSync` decides when to call `run`.
 */
export class SyncEngine {
  private running = false;

  constructor(
    private readonly store: LocalStore,
    private readonly send = syncService.sync,
    private readonly now = () => Date.now(),
  ) {}

  /** Safe to call at any time: a second call while one is in flight does nothing. */
  async run(): Promise<SyncOutcome | null> {
    if (this.running) return null;
    this.running = true;
    const outcome: SyncOutcome = { sent: 0, duplicates: 0, failed: 0, permanent: [] };
    try {
      let batch = await this.store.due(this.now(), BATCH);
      while (batch.length) {
        await this.processBatch(batch, outcome);
        batch = await this.store.due(this.now(), BATCH);
      }
      return outcome;
    } finally {
      this.running = false;
    }
  }

  private async processBatch(batch: OutboxItem[], outcome: SyncOutcome): Promise<void> {
    await this.store.markSyncing(batch.map((i) => i.clientId));
    let results: SyncResult[];
    try {
      results = await this.send(batch.map((i) => ({ op: i.op, clientId: i.clientId, payload: i.payload })));
    } catch {
      // the whole request failed (offline again, server down) — everything goes back in the queue
      for (const item of batch) {
        outcome.failed += 1;
        await this.store.markFailed(item.clientId, 'network', this.now() + nextRetryDelayMs(item.attempts));
      }
      return;
    }

    const byId = new Map(results.map((r) => [r.clientId, r]));
    for (const item of batch) {
      const result = byId.get(item.clientId);
      if (!result || result.status === 'created' || result.status === 'duplicate') {
        if (result?.status === 'duplicate') outcome.duplicates += 1;
        else outcome.sent += 1;
        await this.store.markSynced(item.clientId, result?.serverId ?? '');
        continue;
      }
      // retryable = the server had a problem; otherwise the item itself is wrong and never will work
      const retryAt = result.retryable ? this.now() + nextRetryDelayMs(item.attempts) : null;
      await this.store.markFailed(item.clientId, result.error ?? 'unknown', retryAt);
      if (retryAt === null) outcome.permanent.push(item);
      else outcome.failed += 1;
    }
  }
}
