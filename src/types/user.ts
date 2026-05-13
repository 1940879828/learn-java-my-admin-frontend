import type { PageRequest } from './common';
import type { RoleResponse } from './role';
import type { MenuTreeNode } from './menu';

export interface UserCreateRequest {
  username: string;
  password: string;
  email: string;
  phone?: string;
  remark?: string;
}

export interface UserUpdateRequest {
  email?: string;
  phone?: string;
  status?: number;
  remark?: string;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  phone?: string;
  status: number;
  locked: boolean;
  lockTime?: string;
  createTime: string;
  remark?: string;
}

export interface UserDetailResponse extends UserResponse {
  roles: RoleResponse[];
  permissions: string[];
  menuTree: MenuTreeNode[];
}

export interface UserQueryFilter extends PageRequest {
  keyword?: string;
  status?: number;
  locked?: boolean;
  roleId?: number;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  newPassword: string;
}

export interface AssignRolesRequest {
  roleIds: number[];
}
