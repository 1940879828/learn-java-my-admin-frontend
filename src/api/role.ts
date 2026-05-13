import request from './request';
import { API } from '../constants/api';
import type { Result, PageResponse } from '../types/common';
import type {
  RoleResponse,
  RoleCreateRequest,
  RoleUpdateRequest,
  RoleQueryFilter,
  AssignMenusRequest,
} from '../types/role';
import type { MenuResponse } from '../types/menu';
import type { UserResponse } from '../types/user';

export const listRoles = (params: RoleQueryFilter) =>
  request.get<Result<PageResponse<RoleResponse>>>(API.role.list, { params });

export const getRole = (id: number) =>
  request.get<Result<RoleResponse>>(API.role.detail(id));

export const createRole = (data: RoleCreateRequest) =>
  request.post<Result<RoleResponse>>(API.role.create, data);

export const updateRole = (id: number, data: RoleUpdateRequest) =>
  request.put<Result<RoleResponse>>(API.role.update(id), data);

export const deleteRole = (id: number) =>
  request.delete<Result<void>>(API.role.remove(id));

export const getRoleMenus = (id: number) =>
  request.get<Result<MenuResponse[]>>(API.role.menus(id));

export const assignMenus = (id: number, data: AssignMenusRequest) =>
  request.put<Result<void>>(API.role.menus(id), data);

export const removeMenu = (id: number, menuId: number) =>
  request.delete<Result<void>>(API.role.menu(id, menuId));

export const getRoleUsers = (id: number) =>
  request.get<Result<UserResponse[]>>(API.role.users(id));
