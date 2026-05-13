import type { PageRequest } from './common';
import { DataScope } from './enums';

export interface RoleCreateRequest {
  roleCode: string;
  roleName: string;
  level?: number;
  dataScope: DataScope;
  remark?: string;
}

export interface RoleUpdateRequest {
  roleName?: string;
  level?: number;
  dataScope?: DataScope;
  remark?: string;
}

export interface RoleResponse {
  id: number;
  roleCode: string;
  roleName: string;
  level: number;
  dataScope: DataScope;
  createBy?: string;
  createTime?: string;
  remark?: string;
}

export interface RoleQueryFilter extends PageRequest {
  keyword?: string;
  level?: number;
}

export interface AssignMenusRequest {
  menuIds: number[];
}
