import { http } from './http-client';

export type UserType = 'customer' | 'staff';

export interface LoginInput {
  email: string;
  password: string;
  userType: UserType;
  remember: boolean;
}

export interface LoginResult {
  accessToken: string;
  /** native only — web receives it as an httpOnly cookie */
  refreshToken?: string;
}

export interface Me {
  id: string;
  userType: UserType;
  name: string;
  /** permission bitmask as a decimal string (design §16.13) — convert with BigInt() */
  permissions: string;
}

/** One function per endpoint of the auth module (design §16.12). */
export const authService = {
  login: (input: LoginInput) => http.post<LoginResult>('/auth/login', input),
  refresh: () => http.post<LoginResult>('/auth/refresh'),
  logout: () => http.post<void>('/auth/logout'),
  me: () => http.get<Me>('/auth/me'),
  forgotPassword: (email: string) => http.post<void>('/auth/password/forgot', { email }),
};
