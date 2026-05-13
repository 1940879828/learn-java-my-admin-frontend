import type { Result } from './common';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  phone?: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export type { Result };
