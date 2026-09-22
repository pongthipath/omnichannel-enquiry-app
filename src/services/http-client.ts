/**
 * The only place that talks HTTP. Services (one file per API module) call these helpers;
 * components never call fetch directly: component → hook → service → http-client.
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
/** Socket.IO lives at the API origin, not under /api/v1. */
export const API_ORIGIN = new URL(BASE_URL).origin;

/** Mirrors the API's ApiErrorDto. `code` is used as the i18n key (e.g. errors.chat.notAssigned). */
export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code: string,
    message: string,
    readonly errors?: { field: string; message: string }[],
  ) {
    super(message);
  }
}

let accessToken: string | null = null; // kept in memory only (design §16.12)
export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};
export const getAccessToken = (): string | null => accessToken;

/** Set by the session: gets a new access token after a 401. Returns false when the user must sign in again. */
let onUnauthorized: (() => Promise<boolean>) | null = null;
export const setUnauthorizedHandler = (handler: () => Promise<boolean>): void => {
  onUnauthorized = handler;
};

const TOKEN_PATHS = /^\/auth\/(login|refresh|logout)\b/;

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
  headers: Record<string, string> = {},
  isRetry = false,
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    credentials: 'include', // web: httpOnly refresh cookie
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'omni-app',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  // access token expired (15 min) → refresh once and repeat; login/refresh/logout report their own 401s
  if (res.status === 401 && !isRetry && !TOKEN_PATHS.test(path) && onUnauthorized && (await onUnauthorized())) {
    return request<T>(method, path, body, headers, true);
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data.code ?? 'common.unknown', data.message ?? res.statusText, data.errors);
  }
  return data as T;
}

export const http = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown, headers?: Record<string, string>) => request<T>('POST', path, body, headers),
  put: <T>(path: string, body?: unknown, headers?: Record<string, string>) => request<T>('PUT', path, body, headers),
  patch: <T>(path: string, body?: unknown, headers?: Record<string, string>) => request<T>('PATCH', path, body, headers),
  delete: <T>(path: string) => request<T>('DELETE', path),
};
