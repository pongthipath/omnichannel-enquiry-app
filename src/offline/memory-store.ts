import { LocalStore, OutboxItem } from './local-store.interface';

/**
 * Outbox kept in memory. Used on web (where the console is online anyway) and in tests, so the sync
 * engine can be exercised without a database.
 */
export class MemoryStore implements LocalStore {
  private items = new Map<string, OutboxItem>();

  async enqueue(item: Omit<OutboxItem, 'status' | 'attempts' | 'nextRetryAt' | 'lastError'>): Promise<void> {
    if (this.items.has(item.clientId)) return; // same idempotency key = same request
    this.items.set(item.clientId, {
      ...item,
      status: 'PENDING_SYNC',
      attempts: 0,
      nextRetryAt: null,
      lastError: null,
    });
  }

  async due(now: number, limit: number): Promise<OutboxItem[]> {
    return [...this.items.values()]
      .filter(
        (i) =>
          i.status === 'PENDING_SYNC' ||
          (i.status === 'FAILED_RETRYABLE' && (i.nextRetryAt ?? 0) <= now),
      )
      .sort((a, b) => a.createdAt - b.createdAt)
      .slice(0, limit);
  }

  async markSyncing(clientIds: string[]): Promise<void> {
    for (const id of clientIds) {
      const item = this.items.get(id);
      if (item) item.status = 'SYNCING';
    }
  }

  async markSynced(clientId: string): Promise<void> {
    this.items.delete(clientId); // nothing left to send — the server copy is the truth now
  }

  async markFailed(clientId: string, error: string, retryAt: number | null): Promise<void> {
    const item = this.items.get(clientId);
    if (!item) return;
    item.attempts += 1;
    item.lastError = error;
    item.status = retryAt === null ? 'FAILED_PERMANENT' : 'FAILED_RETRYABLE';
    item.nextRetryAt = retryAt;
  }

  async resetInterrupted(): Promise<void> {
    for (const item of this.items.values()) {
      if (item.status === 'SYNCING') item.status = 'PENDING_SYNC';
    }
  }

  async countPending(): Promise<number> {
    return [...this.items.values()].filter((i) => i.status !== 'FAILED_PERMANENT').length;
  }

  /** Tests and the "what failed?" screen read these directly. */
  async all(): Promise<OutboxItem[]> {
    return [...this.items.values()];
  }
}
