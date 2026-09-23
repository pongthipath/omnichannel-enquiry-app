import { http } from './http-client';

export type SyncOp = 'conversation.create' | 'message.create';

export interface SyncItem {
  op: SyncOp;
  /** the idempotency key the device created — clientRequestId / clientMessageId */
  clientId: string;
  payload: unknown;
}

export interface SyncResult {
  clientId: string;
  status: 'created' | 'duplicate' | 'failed';
  serverId?: string;
  reference?: string;
  error?: string;
  /** false = do not retry: the item itself is wrong (validation, permission) */
  retryable?: boolean;
}

/** Batch endpoint for the outbox (design §7). Everything in it is idempotent, so re-sending is safe. */
export const syncService = {
  sync: (items: SyncItem[]) =>
    http.post<{ results: SyncResult[] }>('/messages/sync', { items }).then((r) => r.results),
};
