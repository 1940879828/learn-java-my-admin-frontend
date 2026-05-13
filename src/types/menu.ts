import type { PageRequest } from './common';
import { MenuType } from './enums';

export interface MenuCreateRequest {
  parentId?: number;
  menuName: string;
  menuCode: string;
  menuType: MenuType;
  path?: string;
  component?: string;
  perms?: string;
  icon?: string;
  sortOrder?: number;
  visible?: boolean;
  status?: number;
  remark?: string;
}

export type MenuUpdateRequest = Partial<MenuCreateRequest>;

export interface MenuResponse {
  id: number;
  parentId?: number;
  menuName: string;
  menuCode: string;
  menuType: MenuType;
  path?: string;
  component?: string;
  perms?: string;
  icon?: string;
  sortOrder: number;
  visible: boolean;
  status: number;
  createTime?: string;
}

export interface MenuTreeNode extends MenuResponse {
  children?: MenuTreeNode[];
}

export interface MenuQueryFilter extends PageRequest {
  keyword?: string;
  menuType?: MenuType;
  visible?: boolean;
  parentId?: number;
}
