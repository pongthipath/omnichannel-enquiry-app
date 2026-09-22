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

/** One refresh at a time — parallel 401s wait for the same call (a second call would trip reuse detection). */
function refresh(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const token = refreshToken ?? (await sessionStore.get());
      if (!token) return false;
      await apply(await authService.refresh(token));
      return true;
    } catch {
      await clear();
      return false;
    } finally {
      refreshing = null;
    }
  })();
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
