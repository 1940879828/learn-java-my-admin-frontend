import request from './request';
import { API } from '../constants/api';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RefreshRequest,
  Result,
} from '../types/auth';

export const login = (data: LoginRequest) =>
  request.post<Result<LoginResponse>>(API.auth.login, data);

export const register = (data: RegisterRequest) =>
  request.post<Result<void>>(API.auth.register, data);

export const refresh = (data: RefreshRequest) =>
  request.post<Result<LoginResponse>>(API.auth.refresh, data);

export const logout = () => request.post<Result<void>>(API.auth.logout);
