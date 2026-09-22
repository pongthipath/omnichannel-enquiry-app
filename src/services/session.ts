import { authService, LoginInput, LoginResult } from './auth.service';
import { setAccessToken, setUnauthorizedHandler } from './http-client';
import { sessionStore } from './session-store';

/**
 * Owns the token pair. Access token: memory only. Refresh token: memory + sessionStore when "remember me".
 * The API rotates the refresh token on every refresh, so the new one always replaces the old one.
 */
let refreshToken: string | null = null;
let persist = true;
let refreshing: Promise<boolean> | null = null;

async function apply(tokens: LoginResult): Promise<void> {
  setAccessToken(tokens.accessToken);
  refreshToken = tokens.refreshToken;
  if (persist) await sessionStore.set(tokens.refreshToken);
}

async function clear(): Promise<void> {
  setAccessToken(null);
  refreshToken = null;
  await sessionStore.clear();
}

type LockManager = { request: <T>(name: string, cb: () => Promise<T>) => Promise<T> };
const locks = (globalThis.navigator as { locks?: LockManager } | undefined)?.locks;

/**
 * One refresh at a time. In this tab, parallel 401s share one call. Across browser tabs (they share the
 * stored token) a Web Lock serialises refreshes, and each reads the token *inside* the lock — so a tab
 * never sends a token another tab already rotated (that would trip reuse detection and sign everyone out).
 */
function refresh(): Promise<boolean> {
  const run = async () => {
    try {
      const token = (persist ? await sessionStore.get() : null) ?? refreshToken;
      if (!token) return false;
      await apply(await authService.refresh(token));
      return true;
    } catch {
      await clear();
      return false;
    }
  };
  refreshing ??= (locks ? locks.request('omni.refresh', run) : run()).finally(() => {
    refreshing = null;
  });
  return refreshing;
}

setUnauthorizedHandler(refresh);

export const session = {
  async login(input: LoginInput): Promise<void> {
    persist = input.remember;
    await apply(await authService.login(input));
  },
  /** App start: silently sign in again with the stored refresh token. */
  restore: refresh,
  async logout(): Promise<void> {
    const token = refreshToken;
    await clear();
    if (token) await authService.logout(token).catch(() => undefined); // already signed out locally
  },
};
