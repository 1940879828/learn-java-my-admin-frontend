import request from './request';
import { API } from '../constants/api';
import type { Result, PageResponse } from '../types/common';
import type {
  UserResponse,
  UserDetailResponse,
  UserCreateRequest,
  UserUpdateRequest,
  UserQueryFilter,
  ChangePasswordRequest,
  ResetPasswordRequest,
  AssignRolesRequest,
} from '../types/user';
import type { RoleResponse } from '../types/role';

export const listUsers = (params: UserQueryFilter) =>
  request.get<Result<PageResponse<UserResponse>>>(API.user.list, { params });

export const getUser = (id: number) =>
  request.get<Result<UserResponse>>(API.user.detail(id));

export const getCurrentUser = () =>
  request.get<Result<UserDetailResponse>>(API.user.me);

export const createUser = (data: UserCreateRequest) =>
  request.post<Result<UserResponse>>(API.user.create, data);

export const updateUser = (id: number, data: UserUpdateRequest) =>
  request.put<Result<UserResponse>>(API.user.update(id), data);

export const deleteUser = (id: number) =>
  request.delete<Result<void>>(API.user.remove(id));

export const getUserRoles = (id: number) =>
  request.get<Result<RoleResponse[]>>(API.user.roles(id));

export const assignRoles = (id: number, data: AssignRolesRequest) =>
  request.put<Result<void>>(API.user.roles(id), data);

export const removeRole = (id: number, roleId: number) =>
  request.delete<Result<void>>(API.user.role(id, roleId));

export const lockUser = (id: number) =>
  request.post<Result<void>>(API.user.lock(id));

export const unlockUser = (id: number) =>
  request.post<Result<void>>(API.user.unlock(id));

export const resetPassword = (id: number, data: ResetPasswordRequest) =>
  request.post<Result<void>>(API.user.resetPw(id), data);

export const changePassword = (data: ChangePasswordRequest) =>
  request.put<Result<void>>(API.user.myPassword, data);
