import { io, Socket } from 'socket.io-client';
import { API_ORIGIN, getAccessToken } from './http-client';
import { session } from './session';

/** Events the API emits (design §10.1). Payload: { entity, id, action, version?, data? }. */
export const RealtimeEvent = {
  CHAT_CREATED: 'chat.created',
  CHAT_UPDATED: 'chat.updated',
  MESSAGE_CREATED: 'chat.message.created',
  TAG_CHANGED: 'tag.changed',
  DEPARTMENT_CHANGED: 'department.changed',
  ROLE_CHANGED: 'role.changed',
  STAFF_CHANGED: 'staff.changed',
  CUSTOMER_UPDATED: 'customer.updated',
} as const;

export interface RealtimePayload<T = unknown> {
  entity: string;
  id: string;
  action: 'created' | 'updated' | 'deleted';
  version?: number;
  data?: T;
}

let socket: Socket | null = null;

/**
 * One socket per signed-in session. The server picks the rooms from the token (own chats, department,
 * all) — the client never asks to join rooms. `auth` is a function so every reconnect sends the
 * current access token; an expired one triggers a refresh and a new attempt.
 */
export function connectRealtime(): Socket {
  if (socket) return socket;
  socket = io(API_ORIGIN, {
    transports: ['websocket'],
    auth: (cb) => cb({ token: getAccessToken() }),
    reconnectionDelayMax: 10_000,
  });
  socket.on('auth.error', async () => {
    if (await session.restore()) socket?.connect();
  });
  return socket;
}

export function disconnectRealtime(): void {
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
}
