# Frontend RBAC Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the antd-admin frontend to integrate a complete RBAC system with dynamic menus, permissions, and role-based access control.

**Architecture:** Three-layer progressive implementation - Foundation (types/constants/utils) → Business Logic (api/store/router) → Presentation (components/layouts/pages). Each layer builds on the previous, with one commit per layer.

**Tech Stack:** React 19.2, TypeScript 6, Vite 8, Ant Design 6.3, zustand 5.0, react-router-dom 7.14

**Constraints:** No runtime testing (pure code implementation), no test execution, TypeScript strict mode enabled.

---

## Pre-Implementation

### Task 0: Create Feature Branch

**Files:**
- None (git operation only)

- [ ] **Step 1: Create and switch to feature branch**

```bash
git checkout -b feat/rbac-refactor
```

Expected: Switched to a new branch 'feat/rbac-refactor'

---

## Layer 1: Foundation Layer

> **Goal:** Establish complete type system, constants, and utilities for upper layers

### Task 1.1: Create Common Types

**Files:**
- Create: `src/types/common.ts`

- [ ] **Step 1: Create types directory**

```bash
mkdir -p src/types
```

- [ ] **Step 2: Write common.ts with Result, PageRequest, PageResponse, ErrorCode**

Create `src/types/common.ts`:

```typescript
export interface Result<T = unknown> {
  code: number;
  message: string;
  data: T;
  traceId?: string;
  timestamp?: string;
}

export interface PageRequest {
  page?: number;
  size?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PageResponse<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export enum ErrorCode {
  SUCCESS = 200,
  VALIDATION_FAILED = 40001,
  UNAUTHORIZED = 40100,
  REFRESH_TOKEN_INVALID = 40101,
  FORBIDDEN = 40300,
  NOT_FOUND = 40400,
  USER_NOT_FOUND = 40401,
  ROLE_NOT_FOUND = 40402,
  MENU_NOT_FOUND = 40403,
  DUPLICATE_RESOURCE = 40901,
  RESOURCE_IN_USE = 40902,
  LOCKED = 42300,
  TOO_MANY_REQUESTS = 42900,
  INTERNAL_ERROR = 50000,
}
```

---

### Task 1.2: Create Enums

**Files:**
- Create: `src/types/enums.ts`

- [ ] **Step 1: Write enums.ts with DataScope and MenuType**

Create `src/types/enums.ts`:

```typescript
export enum DataScope {
  ALL = 'ALL',
  CUSTOM = 'CUSTOM',
  DEPT = 'DEPT',
  DEPT_AND_CHILD = 'DEPT_AND_CHILD',
  SELF = 'SELF',
}

export enum MenuType {
  DIR = 'DIR',
  MENU = 'MENU',
  BUTTON = 'BUTTON',
}
```

---

### Task 1.3: Update Auth Types

**Files:**
- Modify: `src/types/auth.ts`

- [ ] **Step 1: Update auth.ts to add email to RegisterRequest and use Result from common**

Replace `src/types/auth.ts` content:

```typescript
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
```

---

### Task 1.4: Create User Types

**Files:**
- Create: `src/types/user.ts`

- [ ] **Step 1: Write user.ts with all user-related types**

Create `src/types/user.ts`:

```typescript
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
```

---

### Task 1.5: Create Role Types

**Files:**
- Create: `src/types/role.ts`

- [ ] **Step 1: Write role.ts with all role-related types**

Create `src/types/role.ts`:

```typescript
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
```

---

### Task 1.6: Create Menu Types

**Files:**
- Create: `src/types/menu.ts`

- [ ] **Step 1: Write menu.ts with all menu-related types**

Create `src/types/menu.ts`:

```typescript
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
```

---

### Task 1.7: Create API Constants

**Files:**
- Create: `src/constants/api.ts`

- [ ] **Step 1: Create constants directory**

```bash
mkdir -p src/constants
```

- [ ] **Step 2: Write api.ts with all API path constants**

Create `src/constants/api.ts`:

```typescript
const V1 = '/api/v1';

export const API = {
  auth: {
    login: `${V1}/auth/login`,
    register: `${V1}/auth/register`,
    refresh: `${V1}/auth/refresh`,
    logout: `${V1}/auth/logout`,
  },
  user: {
    list: `${V1}/users`,
    detail: (id: number) => `${V1}/users/${id}`,
    create: `${V1}/users`,
    update: (id: number) => `${V1}/users/${id}`,
    remove: (id: number) => `${V1}/users/${id}`,
    roles: (id: number) => `${V1}/users/${id}/roles`,
    role: (id: number, roleId: number) => `${V1}/users/${id}/roles/${roleId}`,
    lock: (id: number) => `${V1}/users/${id}/lock`,
    unlock: (id: number) => `${V1}/users/${id}/unlock`,
    resetPw: (id: number) => `${V1}/users/${id}/password:reset`,
    me: `${V1}/users/me`,
    myPassword: `${V1}/users/me/password`,
  },
  role: {
    list: `${V1}/roles`,
    detail: (id: number) => `${V1}/roles/${id}`,
    create: `${V1}/roles`,
    update: (id: number) => `${V1}/roles/${id}`,
    remove: (id: number) => `${V1}/roles/${id}`,
    menus: (id: number) => `${V1}/roles/${id}/menus`,
    menu: (id: number, menuId: number) => `${V1}/roles/${id}/menus/${menuId}`,
    users: (id: number) => `${V1}/roles/${id}/users`,
  },
  menu: {
    list: `${V1}/menus`,
    tree: `${V1}/menus/tree`,
    detail: (id: number) => `${V1}/menus/${id}`,
    create: `${V1}/menus`,
    update: (id: number) => `${V1}/menus/${id}`,
    remove: (id: number) => `${V1}/menus/${id}`,
    roles: (id: number) => `${V1}/menus/${id}/roles`,
  },
} as const;
```

---

### Task 1.8: Create Permission Constants

**Files:**
- Create: `src/constants/permissions.ts`

- [ ] **Step 1: Write permissions.ts with permission code constants**

Create `src/constants/permissions.ts`:

```typescript
export const PERMISSIONS = {
  USER: {
    LIST: 'user:list',
    VIEW: 'user:view',
    ADD: 'user:add',
    EDIT: 'user:edit',
    DELETE: 'user:delete',
    ASSIGN_ROLE: 'user:assign-role',
    LOCK: 'user:lock',
    UNLOCK: 'user:unlock',
    RESET_PASSWORD: 'user:reset-password',
  },
  ROLE: {
    LIST: 'role:list',
    VIEW: 'role:view',
    ADD: 'role:add',
    EDIT: 'role:edit',
    DELETE: 'role:delete',
    ASSIGN_MENU: 'role:assign-menu',
  },
  MENU: {
    LIST: 'menu:list',
    VIEW: 'menu:view',
    ADD: 'menu:add',
    EDIT: 'menu:edit',
    DELETE: 'menu:delete',
  },
} as const;
```

---

### Task 1.9: Create Permission Utilities

**Files:**
- Create: `src/utils/permission.ts`

- [ ] **Step 1: Create utils directory**

```bash
mkdir -p src/utils
```

- [ ] **Step 2: Write permission.ts with permission check functions**

Create `src/utils/permission.ts`:

```typescript
export const hasPermission = (userPermissions: Set<string>, code: string): boolean =>
  userPermissions.has(code);

export const hasAnyPermission = (userPermissions: Set<string>, codes: string[]): boolean =>
  codes.some((c) => userPermissions.has(c));

export const hasAllPermissions = (userPermissions: Set<string>, codes: string[]): boolean =>
  codes.every((c) => userPermissions.has(c));
```

---

### Task 1.10: Create Tree Utilities

**Files:**
- Create: `src/utils/tree.ts`

- [ ] **Step 1: Write tree.ts with tree conversion utilities**

Create `src/utils/tree.ts`:

```typescript
import type { MenuTreeNode } from '../types/menu';

/**
 * Flatten tree structure to array
 */
export function flattenTree(tree: MenuTreeNode[]): MenuTreeNode[] {
  const result: MenuTreeNode[] = [];
  
  const walk = (nodes: MenuTreeNode[]) => {
    nodes.forEach((node) => {
      result.push(node);
      if (node.children?.length) {
        walk(node.children);
      }
    });
  };
  
  walk(tree);
  return result;
}

/**
 * Build tree from flat array
 */
export function buildTree(items: MenuTreeNode[], parentId?: number): MenuTreeNode[] {
  return items
    .filter((item) => item.parentId === parentId)
    .map((item) => ({
      ...item,
      children: buildTree(items, item.id),
    }));
}

/**
 * Find node by id in tree
 */
export function findNodeById(tree: MenuTreeNode[], id: number): MenuTreeNode | null {
  for (const node of tree) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(node.children, id);
      if (found) return found;
    }
  }
  return null;
}
```

---

### Task 1.11: Create Icon Map

**Files:**
- Create: `src/utils/iconMap.tsx`

- [ ] **Step 1: Write iconMap.tsx with icon name to component mapping**

Create `src/utils/iconMap.tsx`:

```typescript
import {
  HomeOutlined,
  UserOutlined,
  TeamOutlined,
  MenuOutlined,
  SettingOutlined,
  AppstoreOutlined,
  DashboardOutlined,
  ProfileOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';

const iconMap: Record<string, ReactNode> = {
  HomeOutlined: <HomeOutlined />,
  UserOutlined: <UserOutlined />,
  TeamOutlined: <TeamOutlined />,
  MenuOutlined: <MenuOutlined />,
  SettingOutlined: <SettingOutlined />,
  AppstoreOutlined: <AppstoreOutlined />,
  DashboardOutlined: <DashboardOutlined />,
  ProfileOutlined: <ProfileOutlined />,
};

export const getIcon = (name?: string): ReactNode => {
  if (!name) return undefined;
  return iconMap[name];
};
```

---

### Task 1.12: Create Error Code Utilities

**Files:**
- Create: `src/utils/errorCode.ts`

- [ ] **Step 1: Write errorCode.ts with error code to message mapping**

Create `src/utils/errorCode.ts`:

```typescript
import { ErrorCode } from '../types/common';

export const ERROR_MESSAGES: Record<number, string> = {
  [ErrorCode.VALIDATION_FAILED]: '请检查输入内容',
  [ErrorCode.UNAUTHORIZED]: '登录已过期，请重新登录',
  [ErrorCode.REFRESH_TOKEN_INVALID]: '会话已失效，请重新登录',
  [ErrorCode.FORBIDDEN]: '您无权执行该操作',
  [ErrorCode.USER_NOT_FOUND]: '用户不存在',
  [ErrorCode.ROLE_NOT_FOUND]: '角色不存在',
  [ErrorCode.MENU_NOT_FOUND]: '菜单不存在',
  [ErrorCode.DUPLICATE_RESOURCE]: '资源已存在',
  [ErrorCode.RESOURCE_IN_USE]: '资源被占用，无法删除',
  [ErrorCode.LOCKED]: '账户已被锁定，请联系管理员',
  [ErrorCode.TOO_MANY_REQUESTS]: '请求过于频繁，请稍后再试',
  [ErrorCode.INTERNAL_ERROR]: '服务器繁忙，请稍后再试',
};

export const friendlyMessage = (code: number, fallback: string): string =>
  ERROR_MESSAGES[code] ?? fallback;
```

---

### Task 1.13: Update Vite Config

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Remove rewrite logic from proxy configuration**

Update `vite.config.ts` server.proxy section:

```typescript
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // REMOVED: rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
```

---

### Task 1.14: Commit Layer 1

**Files:**
- All files created/modified in Layer 1

- [ ] **Step 1: Stage all Layer 1 changes**

```bash
git add src/types/ src/constants/ src/utils/ vite.config.ts
```

- [ ] **Step 2: Commit Layer 1**

```bash
git commit -m "$(cat <<'EOF'
feat: 基础设施层 - types, constants, utils

- Add comprehensive type definitions (common, auth, user, role, menu, enums)
- Add API path constants with /api/v1 prefix
- Add utility functions (permission, tree, iconMap, errorCode)
- Fix vite proxy configuration (remove rewrite)
- Update RegisterRequest to include required email field
- Add traceId and timestamp to Result<T> type

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Layer 2: Business Logic Layer

> **Goal:** Implement API calls, state management, routing system, and hooks

### Task 2.1: Update Request Interceptor

**Files:**
- Modify: `src/api/request.ts`

- [ ] **Step 1: Update REFRESH_TOKEN_PATH and add new error handlers**

Replace the relevant sections in `src/api/request.ts`:

```typescript
import axios, { type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import { message, Modal } from 'antd';
import { useAuthStore } from '../store/useAuthStore';
import type { Result, LoginResponse } from '../types/auth';

export interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _skipErrorHandler?: boolean;
}

const BASE_URL = '/api';
const REFRESH_TOKEN_PATH = '/api/v1/auth/refresh';

const request = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

let isRefreshing = false;
let pendingQueue: ((token: string) => void)[] = [];

const drainQueue = (token: string) => {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
};

const redirectToLogin = () => {
  useAuthStore.getState().clear();
  window.location.replace('/login');
};

request.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config as CustomRequestConfig;
    const status = error.response?.status;
    const data = error.response?.data;

    if (status === 401 && !originalRequest._retry) {
      const { refreshToken } = useAuthStore.getState();

      if (!refreshToken) {
        redirectToLogin();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingQueue.push((newToken) => {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            resolve(request(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<Result<LoginResponse>>(
          `${BASE_URL}${REFRESH_TOKEN_PATH}`,
          { refreshToken }
        );

        if (data.code === 200 && data.data) {
          const { accessToken: newAccessToken, refreshToken: newRefreshToken } = data.data;
          useAuthStore.getState().setTokens(newAccessToken, newRefreshToken);
          drainQueue(newAccessToken);
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return request(originalRequest);
        } else {
          throw new Error(data.message || '刷新令牌失败');
        }
      } catch {
        pendingQueue = [];
        redirectToLogin();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    if (!originalRequest._skipErrorHandler) {
      switch (status) {
        case 403:
          message.error(`无权限访问 (traceId: ${data?.traceId ?? 'n/a'})`);
          break;
        case 423:
          Modal.error({ title: '账户已被锁定', content: data?.message || '请联系管理员' });
          break;
        case 429:
          message.warning('操作过于频繁，请稍后再试');
          break;
        default:
          const msg: string = data?.message ?? error.message ?? '请求失败';
          message.error(msg);
      }
    }
    return Promise.reject(error);
  }
);

export default request;
```

---

### Task 2.2: Update Auth API

**Files:**
- Modify: `src/api/auth.ts`

- [ ] **Step 1: Update auth.ts to use API constants**

Replace `src/api/auth.ts`:

```typescript
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
```

---

### Task 2.3: Create User API

**Files:**
- Create: `src/api/user.ts`

- [ ] **Step 1: Write user.ts with all user API calls**

Create `src/api/user.ts`:

```typescript
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
```

---

### Task 2.4: Create Role API

**Files:**
- Create: `src/api/role.ts`

- [ ] **Step 1: Write role.ts with all role API calls**

Create `src/api/role.ts`:

```typescript
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
import type { MenuResponse, UserResponse } from '../types/user';

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
```

---

### Task 2.5: Create Menu API

**Files:**
- Create: `src/api/menu.ts`

- [ ] **Step 1: Write menu.ts with all menu API calls**

Create `src/api/menu.ts`:

```typescript
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
```

---

### Task 2.6: Create API Index

**Files:**
- Create: `src/api/index.ts`

- [ ] **Step 1: Write index.ts to re-export all APIs**

Create `src/api/index.ts`:

```typescript
export * from './auth';
export * from './user';
export * from './role';
export * from './menu';
```

---

### Task 2.7: Refactor Auth Store

**Files:**
- Modify: `src/store/useAuthStore.ts`

- [ ] **Step 1: Refactor useAuthStore to use zustand persist middleware**

Replace `src/store/useAuthStore.ts`:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      clear: () => set({ accessToken: null, refreshToken: null }),
    }),
    { name: 'auth', storage: createJSONStorage(() => localStorage) }
  )
);

export const useIsAuthenticated = () => useAuthStore((state) => !!state.accessToken);
```

---

### Task 2.8: Create User Store

**Files:**
- Create: `src/store/useUserStore.ts`

- [ ] **Step 1: Write useUserStore for RBAC state**

Create `src/store/useUserStore.ts`:

```typescript
import { create } from 'zustand';
import type { UserDetailResponse } from '../types/user';
import type { MenuTreeNode } from '../types/menu';

interface UserState {
  user: UserDetailResponse | null;
  permissions: Set<string>;
  menuTree: MenuTreeNode[];
  loaded: boolean;
  setUser: (u: UserDetailResponse) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  permissions: new Set(),
  menuTree: [],
  loaded: false,
  setUser: (u) =>
    set({
      user: u,
      permissions: new Set(u.permissions),
      menuTree: u.menuTree,
      loaded: true,
    }),
  reset: () =>
    set({ user: null, permissions: new Set(), menuTree: [], loaded: false }),
}));
```

---

### Task 2.9: Create Permission Hook

**Files:**
- Create: `src/hooks/usePermission.ts`

- [ ] **Step 1: Create hooks directory**

```bash
mkdir -p src/hooks
```

- [ ] **Step 2: Write usePermission hook**

Create `src/hooks/usePermission.ts`:

```typescript
import { useUserStore } from '../store/useUserStore';

export function usePermission() {
  const permissions = useUserStore((s) => s.permissions);

  return {
    has: (code: string) => permissions.has(code),
    hasAny: (codes: string[]) => codes.some((c) => permissions.has(c)),
    hasAll: (codes: string[]) => codes.every((c) => permissions.has(c)),
  };
}
```

---

### Task 2.10: Create Auth Guard

**Files:**
- Create: `src/router/guards/AuthGuard.tsx`

- [ ] **Step 1: Create guards directory**

```bash
mkdir -p src/router/guards
```

- [ ] **Step 2: Write AuthGuard component**

Create `src/router/guards/AuthGuard.tsx`:

```typescript
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export default function AuthGuard() {
  const hasToken = useAuthStore((s) => !!s.accessToken);
  const loc = useLocation();

  if (!hasToken) {
    return (
      <Navigate
        to={`/login?from=${encodeURIComponent(loc.pathname + loc.search)}`}
        replace
      />
    );
  }

  return <Outlet />;
}
```

---

### Task 2.11: Create Bootstrap Guard

**Files:**
- Create: `src/router/guards/BootstrapGuard.tsx`

- [ ] **Step 1: Write BootstrapGuard component**

Create `src/router/guards/BootstrapGuard.tsx`:

```typescript
import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Spin } from 'antd';
import { useUserStore } from '../../store/useUserStore';
import { getCurrentUser } from '../../api/user';
import { useAuthStore } from '../../store/useAuthStore';

export default function BootstrapGuard() {
  const { loaded, setUser } = useUserStore();

  useEffect(() => {
    if (loaded) return;

    getCurrentUser()
      .then((res) => {
        if (res.data.code === 200 && res.data.data) {
          setUser(res.data.data);
        } else {
          useAuthStore.getState().clear();
        }
      })
      .catch(() => {
        useAuthStore.getState().clear();
      });
  }, [loaded, setUser]);

  if (!loaded) {
    return <Spin spinning fullscreen tip="加载中..." />;
  }

  return <Outlet />;
}
```

---

### Task 2.12: Create Permission Guard

**Files:**
- Create: `src/router/guards/PermissionGuard.tsx`

- [ ] **Step 1: Write PermissionGuard component**

Create `src/router/guards/PermissionGuard.tsx`:

```typescript
import { Navigate, Outlet } from 'react-router-dom';
import { usePermission } from '../../hooks/usePermission';

interface Props {
  code?: string;
  codes?: string[];
  mode?: 'all' | 'any';
}

export default function PermissionGuard({ code, codes, mode = 'any' }: Props) {
  const { has, hasAll, hasAny } = usePermission();

  const ok = code ? has(code) : mode === 'all' ? hasAll(codes!) : hasAny(codes!);

  return ok ? <Outlet /> : <Navigate to="/403" replace />;
}
```

---

### Task 2.13: Create Build Routes Utility

**Files:**
- Create: `src/router/buildRoutes.ts`

- [ ] **Step 1: Write buildRoutes function**

Create `src/router/buildRoutes.ts`:

```typescript
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import type { MenuTreeNode } from '../types/menu';
import PermissionGuard from './guards/PermissionGuard';

const componentRegistry: Record<
  string,
  React.LazyExoticComponent<React.ComponentType>
> = {
  'User/List': lazy(() => import('../pages/User')),
  'Role/List': lazy(() => import('../pages/Role')),
  'Menu/List': lazy(() => import('../pages/Menu')),
  Home: lazy(() => import('../pages/Home')),
  Profile: lazy(() => import('../pages/Profile')),
};

export function buildRoutes(menuTree: MenuTreeNode[]): RouteObject[] {
  const result: RouteObject[] = [];

  const walk = (nodes: MenuTreeNode[], parentPath = '') => {
    nodes.forEach((node) => {
      if (node.menuType === 'BUTTON' || !node.path) return;

      const fullPath = node.path.startsWith('/')
        ? node.path
        : `${parentPath}/${node.path}`;
      const Component = node.component
        ? componentRegistry[node.component]
        : null;

      if (Component) {
        result.push({
          path: fullPath,
          element: node.perms ? (
            <PermissionGuard code={node.perms} />
          ) : undefined,
          children: [{ index: true, element: <Component /> }],
        });
      }

      if (node.children?.length) {
        walk(node.children, fullPath);
      }
    });
  };

  walk(menuTree);
  return result;
}
```

---

### Task 2.14: Update Router Index

**Files:**
- Modify: `src/router/index.tsx`
- Delete: `src/router/AuthRoute.tsx` (replaced by AuthGuard)

- [ ] **Step 1: Delete old AuthRoute.tsx**

```bash
git rm src/router/AuthRoute.tsx
```

- [ ] **Step 2: Replace router/index.tsx with factory function**

Replace `src/router/index.tsx`:

```typescript
import { createBrowserRouter } from 'react-router-dom';
import type { MenuTreeNode } from '../types/menu';
import AuthGuard from './guards/AuthGuard';
import BootstrapGuard from './guards/BootstrapGuard';
import AdminLayout from '../layouts/AdminLayout';
import LoginPage from '../pages/Login';
import NotFoundPage from '../pages/NotFound';
import ForbiddenPage from '../pages/Forbidden';
import ProfilePage from '../pages/Profile';
import { buildRoutes } from './buildRoutes';

export function createAppRouter(menuTree: MenuTreeNode[]) {
  const dynamicRoutes = buildRoutes(menuTree);

  return createBrowserRouter([
    { path: '/login', element: <LoginPage /> },
    { path: '/403', element: <ForbiddenPage /> },
    {
      element: <AuthGuard />,
      children: [
        {
          element: <BootstrapGuard />,
          children: [
            {
              element: <AdminLayout />,
              children: [
                { path: '/profile', element: <ProfilePage /> },
                ...dynamicRoutes,
              ],
            },
          ],
        },
      ],
    },
    { path: '*', element: <NotFoundPage /> },
  ]);
}
```

---

### Task 2.15: Update App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update App.tsx for dynamic router**

Replace `src/App.tsx`:

```typescript
import { useMemo } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useUserStore } from './store/useUserStore';
import { createAppRouter } from './router';

export default function App() {
  const menuTree = useUserStore((s) => s.menuTree);
  const router = useMemo(() => createAppRouter(menuTree), [menuTree]);

  return (
    <ConfigProvider locale={zhCN}>
      <RouterProvider router={router} key={menuTree.length} />
    </ConfigProvider>
  );
}
```

---

### Task 2.16: Commit Layer 2

**Files:**
- All files created/modified in Layer 2

- [ ] **Step 1: Stage all Layer 2 changes**

```bash
git add src/api/ src/store/ src/hooks/ src/router/ src/App.tsx
git rm src/router/AuthRoute.tsx
```

- [ ] **Step 2: Commit Layer 2**

```bash
git commit -m "$(cat <<'EOF'
feat: 业务逻辑层 - api, store, router, hooks

- Implement complete API layer (auth, user, role, menu)
- Refactor useAuthStore with zustand persist middleware
- Add useUserStore for RBAC state (user, permissions, menuTree)
- Implement three-tier route guards (Auth, Bootstrap, Permission)
- Add dynamic route generation from backend menuTree
- Add usePermission hook for permission checks
- Update request interceptor with 403/423/429 handlers
- Update App.tsx for dynamic router recreation
- Remove old AuthRoute in favor of AuthGuard

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Layer 3: Presentation Layer

> **Goal:** Build complete UI layer with components, layouts, and admin pages

### Task 3.1: Create Permission Component

**Files:**
- Create: `src/components/Permission/index.tsx`

- [ ] **Step 1: Create components directory**

```bash
mkdir -p src/components/Permission
```

- [ ] **Step 2: Write Permission wrapper component**

Create `src/components/Permission/index.tsx`:

```typescript
import type { ReactNode } from 'react';
import { usePermission } from '../../hooks/usePermission';

interface Props {
  code?: string;
  codes?: string[];
  mode?: 'all' | 'any';
  fallback?: ReactNode;
  children: ReactNode;
}

export default function Permission({
  code,
  codes,
  mode = 'any',
  fallback = null,
  children,
}: Props) {
  const { has, hasAll, hasAny } = usePermission();

  const ok = code
    ? has(code)
    : mode === 'all'
      ? hasAll(codes ?? [])
      : hasAny(codes ?? []);

  return <>{ok ? children : fallback}</>;
}
```

---

### Task 3.2: Create Blank Layout

**Files:**
- Create: `src/layouts/BlankLayout.tsx`

- [ ] **Step 1: Write BlankLayout component**

Create `src/layouts/BlankLayout.tsx`:

```typescript
import { Outlet } from 'react-router-dom';

export default function BlankLayout() {
  return <Outlet />;
}
```

---

### Task 3.3: Update Admin Layout

**Files:**
- Modify: `src/layouts/AdminLayout.tsx`

- [ ] **Step 1: Update AdminLayout to use store menuTree**

Replace `src/layouts/AdminLayout.tsx`:

```typescript
import { useMemo } from 'react';
import { ProLayout } from '@ant-design/pro-components';
import type { MenuDataItem } from '@ant-design/pro-components';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import { useUserStore } from '../store/useUserStore';
import { useAuthStore } from '../store/useAuthStore';
import { getIcon } from '../utils/iconMap';
import type { MenuTreeNode } from '../types/menu';

function toMenuDataItems(nodes: MenuTreeNode[]): MenuDataItem[] {
  return nodes
    .filter((n) => n.menuType !== 'BUTTON' && n.visible !== false)
    .map((n) => ({
      path: n.path,
      name: n.menuName,
      icon: getIcon(n.icon),
      children: n.children?.length ? toMenuDataItems(n.children) : undefined,
    }));
}

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const menuTree = useUserStore((s) => s.menuTree);
  const user = useUserStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clear);
  const resetUser = useUserStore((s) => s.reset);

  const route = useMemo(
    () => ({ path: '/', routes: toMenuDataItems(menuTree) }),
    [menuTree]
  );

  const handleLogout = () => {
    clearAuth();
    resetUser();
    navigate('/login', { replace: true });
  };

  const dropdownItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ];

  return (
    <ProLayout
      title="Antd Admin"
      route={route}
      location={location}
      layout="mix"
      menuItemRender={(item, dom) => <Link to={item.path ?? '/'}>{dom}</Link>}
      avatarProps={{
        src: undefined,
        title: user?.username,
        render: (_, dom) => (
          <Dropdown menu={{ items: dropdownItems }} placement="bottomRight">
            {dom}
          </Dropdown>
        ),
      }}
    >
      <Outlet />
    </ProLayout>
  );
}
```

---

### Task 3.4: Create Forbidden Page

**Files:**
- Create: `src/pages/Forbidden/index.tsx`

- [ ] **Step 1: Create Forbidden directory**

```bash
mkdir -p src/pages/Forbidden
```

- [ ] **Step 2: Write Forbidden page**

Create `src/pages/Forbidden/index.tsx`:

```typescript
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <Result
      status="403"
      title="403"
      subTitle="抱歉，您没有权限访问此页面"
      extra={
        <Button type="primary" onClick={() => navigate('/')}>
          返回首页
        </Button>
      }
    />
  );
}
```

---

### Task 3.5: Update Login Page

**Files:**
- Modify: `src/pages/Login/index.tsx`

- [ ] **Step 1: Update Login page to add email field and call /users/me**

This task requires reading the current Login page first, then updating it. The key changes:
1. Add email field to register form
2. After login success, call getCurrentUser() before navigating

Update `src/pages/Login/index.tsx` to include email in RegisterRequest and call getCurrentUser after login. The exact implementation depends on the current structure, but the key additions are:

```typescript
// In register form, add email field:
<ProFormText
  name="email"
  label="邮箱"
  placeholder="请输入邮箱"
  rules={[
    { required: true, message: '请输入邮箱' },
    { type: 'email', message: '请输入有效的邮箱地址' },
  ]}
/>

// In login handler, after setTokens:
const me = await getCurrentUser();
if (me.data.code === 200 && me.data.data) {
  useUserStore.getState().setUser(me.data.data);
}
```

---

### Task 3.6: Update Home Page

**Files:**
- Modify: `src/pages/Home/index.tsx`

- [ ] **Step 1: Update Home page to show user info**

Update `src/pages/Home/index.tsx`:

```typescript
import { Card, Typography, Space } from 'antd';
import { useUserStore } from '../../store/useUserStore';

const { Title, Paragraph } = Typography;

export default function HomePage() {
  const user = useUserStore((s) => s.user);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', padding: 24 }}>
      <Card>
        <Title level={2}>欢迎回来，{user?.username}！</Title>
        <Paragraph>这是您的管理控制台。</Paragraph>
      </Card>

      <Card title="系统信息">
        <Space direction="vertical">
          <div>用户名：{user?.username}</div>
          <div>邮箱：{user?.email}</div>
          <div>
            角色：
            {user?.roles.map((r) => r.roleName).join('、') || '无'}
          </div>
          <div>权限数：{user?.permissions.length ?? 0}</div>
        </Space>
      </Card>
    </Space>
  );
}
```

---

### Task 3.7: Create Profile Page

**Files:**
- Create: `src/pages/Profile/index.tsx`
- Create: `src/pages/Profile/InfoTab.tsx`
- Create: `src/pages/Profile/PasswordTab.tsx`

- [ ] **Step 1: Create Profile directory**

```bash
mkdir -p src/pages/Profile
```

- [ ] **Step 2: Write Profile index**

Create `src/pages/Profile/index.tsx`:

```typescript
import { Card, Tabs } from 'antd';
import InfoTab from './InfoTab';
import PasswordTab from './PasswordTab';

export default function ProfilePage() {
  return (
    <div style={{ padding: 24 }}>
      <Card>
        <Tabs
          items={[
            { key: 'info', label: '基本信息', children: <InfoTab /> },
            { key: 'password', label: '修改密码', children: <PasswordTab /> },
          ]}
        />
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Write InfoTab**

Create `src/pages/Profile/InfoTab.tsx`:

```typescript
import { Descriptions } from 'antd';
import { useUserStore } from '../../store/useUserStore';

export default function InfoTab() {
  const user = useUserStore((s) => s.user);

  return (
    <Descriptions column={1} bordered>
      <Descriptions.Item label="用户名">{user?.username}</Descriptions.Item>
      <Descriptions.Item label="邮箱">{user?.email}</Descriptions.Item>
      <Descriptions.Item label="手机号">{user?.phone || '-'}</Descriptions.Item>
      <Descriptions.Item label="状态">
        {user?.status === 1 ? '启用' : '禁用'}
      </Descriptions.Item>
      <Descriptions.Item label="角色">
        {user?.roles.map((r) => r.roleName).join('、') || '无'}
      </Descriptions.Item>
      <Descriptions.Item label="创建时间">{user?.createTime}</Descriptions.Item>
    </Descriptions>
  );
}
```

- [ ] **Step 4: Write PasswordTab**

Create `src/pages/Profile/PasswordTab.tsx`:

```typescript
import { ProForm, ProFormText } from '@ant-design/pro-components';
import { message } from 'antd';
import { changePassword } from '../../api/user';
import type { ChangePasswordRequest } from '../../types/user';

export default function PasswordTab() {
  const handleSubmit = async (values: ChangePasswordRequest) => {
    try {
      const res = await changePassword(values);
      if (res.data.code === 200) {
        message.success('密码修改成功，请重新登录');
        // Optionally logout user here
        return true;
      }
      message.error(res.data.message);
      return false;
    } catch (error) {
      return false;
    }
  };

  return (
    <ProForm<ChangePasswordRequest>
      onFinish={handleSubmit}
      submitter={{
        searchConfig: { submitText: '确认修改' },
        resetButtonProps: false,
      }}
    >
      <ProFormText.Password
        name="oldPassword"
        label="当前密码"
        placeholder="请输入当前密码"
        rules={[{ required: true, message: '请输入当前密码' }]}
      />
      <ProFormText.Password
        name="newPassword"
        label="新密码"
        placeholder="请输入新密码"
        rules={[
          { required: true, message: '请输入新密码' },
          { min: 6, message: '密码至少6位' },
        ]}
      />
      <ProFormText.Password
        name="confirmPassword"
        label="确认密码"
        placeholder="请再次输入新密码"
        dependencies={['newPassword']}
        rules={[
          { required: true, message: '请确认新密码' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('newPassword') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('两次输入的密码不一致'));
            },
          }),
        ]}
      />
    </ProForm>
  );
}
```

---

### Task 3.8: Create User Management Page (Part 1 - Main List)

**Files:**
- Create: `src/pages/User/index.tsx`

- [ ] **Step 1: Create User directory**

```bash
mkdir -p src/pages/User
```

- [ ] **Step 2: Write User list page with ProTable**

Create `src/pages/User/index.tsx`:

```typescript
import { useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { listUsers, deleteUser, lockUser, unlockUser } from '../../api/user';
import type { UserResponse } from '../../types/user';
import Permission from '../../components/Permission';
import CreateDrawer from './CreateDrawer';
import EditDrawer from './EditDrawer';
import RoleAssignModal from './RoleAssignModal';

export default function UserPage() {
  const actionRef = useRef<ActionType>();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<UserResponse | null>(null);
  const [roleAssignRecord, setRoleAssignRecord] = useState<UserResponse | null>(null);

  const handleDelete = async (id: number) => {
    try {
      const res = await deleteUser(id);
      if (res.data.code === 200) {
        message.success('删除成功');
        actionRef.current?.reload();
        return;
      }
      message.error(res.data.message);
    } catch (error) {
      // Error handled by interceptor
    }
  };

  const handleLock = async (id: number) => {
    try {
      const res = await lockUser(id);
      if (res.data.code === 200) {
        message.success('锁定成功');
        actionRef.current?.reload();
        return;
      }
      message.error(res.data.message);
    } catch (error) {
      // Error handled by interceptor
    }
  };

  const handleUnlock = async (id: number) => {
    try {
      const res = await unlockUser(id);
      if (res.data.code === 200) {
        message.success('解锁成功');
        actionRef.current?.reload();
        return;
      }
      message.error(res.data.message);
    } catch (error) {
      // Error handled by interceptor
    }
  };

  const columns: ProColumns<UserResponse>[] = [
    { title: 'ID', dataIndex: 'id', width: 80, search: false },
    { title: '用户名', dataIndex: 'username', key: 'keyword' },
    { title: '邮箱', dataIndex: 'email', search: false },
    { title: '手机号', dataIndex: 'phone', search: false },
    {
      title: '状态',
      dataIndex: 'status',
      valueEnum: {
        0: { text: '禁用', status: 'Default' },
        1: { text: '启用', status: 'Success' },
      },
    },
    {
      title: '锁定',
      dataIndex: 'locked',
      render: (_, record) =>
        record.locked ? <Tag color="red">已锁定</Tag> : <Tag>正常</Tag>,
      search: false,
    },
    { title: '创建时间', dataIndex: 'createTime', search: false, width: 180 },
    {
      title: '操作',
      valueType: 'option',
      width: 250,
      render: (_, record) => [
        <Permission key="edit" code="user:edit">
          <a onClick={() => setEditRecord(record)}>编辑</a>
        </Permission>,
        <Permission key="role" code="user:edit">
          <a onClick={() => setRoleAssignRecord(record)}>分配角色</a>
        </Permission>,
        <Permission key="lock" code="user:edit">
          <a
            onClick={() =>
              record.locked ? handleUnlock(record.id) : handleLock(record.id)
            }
          >
            {record.locked ? '解锁' : '锁定'}
          </a>
        </Permission>,
        <Permission key="del" code="user:delete">
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
            <a>删除</a>
          </Popconfirm>
        </Permission>,
      ],
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <ProTable<UserResponse>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        request={async (params) => {
          try {
            const { data } = await listUsers({
              page: params.current,
              size: params.pageSize,
              keyword: params.keyword,
              status: params.status,
            });
            return {
              data: data.data.items,
              total: data.data.total,
              success: true,
            };
          } catch (error) {
            return { data: [], total: 0, success: false };
          }
        }}
        toolbar={{
          actions: [
            <Permission key="add" code="user:add">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateOpen(true)}
              >
                新建用户
              </Button>
            </Permission>,
          ],
        }}
      />

      <CreateDrawer
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          actionRef.current?.reload();
        }}
      />

      <EditDrawer
        record={editRecord}
        onClose={() => setEditRecord(null)}
        onSuccess={() => {
          setEditRecord(null);
          actionRef.current?.reload();
        }}
      />

      <RoleAssignModal
        record={roleAssignRecord}
        onClose={() => setRoleAssignRecord(null)}
        onSuccess={() => {
          setRoleAssignRecord(null);
          actionRef.current?.reload();
        }}
      />
    </div>
  );
}
```

---

### Task 3.9: Create User Management Page (Part 2 - Drawers/Modals)

**Files:**
- Create: `src/pages/User/CreateDrawer.tsx`
- Create: `src/pages/User/EditDrawer.tsx`
- Create: `src/pages/User/RoleAssignModal.tsx`

- [ ] **Step 1: Write CreateDrawer**

Create `src/pages/User/CreateDrawer.tsx`:

```typescript
import { DrawerForm, ProFormText } from '@ant-design/pro-components';
import { message } from 'antd';
import { createUser } from '../../api/user';
import type { UserCreateRequest } from '../../types/user';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateDrawer({ open, onClose, onSuccess }: Props) {
  const handleSubmit = async (values: UserCreateRequest) => {
    try {
      const res = await createUser(values);
      if (res.data.code === 200 || res.data.code === 201) {
        message.success('创建成功');
        onSuccess();
        return true;
      }
      message.error(res.data.message);
      return false;
    } catch (error) {
      return false;
    }
  };

  return (
    <DrawerForm<UserCreateRequest>
      title="新建用户"
      open={open}
      onOpenChange={(visible) => !visible && onClose()}
      onFinish={handleSubmit}
    >
      <ProFormText
        name="username"
        label="用户名"
        placeholder="请输入用户名"
        rules={[{ required: true, message: '请输入用户名' }]}
      />
      <ProFormText.Password
        name="password"
        label="密码"
        placeholder="请输入密码"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 6, message: '密码至少6位' },
        ]}
      />
      <ProFormText
        name="email"
        label="邮箱"
        placeholder="请输入邮箱"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' },
        ]}
      />
      <ProFormText
        name="phone"
        label="手机号"
        placeholder="请输入手机号"
      />
      <ProFormText
        name="remark"
        label="备注"
        placeholder="请输入备注"
      />
    </DrawerForm>
  );
}
```

- [ ] **Step 2: Write EditDrawer**

Create `src/pages/User/EditDrawer.tsx`:

```typescript
import { DrawerForm, ProFormText, ProFormRadio } from '@ant-design/pro-components';
import { message } from 'antd';
import { updateUser } from '../../api/user';
import type { UserResponse, UserUpdateRequest } from '../../types/user';

interface Props {
  record: UserResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditDrawer({ record, onClose, onSuccess }: Props) {
  const handleSubmit = async (values: UserUpdateRequest) => {
    if (!record) return false;

    try {
      const res = await updateUser(record.id, values);
      if (res.data.code === 200) {
        message.success('更新成功');
        onSuccess();
        return true;
      }
      message.error(res.data.message);
      return false;
    } catch (error) {
      return false;
    }
  };

  return (
    <DrawerForm<UserUpdateRequest>
      title="编辑用户"
      open={!!record}
      onOpenChange={(visible) => !visible && onClose()}
      onFinish={handleSubmit}
      initialValues={record || undefined}
    >
      <ProFormText
        name="email"
        label="邮箱"
        placeholder="请输入邮箱"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱地址' },
        ]}
      />
      <ProFormText name="phone" label="手机号" placeholder="请输入手机号" />
      <ProFormRadio.Group
        name="status"
        label="状态"
        options={[
          { label: '启用', value: 1 },
          { label: '禁用', value: 0 },
        ]}
      />
      <ProFormText name="remark" label="备注" placeholder="请输入备注" />
    </DrawerForm>
  );
}
```

- [ ] **Step 3: Write RoleAssignModal**

Create `src/pages/User/RoleAssignModal.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { Modal, Transfer, message } from 'antd';
import type { TransferProps } from 'antd';
import { listRoles } from '../../api/role';
import { getUserRoles, assignRoles } from '../../api/user';
import type { UserResponse } from '../../types/user';
import type { RoleResponse } from '../../types/role';

interface Props {
  record: UserResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RoleAssignModal({ record, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [allRoles, setAllRoles] = useState<RoleResponse[]>([]);
  const [targetKeys, setTargetKeys] = useState<number[]>([]);

  useEffect(() => {
    if (!record) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [rolesRes, userRolesRes] = await Promise.all([
          listRoles({ page: 1, size: 1000 }),
          getUserRoles(record.id),
        ]);

        if (rolesRes.data.code === 200) {
          setAllRoles(rolesRes.data.data.items);
        }

        if (userRolesRes.data.code === 200) {
          setTargetKeys(userRolesRes.data.data.map((r) => r.id));
        }
      } catch (error) {
        // Error handled by interceptor
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [record]);

  const handleSubmit = async () => {
    if (!record) return;

    setLoading(true);
    try {
      const res = await assignRoles(record.id, { roleIds: targetKeys });
      if (res.data.code === 200) {
        message.success('分配成功');
        onSuccess();
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const onChange: TransferProps['onChange'] = (newTargetKeys) => {
    setTargetKeys(newTargetKeys as number[]);
  };

  return (
    <Modal
      title={`分配角色 - ${record?.username}`}
      open={!!record}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
      width={600}
    >
      <Transfer
        dataSource={allRoles.map((r) => ({ key: r.id, title: r.roleName }))}
        targetKeys={targetKeys}
        onChange={onChange}
        render={(item) => item.title}
        listStyle={{ width: 250, height: 400 }}
      />
    </Modal>
  );
}
```

---

### Task 3.10: Create Role Management Page (Part 1 - Main List)

**Files:**
- Create: `src/pages/Role/index.tsx`

- [ ] **Step 1: Create Role directory**

```bash
mkdir -p src/pages/Role
```

- [ ] **Step 2: Write Role list page**

Create `src/pages/Role/index.tsx`:

```typescript
import { useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { listRoles, deleteRole } from '../../api/role';
import type { RoleResponse } from '../../types/role';
import Permission from '../../components/Permission';
import FormDrawer from './FormDrawer';
import MenuAssignDrawer from './MenuAssignDrawer';

export default function RolePage() {
  const actionRef = useRef<ActionType>();
  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<RoleResponse | null>(null);
  const [menuAssignRecord, setMenuAssignRecord] = useState<RoleResponse | null>(null);

  const handleDelete = async (id: number) => {
    try {
      const res = await deleteRole(id);
      if (res.data.code === 200 || res.data.code === 204) {
        message.success('删除成功');
        actionRef.current?.reload();
        return;
      }
      message.error(res.data.message);
    } catch (error) {
      // Error handled by interceptor
    }
  };

  const columns: ProColumns<RoleResponse>[] = [
    { title: 'ID', dataIndex: 'id', width: 80, search: false },
    { title: '角色编码', dataIndex: 'roleCode', key: 'keyword' },
    { title: '角色名称', dataIndex: 'roleName', search: false },
    { title: '等级', dataIndex: 'level', search: false, width: 80 },
    { title: '数据权限', dataIndex: 'dataScope', search: false },
    { title: '创建人', dataIndex: 'createBy', search: false },
    { title: '创建时间', dataIndex: 'createTime', search: false, width: 180 },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      render: (_, record) => [
        <Permission key="edit" code="role:edit">
          <a onClick={() => { setEditRecord(record); setFormOpen(true); }}>
            编辑
          </a>
        </Permission>,
        <Permission key="menu" code="role:assign-menu">
          <a onClick={() => setMenuAssignRecord(record)}>分配菜单</a>
        </Permission>,
        <Permission key="del" code="role:delete">
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
            <a>删除</a>
          </Popconfirm>
        </Permission>,
      ],
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <ProTable<RoleResponse>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        request={async (params) => {
          try {
            const { data } = await listRoles({
              page: params.current,
              size: params.pageSize,
              keyword: params.keyword,
            });
            return {
              data: data.data.items,
              total: data.data.total,
              success: true,
            };
          } catch (error) {
            return { data: [], total: 0, success: false };
          }
        }}
        toolbar={{
          actions: [
            <Permission key="add" code="role:add">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => { setEditRecord(null); setFormOpen(true); }}
              >
                新建角色
              </Button>
            </Permission>,
          ],
        }}
      />

      <FormDrawer
        open={formOpen}
        record={editRecord}
        onClose={() => { setFormOpen(false); setEditRecord(null); }}
        onSuccess={() => {
          setFormOpen(false);
          setEditRecord(null);
          actionRef.current?.reload();
        }}
      />

      <MenuAssignDrawer
        record={menuAssignRecord}
        onClose={() => setMenuAssignRecord(null)}
        onSuccess={() => {
          setMenuAssignRecord(null);
          actionRef.current?.reload();
        }}
      />
    </div>
  );
}
```

---

### Task 3.11: Create Role Management Page (Part 2 - Drawers)

**Files:**
- Create: `src/pages/Role/FormDrawer.tsx`
- Create: `src/pages/Role/MenuAssignDrawer.tsx`

- [ ] **Step 1: Write FormDrawer**

Create `src/pages/Role/FormDrawer.tsx`:

```typescript
import { DrawerForm, ProFormText, ProFormDigit, ProFormSelect } from '@ant-design/pro-components';
import { message } from 'antd';
import { createRole, updateRole } from '../../api/role';
import type { RoleResponse, RoleCreateRequest, RoleUpdateRequest } from '../../types/role';
import { DataScope } from '../../types/enums';

interface Props {
  open: boolean;
  record: RoleResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FormDrawer({ open, record, onClose, onSuccess }: Props) {
  const handleSubmit = async (values: RoleCreateRequest | RoleUpdateRequest) => {
    try {
      const res = record
        ? await updateRole(record.id, values)
        : await createRole(values as RoleCreateRequest);

      if (res.data.code === 200 || res.data.code === 201) {
        message.success(record ? '更新成功' : '创建成功');
        onSuccess();
        return true;
      }
      message.error(res.data.message);
      return false;
    } catch (error) {
      return false;
    }
  };

  return (
    <DrawerForm
      title={record ? '编辑角色' : '新建角色'}
      open={open}
      onOpenChange={(visible) => !visible && onClose()}
      onFinish={handleSubmit}
      initialValues={record || { dataScope: DataScope.ALL }}
    >
      {!record && (
        <ProFormText
          name="roleCode"
          label="角色编码"
          placeholder="请输入角色编码"
          rules={[{ required: true, message: '请输入角色编码' }]}
        />
      )}
      <ProFormText
        name="roleName"
        label="角色名称"
        placeholder="请输入角色名称"
        rules={[{ required: true, message: '请输入角色名称' }]}
      />
      <ProFormDigit
        name="level"
        label="等级"
        placeholder="请输入等级"
        min={1}
        max={99}
      />
      <ProFormSelect
        name="dataScope"
        label="数据权限"
        options={[
          { label: '全部数据', value: DataScope.ALL },
          { label: '自定义', value: DataScope.CUSTOM },
          { label: '本部门', value: DataScope.DEPT },
          { label: '本部门及子部门', value: DataScope.DEPT_AND_CHILD },
          { label: '仅本人', value: DataScope.SELF },
        ]}
        rules={[{ required: true, message: '请选择数据权限' }]}
      />
      <ProFormText
        name="remark"
        label="备注"
        placeholder="请输入备注"
      />
    </DrawerForm>
  );
}
```

- [ ] **Step 2: Write MenuAssignDrawer**

Create `src/pages/Role/MenuAssignDrawer.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { Drawer, Tree, Button, Space, message } from 'antd';
import type { TreeProps } from 'antd';
import { getMenuTree } from '../../api/menu';
import { getRoleMenus, assignMenus } from '../../api/role';
import type { RoleResponse } from '../../types/role';
import type { MenuTreeNode } from '../../types/menu';

interface Props {
  record: RoleResponse | null;
  onClose: () => void;
  onSuccess: () => void;
}

function buildTreeData(nodes: MenuTreeNode[]): TreeProps['treeData'] {
  return nodes.map((node) => ({
    key: node.id,
    title: node.menuName,
    children: node.children?.length ? buildTreeData(node.children) : undefined,
  }));
}

export default function MenuAssignDrawer({ record, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<TreeProps['treeData']>([]);
  const [checkedKeys, setCheckedKeys] = useState<number[]>([]);

  useEffect(() => {
    if (!record) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [menuTreeRes, roleMenusRes] = await Promise.all([
          getMenuTree(),
          getRoleMenus(record.id),
        ]);

        if (menuTreeRes.data.code === 200) {
          setTreeData(buildTreeData(menuTreeRes.data.data));
        }

        if (roleMenusRes.data.code === 200) {
          setCheckedKeys(roleMenusRes.data.data.map((m) => m.id));
        }
      } catch (error) {
        // Error handled by interceptor
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [record]);

  const handleSubmit = async () => {
    if (!record) return;

    setLoading(true);
    try {
      const res = await assignMenus(record.id, { menuIds: checkedKeys });
      if (res.data.code === 200) {
        message.success('分配成功');
        onSuccess();
      } else {
        message.error(res.data.message);
      }
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={`分配菜单 - ${record?.roleName}`}
      open={!!record}
      onClose={onClose}
      width={500}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            确定
          </Button>
        </Space>
      }
    >
      <Tree
        checkable
        treeData={treeData}
        checkedKeys={checkedKeys}
        onCheck={(keys) => setCheckedKeys(keys as number[])}
      />
    </Drawer>
  );
}
```

---

### Task 3.12: Create Menu Management Page

**Files:**
- Create: `src/pages/Menu/index.tsx`
- Create: `src/pages/Menu/FormDrawer.tsx`

- [ ] **Step 1: Create Menu directory**

```bash
mkdir -p src/pages/Menu
```

- [ ] **Step 2: Write Menu list page with tree table**

Create `src/pages/Menu/index.tsx`:

```typescript
import { useRef, useState } from 'react';
import { ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { getMenuTree, deleteMenu } from '../../api/menu';
import type { MenuTreeNode } from '../../types/menu';
import Permission from '../../components/Permission';
import FormDrawer from './FormDrawer';

export default function MenuPage() {
  const actionRef = useRef<ActionType>();
  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<MenuTreeNode | null>(null);

  const handleDelete = async (id: number) => {
    try {
      const res = await deleteMenu(id);
      if (res.data.code === 200 || res.data.code === 204) {
        message.success('删除成功');
        actionRef.current?.reload();
        return;
      }
      message.error(res.data.message);
    } catch (error) {
      // Error handled by interceptor
    }
  };

  const columns: ProColumns<MenuTreeNode>[] = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '菜单名称', dataIndex: 'menuName', width: 200 },
    { title: '菜单编码', dataIndex: 'menuCode' },
    {
      title: '类型',
      dataIndex: 'menuType',
      width: 80,
      render: (_, record) => {
        const typeMap = { DIR: '目录', MENU: '菜单', BUTTON: '按钮' };
        const colorMap = { DIR: 'blue', MENU: 'green', BUTTON: 'orange' };
        return (
          <Tag color={colorMap[record.menuType]}>
            {typeMap[record.menuType]}
          </Tag>
        );
      },
    },
    { title: '路径', dataIndex: 'path', ellipsis: true },
    { title: '权限码', dataIndex: 'perms', ellipsis: true },
    { title: '图标', dataIndex: 'icon', width: 100 },
    { title: '排序', dataIndex: 'sortOrder', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (_, record) =>
        record.status === 1 ? (
          <Tag color="success">启用</Tag>
        ) : (
          <Tag>禁用</Tag>
        ),
    },
    {
      title: '操作',
      valueType: 'option',
      width: 150,
      render: (_, record) => [
        <Permission key="edit" code="menu:edit">
          <a onClick={() => { setEditRecord(record); setFormOpen(true); }}>
            编辑
          </a>
        </Permission>,
        <Permission key="del" code="menu:delete">
          <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
            <a>删除</a>
          </Popconfirm>
        </Permission>,
      ],
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <ProTable<MenuTreeNode>
        columns={columns}
        actionRef={actionRef}
        rowKey="id"
        search={false}
        request={async () => {
          try {
            const { data } = await getMenuTree();
            return {
              data: data.data,
              success: true,
            };
          } catch (error) {
            return { data: [], success: false };
          }
        }}
        toolbar={{
          actions: [
            <Permission key="add" code="menu:add">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => { setEditRecord(null); setFormOpen(true); }}
              >
                新建菜单
              </Button>
            </Permission>,
          ],
        }}
        pagination={false}
        expandable={{ defaultExpandAllRows: true }}
      />

      <FormDrawer
        open={formOpen}
        record={editRecord}
        onClose={() => { setFormOpen(false); setEditRecord(null); }}
        onSuccess={() => {
          setFormOpen(false);
          setEditRecord(null);
          actionRef.current?.reload();
        }}
      />
    </div>
  );
}
```

- [ ] **Step 3: Write FormDrawer for menu**

Create `src/pages/Menu/FormDrawer.tsx`:

```typescript
import { useEffect, useState } from 'react';
import {
  DrawerForm,
  ProFormText,
  ProFormSelect,
  ProFormDigit,
  ProFormRadio,
  ProFormTreeSelect,
} from '@ant-design/pro-components';
import { message } from 'antd';
import { createMenu, updateMenu, getMenuTree } from '../../api/menu';
import type { MenuTreeNode, MenuCreateRequest, MenuUpdateRequest } from '../../types/menu';
import { MenuType } from '../../types/enums';

interface Props {
  open: boolean;
  record: MenuTreeNode | null;
  onClose: () => void;
  onSuccess: () => void;
}

function buildTreeSelectData(nodes: MenuTreeNode[], excludeId?: number): any[] {
  return nodes
    .filter((node) => node.id !== excludeId)
    .map((node) => ({
      value: node.id,
      title: node.menuName,
      children: node.children?.length
        ? buildTreeSelectData(node.children, excludeId)
        : undefined,
    }));
}

export default function FormDrawer({ open, record, onClose, onSuccess }: Props) {
  const [menuTree, setMenuTree] = useState<any[]>([]);

  useEffect(() => {
    if (open) {
      getMenuTree().then((res) => {
        if (res.data.code === 200) {
          setMenuTree(buildTreeSelectData(res.data.data, record?.id));
        }
      });
    }
  }, [open, record]);

  const handleSubmit = async (values: MenuCreateRequest | MenuUpdateRequest) => {
    try {
      const res = record
        ? await updateMenu(record.id, values)
        : await createMenu(values as MenuCreateRequest);

      if (res.data.code === 200 || res.data.code === 201) {
        message.success(record ? '更新成功' : '创建成功');
        onSuccess();
        return true;
      }
      message.error(res.data.message);
      return false;
    } catch (error) {
      return false;
    }
  };

  return (
    <DrawerForm
      title={record ? '编辑菜单' : '新建菜单'}
      open={open}
      onOpenChange={(visible) => !visible && onClose()}
      onFinish={handleSubmit}
      initialValues={
        record || { menuType: MenuType.MENU, visible: true, status: 1, sortOrder: 1 }
      }
    >
      <ProFormTreeSelect
        name="parentId"
        label="上级菜单"
        placeholder="不选则为顶级菜单"
        allowClear
        fieldProps={{ treeData: menuTree, showSearch: true, treeNodeFilterProp: 'title' }}
      />
      <ProFormText
        name="menuName"
        label="菜单名称"
        placeholder="请输入菜单名称"
        rules={[{ required: true, message: '请输入菜单名称' }]}
      />
      {!record && (
        <ProFormText
          name="menuCode"
          label="菜单编码"
          placeholder="请输入菜单编码"
          rules={[{ required: true, message: '请输入菜单编码' }]}
        />
      )}
      <ProFormSelect
        name="menuType"
        label="菜单类型"
        options={[
          { label: '目录', value: MenuType.DIR },
          { label: '菜单', value: MenuType.MENU },
          { label: '按钮', value: MenuType.BUTTON },
        ]}
        rules={[{ required: true, message: '请选择菜单类型' }]}
      />
      <ProFormText name="path" label="路由路径" placeholder="请输入路由路径" />
      <ProFormText name="component" label="组件路径" placeholder="如: User/List" />
      <ProFormText name="perms" label="权限码" placeholder="如: user:list" />
      <ProFormText name="icon" label="图标" placeholder="如: UserOutlined" />
      <ProFormDigit name="sortOrder" label="排序" min={0} />
      <ProFormRadio.Group
        name="visible"
        label="是否可见"
        options={[
          { label: '是', value: true },
          { label: '否', value: false },
        ]}
      />
      <ProFormRadio.Group
        name="status"
        label="状态"
        options={[
          { label: '启用', value: 1 },
          { label: '禁用', value: 0 },
        ]}
      />
      <ProFormText name="remark" label="备注" placeholder="请输入备注" />
    </DrawerForm>
  );
}
```

---

### Task 3.13: Commit Layer 3

**Files:**
- All files created/modified in Layer 3

- [ ] **Step 1: Stage all Layer 3 changes**

```bash
git add src/components/ src/layouts/ src/pages/
```

- [ ] **Step 2: Commit Layer 3**

```bash
git commit -m "$(cat <<'EOF'
feat: 界面呈现层 - components, layouts, pages

- Add Permission wrapper component for button-level access control
- Update AdminLayout to render dynamic menu from store
- Add BlankLayout for public pages
- Update Login page with email field and /users/me call
- Update Home page to display user info
- Add Profile page with info and password tabs
- Add User management page with CRUD and role assignment
- Add Role management page with menu assignment tree
- Add Menu management page with tree table
- Add Forbidden (403) page
- Add comprehensive permission checks on all action buttons
- Add user experience enhancements (confirmations, messages)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
EOF
)"
```

---

## Post-Implementation

### Task Final: Verify TypeScript Compilation

**Files:**
- None (verification only)

- [ ] **Step 1: Run TypeScript compiler check**

```bash
npm run build
```

Expected: Build succeeds with no errors

---

## Summary

This plan implements a complete RBAC system in three progressive layers:

**Layer 1 (Foundation):**
- 13 tasks creating types, constants, and utilities
- Delivers complete type system and tooling

**Layer 2 (Business Logic):**
- 16 tasks implementing API, state, routing, and hooks
- Delivers complete data flow and access control

**Layer 3 (Presentation):**
- 13 tasks building UI components, layouts, and pages
- Delivers complete admin interface

**Total:** 42 implementation tasks + 1 setup + 1 verification = 44 tasks
**Commits:** 3 (one per layer)
**Branch:** `feat/rbac-refactor`

Each task is focused on creating or modifying specific files with complete code provided. No placeholders, no ambiguity.
