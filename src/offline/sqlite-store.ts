import * as SQLite from 'expo-sqlite';
import { LocalStore, OutboxItem, SyncStatus } from './local-store.interface';

interface Row {
  client_id: string;
  op: string;
  payload: string;
  status: string;
  attempts: number;
  next_retry_at: number | null;
  last_error: string | null;
  created_at: number;
  server_id: string | null;
}

const toItem = (r: Row): OutboxItem => ({
  clientId: r.client_id,
  op: r.op as OutboxItem['op'],
  payload: JSON.parse(r.payload),
  status: r.status as SyncStatus,
  attempts: r.attempts,
  nextRetryAt: r.next_retry_at,
  lastError: r.last_error,
  createdAt: r.created_at,
});

/**
 * The outbox on the phone (design §13–15): what the user wrote while offline survives a force-quit
 * and is sent in order once the connection is back. clientId is the primary key, so enqueuing the
 * same thing twice is impossible.
 */
export class SqliteStore implements LocalStore {
  private constructor(private readonly db: SQLite.SQLiteDatabase) {}

  static async open(name = 'omni-outbox.db'): Promise<SqliteStore> {
    const db = await SQLite.openDatabaseAsync(name);
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS outbox (
        client_id TEXT PRIMARY KEY NOT NULL,
        op TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        next_retry_at INTEGER,
        last_error TEXT,
        created_at INTEGER NOT NULL,
        server_id TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_outbox__status_created ON outbox (status, created_at);
    `);
    return new SqliteStore(db);
  }

  async enqueue(item: Omit<OutboxItem, 'status' | 'attempts' | 'nextRetryAt' | 'lastError'>): Promise<void> {
    await this.db.runAsync(
      `INSERT OR IGNORE INTO outbox (client_id, op, payload, status, created_at)
       VALUES (?, ?, ?, 'PENDING_SYNC', ?)`,
      item.clientId,
      item.op,
      JSON.stringify(item.payload),
      item.createdAt,
    );
  }

  async due(now: number, limit: number): Promise<OutboxItem[]> {
    const rows = await this.db.getAllAsync<Row>(
      `SELECT * FROM outbox
       WHERE status = 'PENDING_SYNC' OR (status = 'FAILED_RETRYABLE' AND next_retry_at <= ?)
       ORDER BY created_at ASC
       LIMIT ?`,
      now,
      limit,
    );
    return rows.map(toItem);
  }

  async markSyncing(clientIds: string[]): Promise<void> {
    if (!clientIds.length) return;
    const holes = clientIds.map(() => '?').join(',');
    await this.db.runAsync(`UPDATE outbox SET status = 'SYNCING' WHERE client_id IN (${holes})`, ...clientIds);
  }

  async markSynced(clientId: string): Promise<void> {
    await this.db.runAsync('DELETE FROM outbox WHERE client_id = ?', clientId);
  }

  async markFailed(clientId: string, error: string, retryAt: number | null): Promise<void> {
    await this.db.runAsync(
      `UPDATE outbox
       SET status = ?, attempts = attempts + 1, next_retry_at = ?, last_error = ?
       WHERE client_id = ?`,
      retryAt === null ? 'FAILED_PERMANENT' : 'FAILED_RETRYABLE',
      retryAt,
      error,
      clientId,
    );
  }

  /** After a crash or a force-quit, anything left mid-flight is safe to send again. */
  async resetInterrupted(): Promise<void> {
    await this.db.runAsync("UPDATE outbox SET status = 'PENDING_SYNC' WHERE status = 'SYNCING'");
  }

  async countPending(): Promise<number> {
    const row = await this.db.getFirstAsync<{ n: number }>(
      "SELECT COUNT(*) AS n FROM outbox WHERE status <> 'FAILED_PERMANENT'",
    );
    return row?.n ?? 0;
  }

  async all(): Promise<OutboxItem[]> {
    const rows = await this.db.getAllAsync<Row>('SELECT * FROM outbox ORDER BY created_at ASC');
    return rows.map(toItem);
  }
}
