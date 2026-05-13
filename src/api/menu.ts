import request from './request';
import { API } from '../constants/api';
import type { Result, PageResponse } from '../types/common';
import type {
  MenuResponse,
  MenuTreeNode,
  MenuCreateRequest,
  MenuUpdateRequest,
  MenuQueryFilter,
} from '../types/menu';
import type { RoleResponse } from '../types/role';

export const listMenus = (params: MenuQueryFilter) =>
  request.get<Result<PageResponse<MenuResponse>>>(API.menu.list, { params });

export const getMenuTree = () =>
  request.get<Result<MenuTreeNode[]>>(API.menu.tree);

export const getMenu = (id: number) =>
  request.get<Result<MenuResponse>>(API.menu.detail(id));

export const createMenu = (data: MenuCreateRequest) =>
  request.post<Result<MenuResponse>>(API.menu.create, data);

export const updateMenu = (id: number, data: MenuUpdateRequest) =>
  request.put<Result<MenuResponse>>(API.menu.update(id), data);

export const deleteMenu = (id: number) =>
  request.delete<Result<void>>(API.menu.remove(id));

export const getMenuRoles = (id: number) =>
  request.get<Result<RoleResponse[]>>(API.menu.roles(id));
