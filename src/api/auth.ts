import request from './request';
import type { LoginRequest, RegisterRequest, LoginResponse, Result } from '../types/auth';

export const login = (data: LoginRequest) =>
  request.post<Result<LoginResponse>>('/auth/login', data);

export const register = (data: RegisterRequest) =>
  request.post<Result<void>>('/auth/register', data);

export const logout = () =>
  request.post<Result<void>>('/auth/logout');

export const unlockUser = (userId: number) =>
  request.post<Result<void>>(`/auth/unlock/${userId}`);
