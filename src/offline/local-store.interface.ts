/**
 * Outbox storage used by the sync engine (design §7). Implementations: SQLite (native), IndexedDB (web),
 * in-memory (tests). The engine depends on this interface only (Dependency Inversion).
 */
export type SyncStatus = 'PENDING_SYNC' | 'SYNCING' | 'SYNCED' | 'FAILED_RETRYABLE' | 'FAILED_PERMANENT';

export interface OutboxItem {
  /** client-generated UUID — doubles as the idempotency key sent to the API */
  clientId: string;
  op: 'conversation.create' | 'message.create';
  payload: unknown;
  status: SyncStatus;
  attempts: number;
  nextRetryAt: number | null;
  lastError: string | null;
  createdAt: number;
}

export interface LocalStore {
  enqueue(item: Omit<OutboxItem, 'status' | 'attempts' | 'nextRetryAt' | 'lastError'>): Promise<void>;
  /** items ready to send now (PENDING_SYNC, or FAILED_RETRYABLE whose nextRetryAt has passed) */
  due(now: number, limit: number): Promise<OutboxItem[]>;
  markSyncing(clientIds: string[]): Promise<void>;
  markSynced(clientId: string, serverId: string): Promise<void>;
  markFailed(clientId: string, error: string, retryAt: number | null): Promise<void>;
  /** on app start: SYNCING → PENDING_SYNC (safe because the API is idempotent) */
  resetInterrupted(): Promise<void>;
  countPending(): Promise<number>;
}
