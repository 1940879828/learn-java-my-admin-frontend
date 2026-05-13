# 前端重构与 RBAC 接入方案

> 配合后端 `learn-java-jwt-java-eight` 完成 38 个 commit 重构（路径 `/auth/**` → `/api/v1/**`，新增完整用户/角色/菜单 CRUD、`/users/me` 等）之后，本前端项目（`antd-admin`）需做的对齐重构与 RBAC 接入规划。
>
> 日期：2026-05-13
> 目标读者：前端实现者（人/AI 均可）

---

## 目录

1. [现状盘点](#1-现状盘点)
2. [后端变化点对照](#2-后端变化点对照)
3. [目标架构](#3-目标架构)
4. [文件结构调整](#4-文件结构调整)
5. [类型层重构](#5-类型层重构)
6. [API 层重构](#6-api-层重构)
7. [状态层重构](#7-状态层重构)
8. [路由层与 RBAC 守卫](#8-路由层与-rbac-守卫)
9. [UI 层与权限组件](#9-ui-层与权限组件)
10. [新增页面规划](#10-新增页面规划)
11. [关键实现示例](#11-关键实现示例)
12. [实施路线图（分阶段）](#12-实施路线图分阶段)
13. [风险清单](#13-风险清单)

---

## 1. 现状盘点

**技术栈**：
- React 19.2 + TypeScript 6 + Vite 8
- Ant Design 6.3 + `@ant-design/pro-components` 3.1.12-0
- `react-router-dom` 7.14
- `zustand` 5.0
- `axios` 1.16
- `babel-plugin-react-compiler` 已启用（React Compiler）

**现状代码结构**：
```
src/
├── api/
│   ├── auth.ts        # 仅 login/register/logout/unlockUser
│   └── request.ts     # axios 实例 + 401 refresh 队列
├── layouts/
│   └── AdminLayout.tsx  # 硬编码菜单（仅首页）
├── pages/
│   ├── Home/          # 静态欢迎页
│   ├── Login/         # 用 LoginFormPage + 注册弹窗
│   └── NotFound/
├── router/
│   ├── AuthRoute.tsx  # 仅 token 是否存在的守卫
│   └── index.tsx      # 静态 3 路由
├── store/
│   └── useAuthStore.ts  # accessToken + refreshToken + username
├── types/
│   └── auth.ts        # LoginRequest/RegisterRequest/Result<T>
├── App.tsx
└── main.tsx
```

**关键问题**：
- ❌ 完全没有 RBAC：无角色、权限、菜单概念
- ❌ 菜单硬编码在 `AdminLayout.tsx`，无法按角色显示
- ❌ 路由守卫只判断 `accessToken` 存在，不判断权限
- ❌ API 路径全部用 `/auth/*`（后端已迁移到 `/api/v1/auth/*`）
- ❌ `RegisterRequest` 缺 `email`（后端已强制要求）
- ❌ `Result<T>` 类型缺 `traceId` / `timestamp`（后端已返回）
- ❌ vite proxy 把 `/api` rewrite 成 `''`，与后端 `/api/v1` 前缀冲突
- ❌ refresh token 路径 `/auth/refresh` 已失效（应为 `/api/v1/auth/refresh`）
- ❌ `useAuthStore` 直接读 `localStorage` + 手写持久化，未用 `zustand/middleware/persist`

---

## 2. 后端变化点对照

| 维度 | 旧 | 新 | 前端影响 |
|------|---|---|---------|
| 全局前缀 | `/auth/**` + `/api/**` | `/api/v1/**` | vite proxy / axios baseURL |
| 登录 | `POST /auth/login` | `POST /api/v1/auth/login` | api/auth.ts |
| 刷新 | `POST /auth/refresh` | `POST /api/v1/auth/refresh` | request.ts 拦截器 |
| 登出 | `POST /auth/logout` + body | `POST /api/v1/auth/logout`（无 body，凭 token） | api/auth.ts |
| 注册 | username + password | username + password + **email**（必填）| RegisterRequest 类型、注册表单 |
| 解锁 | `POST /auth/unlock/{userId}` | `POST /api/v1/users/{id}/unlock` 或 `POST /api/v1/auth/unlock/{userId}` 二选一 | api/user.ts |
| 当前用户 | （无）| `GET /api/v1/users/me` | 启动时拉取，初始化 RBAC 状态 |
| 改密 | （无）| `PUT /api/v1/users/me/password` | 个人中心页 |
| 用户管理 | （无）| `GET/POST/PUT/DELETE /api/v1/users` + 分页 + 过滤 | 用户管理页 |
| 角色管理 | （无）| `GET/POST/PUT/DELETE /api/v1/roles` + 分页 + 菜单绑定 + 用户反查 | 角色管理页 |
| 菜单管理 | （无）| `GET/POST/PUT/DELETE /api/v1/menus` + `GET /menus/tree` + 角色反查 | 菜单管理页 |
| 关联管理 | POST 覆盖式赋值 | `PUT` 覆盖、`POST` 追加、`DELETE` 解绑 | API 调用语义 |
| 错误响应 | `{code,message,data}` | `{code,message,data,traceId,timestamp}` + 粒度错误码（5 位） | Result 类型、错误提示 |
| 状态码 | 全部 200 | `201 Created` / `204 No Content` / `4xx`/`5xx` | 拦截器逻辑 |
| Trace ID | 无 | `X-Trace-Id` 响应头（链路追踪） | 用于异常上报 |

---

## 3. 目标架构

```
┌─────────────────────────────────────────────────────────────────┐
│                          App.tsx                                │
│  ConfigProvider + RouterProvider                                │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Bootstrap Layer                           │
│   • 启动时拉取 GET /users/me                                    │
│   • 把 roles/permissions/menuTree 注入 store                    │
│   • 根据 menuTree 动态生成 router 子树                          │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Guard Layer                               │
│   • AuthGuard       —— 是否已登录                               │
│   • PermissionGuard —— 路由级权限码校验                         │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Layout Layer                              │
│   • AdminLayout（ProLayout）从 store 读 menuTree 渲染侧边栏    │
│   • UserDropdown 读 store.user 显示头像/角色/退出/改密         │
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Page Layer                                │
│   登录 | 首页 | 用户管理 | 角色管理 | 菜单管理 | 个人中心      │
│   按钮级权限：<Permission code="user:add"><Button/></Permission>│
└─────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│  API Layer  •  Request Interceptor                              │
│   axios + token 注入 + 401 refresh + 403/423 提示 + traceId 上报│
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. 文件结构调整

```
src/
├── api/
│   ├── request.ts          # 拦截器（更新 refresh 路径）
│   ├── auth.ts             # 登录/注册/刷新/登出
│   ├── user.ts             # 用户 CRUD + me + 改密 + 锁定/解锁
│   ├── role.ts             # 角色 CRUD + 菜单绑定 + 用户反查
│   ├── menu.ts             # 菜单 CRUD + tree + 角色反查
│   └── index.ts            # 统一 re-export
├── components/             # 【新增】
│   ├── Permission/         # <Permission code="..."> 权限包裹组件
│   ├── PageContainer/      # 统一页头/面包屑/按钮区
│   └── icons/              # 动态图标映射（菜单 icon string → ReactNode）
├── hooks/                  # 【新增】
│   ├── usePermission.ts    # 判断当前用户是否有指定权限
│   ├── useUserMenu.ts      # 当前用户菜单树（已转 MenuDataItem）
│   └── useBootstrap.ts     # 应用启动加载 me + 初始化 store
├── layouts/
│   ├── AdminLayout.tsx     # 从 store 读菜单
│   └── BlankLayout.tsx     # 【新增】登录/404 用
├── pages/
│   ├── Login/
│   ├── Home/               # 重写为 Dashboard
│   ├── User/               # 【新增】用户管理（list + form drawer）
│   ├── Role/               # 【新增】角色管理（list + menu-tree drawer）
│   ├── Menu/               # 【新增】菜单管理（tree table）
│   ├── Profile/            # 【新增】个人中心（info + change password）
│   ├── Forbidden/          # 【新增】403 页
│   └── NotFound/
├── router/
│   ├── index.tsx           # 静态根路由
│   ├── guards/
│   │   ├── AuthGuard.tsx           # 替换原 AuthRoute
│   │   ├── PermissionGuard.tsx     # 【新增】
│   │   └── BootstrapGuard.tsx      # 【新增】首次加载 /me
│   ├── staticRoutes.tsx    # 内置路由（登录、403、404、个人中心）
│   └── buildRoutes.ts      # 把后端 menuTree → RouteObject[]
├── store/
│   ├── useAuthStore.ts     # tokens 持久化（用 zustand persist）
│   ├── useUserStore.ts     # 【新增】user/roles/permissions/menuTree
│   └── useAppStore.ts      # 【新增】loading/collapsed/locale 等 UI 态
├── types/
│   ├── common.ts           # 【新增】Result<T>, PageRequest, PageResponse<T>, ErrorCode
│   ├── auth.ts             # LoginRequest/Response, RefreshRequest, RegisterRequest
│   ├── user.ts             # UserCreate/Update/Response/Detail, ChangePassword
│   ├── role.ts             # RoleCreate/Update/Response, AssignMenus
│   ├── menu.ts             # MenuCreate/Update/Response, MenuTreeNode
│   └── enums.ts            # DataScope, MenuType
├── utils/
│   ├── permission.ts       # hasPermission(code), hasAnyPermission(...)
│   ├── tree.ts             # menuTree → flat / flat → tree 工具
│   ├── iconMap.tsx         # antd icon 名 → 组件 映射
│   └── errorCode.ts        # 错误码 → 用户友好文案
├── constants/
│   ├── api.ts              # API 路径常量
│   └── permissions.ts      # 前端用到的权限码集中定义
├── App.tsx
└── main.tsx
```

---

## 5. 类型层重构

### 5.1 `types/common.ts`

```ts
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

/** 与后端 ErrorCode 枚举一一对应，便于细化处理 */
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

### 5.2 `types/auth.ts`

```ts
export interface LoginRequest { username: string; password: string; }
export interface RegisterRequest {
  username: string;
  password: string;
  email: string;        // 后端新加，必填
  phone?: string;       // 可选
}
export interface RefreshRequest { refreshToken: string; }
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}
```

### 5.3 `types/user.ts`

```ts
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
  status: number;        // 0 禁用 / 1 启用
  locked: boolean;
  lockTime?: string;
  createTime: string;
  remark?: string;
}

export interface UserDetailResponse extends UserResponse {
  roles: RoleResponse[];
  permissions: string[];      // 扁平化权限码集合
  menuTree: MenuTreeNode[];   // 用户可见菜单树
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

### 5.4 `types/role.ts`

```ts
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

### 5.5 `types/menu.ts`

```ts
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

### 5.6 `types/enums.ts`

```ts
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

## 6. API 层重构

### 6.1 `vite.config.ts` 修正代理

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',  // 与后端 server.port 对齐
      changeOrigin: true,
      // 删除 rewrite —— 后端就是以 /api/v1 开头
    },
  },
},
```

> ⚠️ 后端 `application.yml` 默认 `server.port: 8080`，确认后调整。

### 6.2 `constants/api.ts`

```ts
const V1 = '/api/v1';

export const API = {
  auth: {
    login:    `${V1}/auth/login`,
    register: `${V1}/auth/register`,
    refresh:  `${V1}/auth/refresh`,
    logout:   `${V1}/auth/logout`,
  },
  user: {
    list:    `${V1}/users`,
    detail:  (id: number) => `${V1}/users/${id}`,
    create:  `${V1}/users`,
    update:  (id: number) => `${V1}/users/${id}`,
    remove:  (id: number) => `${V1}/users/${id}`,
    roles:   (id: number) => `${V1}/users/${id}/roles`,
    role:    (id: number, roleId: number) => `${V1}/users/${id}/roles/${roleId}`,
    lock:    (id: number) => `${V1}/users/${id}/lock`,
    unlock:  (id: number) => `${V1}/users/${id}/unlock`,
    resetPw: (id: number) => `${V1}/users/${id}/password:reset`,
    me:           `${V1}/users/me`,
    myPassword:   `${V1}/users/me/password`,
  },
  role: {
    list:    `${V1}/roles`,
    detail:  (id: number) => `${V1}/roles/${id}`,
    create:  `${V1}/roles`,
    update:  (id: number) => `${V1}/roles/${id}`,
    remove:  (id: number) => `${V1}/roles/${id}`,
    menus:   (id: number) => `${V1}/roles/${id}/menus`,
    menu:    (id: number, menuId: number) => `${V1}/roles/${id}/menus/${menuId}`,
    users:   (id: number) => `${V1}/roles/${id}/users`,
  },
  menu: {
    list:    `${V1}/menus`,
    tree:    `${V1}/menus/tree`,
    detail:  (id: number) => `${V1}/menus/${id}`,
    create:  `${V1}/menus`,
    update:  (id: number) => `${V1}/menus/${id}`,
    remove:  (id: number) => `${V1}/menus/${id}`,
    roles:   (id: number) => `${V1}/menus/${id}/roles`,
  },
} as const;
```

### 6.3 `api/request.ts` 改造点

```ts
const REFRESH_TOKEN_PATH = '/api/v1/auth/refresh';   // 改路径

// 响应拦截器新增 403 / 423 / 429 分支
case 403:
  if (!cfg._skipErrorHandler) message.error(`无权限访问 (traceId: ${data?.traceId ?? 'n/a'})`);
  break;
case 423:
  Modal.error({ title: '账户已被锁定', content: data?.message || '请联系管理员' });
  break;
case 429:
  message.warning('操作过于频繁，请稍后再试');
  break;
```

并把响应头中的 `X-Trace-Id` 暴露给业务层（必要时上报 Sentry/前端日志）。

### 6.4 拆分后的 `api/auth.ts`

```ts
import request from './request';
import { API } from '../constants/api';
import type {
  LoginRequest, LoginResponse, RegisterRequest, RefreshRequest,
} from '../types/auth';
import type { Result } from '../types/common';

export const login    = (data: LoginRequest)    => request.post<Result<LoginResponse>>(API.auth.login, data);
export const register = (data: RegisterRequest) => request.post<Result<void>>(API.auth.register, data);
export const refresh  = (data: RefreshRequest)  => request.post<Result<LoginResponse>>(API.auth.refresh, data);
export const logout   = ()                       => request.post<Result<void>>(API.auth.logout);
```

`api/user.ts`、`api/role.ts`、`api/menu.ts` 按 `constants/api.ts` 同样模式封装，**禁止在业务代码里手写 URL 字符串**。

---

## 7. 状态层重构

### 7.1 `store/useAuthStore.ts` 用 zustand persist

```ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (a: string, r: string) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      clear:     () => set({ accessToken: null, refreshToken: null }),
    }),
    { name: 'auth', storage: createJSONStorage(() => localStorage) },
  ),
);
```

### 7.2 `store/useUserStore.ts`（新增 RBAC 状态）

```ts
import { create } from 'zustand';
import type { UserDetailResponse } from '../types/user';
import type { MenuTreeNode } from '../types/menu';

interface UserState {
  user: UserDetailResponse | null;
  permissions: Set<string>;       // O(1) 查询
  menuTree: MenuTreeNode[];
  loaded: boolean;
  setUser: (u: UserDetailResponse) => void;
  reset:   () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  permissions: new Set(),
  menuTree: [],
  loaded: false,
  setUser: (u) => set({
    user: u,
    permissions: new Set(u.permissions),
    menuTree: u.menuTree,
    loaded: true,
  }),
  reset: () => set({ user: null, permissions: new Set(), menuTree: [], loaded: false }),
}));
```

> 关键：**`username` 不再单独存 localStorage**——所有用户信息都由 `/users/me` 提供，避免脏数据。

---

## 8. 路由层与 RBAC 守卫

### 8.1 三段式守卫

```
/login  ────────────────────────  无守卫
                                  │
              ┌───────────────────┴───────────────────┐
              ▼                                       ▼
         AuthGuard                              静态路由
              │  (有 accessToken)               (403, 404, /profile)
              ▼
        BootstrapGuard
              │  (调用 /users/me → setUser)
              ▼
        AdminLayout
              │
              ▼
      ┌───────┴───────┐
      ▼               ▼
PermissionGuard    PermissionGuard
   (perm码A)         (perm码B)
      │               │
      ▼               ▼
   页面 A           页面 B
```

### 8.2 `router/guards/AuthGuard.tsx`

```tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export default function AuthGuard() {
  const hasToken = useAuthStore((s) => !!s.accessToken);
  const loc = useLocation();
  if (!hasToken) {
    return <Navigate to={`/login?from=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  }
  return <Outlet />;
}
```

### 8.3 `router/guards/BootstrapGuard.tsx`

```tsx
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
        if (res.data.code === 200 && res.data.data) setUser(res.data.data);
        else useAuthStore.getState().clear();
      })
      .catch(() => useAuthStore.getState().clear());
  }, [loaded, setUser]);

  if (!loaded) {
    return <Spin spinning fullscreen tip="加载中..." />;
  }
  return <Outlet />;
}
```

### 8.4 `router/guards/PermissionGuard.tsx`

```tsx
import { Navigate, Outlet } from 'react-router-dom';
import { usePermission } from '../../hooks/usePermission';

interface Props { code?: string; codes?: string[]; mode?: 'all' | 'any'; }

export default function PermissionGuard({ code, codes, mode = 'any' }: Props) {
  const { has, hasAll, hasAny } = usePermission();
  const ok = code ? has(code) : (mode === 'all' ? hasAll(codes!) : hasAny(codes!));
  return ok ? <Outlet /> : <Navigate to="/403" replace />;
}
```

### 8.5 `router/buildRoutes.ts`（动态路由生成器）

```ts
import type { RouteObject } from 'react-router-dom';
import { lazy } from 'react';
import type { MenuTreeNode } from '../types/menu';
import PermissionGuard from './guards/PermissionGuard';

const componentRegistry: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'User/List':    lazy(() => import('../pages/User')),
  'Role/List':    lazy(() => import('../pages/Role')),
  'Menu/List':    lazy(() => import('../pages/Menu')),
  'Home':         lazy(() => import('../pages/Home')),
  'Profile':      lazy(() => import('../pages/Profile')),
};

export function buildRoutes(menuTree: MenuTreeNode[]): RouteObject[] {
  const result: RouteObject[] = [];

  const walk = (nodes: MenuTreeNode[], parentPath = '') => {
    nodes.forEach((node) => {
      if (node.menuType === 'BUTTON' || !node.path) return;
      const fullPath = node.path.startsWith('/') ? node.path : `${parentPath}/${node.path}`;
      const Component = node.component ? componentRegistry[node.component] : null;

      if (Component) {
        result.push({
          path: fullPath,
          element: node.perms ? <PermissionGuard code={node.perms} /> : undefined,
          children: [{ index: true, element: <Component /> }],
        });
      }
      if (node.children?.length) walk(node.children, fullPath);
    });
  };

  walk(menuTree);
  return result;
}
```

### 8.6 `router/index.tsx` 重构骨架

```tsx
import { createBrowserRouter, Outlet } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import AuthGuard from './guards/AuthGuard';
import BootstrapGuard from './guards/BootstrapGuard';
import AdminLayout from '../layouts/AdminLayout';
import LoginPage from '../pages/Login';
import NotFoundPage from '../pages/NotFound';
import ForbiddenPage from '../pages/Forbidden';
import ProfilePage from '../pages/Profile';
import { buildRoutes } from './buildRoutes';

function ProtectedRoot() {
  const menuTree = useUserStore((s) => s.menuTree);
  const dynamicRoutes = buildRoutes(menuTree);
  return <Outlet />;   // 这里仅作 outlet；动态子路由在下面拼接
}

const router = createBrowserRouter([
  { path: '/login',  element: <LoginPage /> },
  { path: '/403',    element: <ForbiddenPage /> },
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
              // 动态路由由 useUserStore 拉取后注入（见下）
              ...buildDynamicRoutes(),
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
```

> ⚠️ React Router 7 的 `createBrowserRouter` 在创建后是不可变的。两种应对方案：
>
> 1. **响应式 Router**：在 `App` 中根据 `menuTree` 重新 `createBrowserRouter`，用 `key` 强制重渲染 `RouterProvider`。
> 2. **路由懒注册**：用 `<Route>` API（Routes/Route）替代 createBrowserRouter，运行时直接读 store 渲染 `<Route>` 子集。
>
> 推荐方案 1，简洁明了。示例见 [§11.3](#113-动态-router-的-bootstrap-写法)。

---

## 9. UI 层与权限组件

### 9.1 `components/Permission/index.tsx`

```tsx
import type { ReactNode } from 'react';
import { usePermission } from '../../hooks/usePermission';

interface Props {
  code?: string;
  codes?: string[];
  mode?: 'all' | 'any';
  fallback?: ReactNode;     // 无权限时显示什么（默认 null）
  children: ReactNode;
}

export default function Permission({ code, codes, mode = 'any', fallback = null, children }: Props) {
  const { has, hasAll, hasAny } = usePermission();
  const ok = code ? has(code) : (mode === 'all' ? hasAll(codes ?? []) : hasAny(codes ?? []));
  return <>{ok ? children : fallback}</>;
}
```

**使用：**

```tsx
<Permission code="user:add">
  <Button type="primary" onClick={openCreate}>新建用户</Button>
</Permission>

<Permission codes={['user:edit', 'user:delete']} mode="any">
  <Dropdown menu={{ items: actions }}><Button>更多操作</Button></Dropdown>
</Permission>
```

### 9.2 `hooks/usePermission.ts`

```ts
import { useUserStore } from '../store/useUserStore';

export function usePermission() {
  const permissions = useUserStore((s) => s.permissions);

  return {
    has:    (code: string)        => permissions.has(code),
    hasAny: (codes: string[])     => codes.some((c) => permissions.has(c)),
    hasAll: (codes: string[])     => codes.every((c) => permissions.has(c)),
  };
}
```

### 9.3 `utils/iconMap.tsx`（动态图标）

```tsx
import {
  HomeOutlined, UserOutlined, TeamOutlined, MenuOutlined,
  SettingOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';

const map: Record<string, ReactNode> = {
  HomeOutlined: <HomeOutlined />,
  UserOutlined: <UserOutlined />,
  TeamOutlined: <TeamOutlined />,
  MenuOutlined: <MenuOutlined />,
  SettingOutlined: <SettingOutlined />,
  AppstoreOutlined: <AppstoreOutlined />,
};

export const getIcon = (name?: string): ReactNode => (name ? map[name] : undefined);
```

### 9.4 `layouts/AdminLayout.tsx` 用 menuTree 驱动

```tsx
import { useMemo } from 'react';
import { ProLayout } from '@ant-design/pro-components';
import type { MenuDataItem } from '@ant-design/pro-components';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import { getIcon } from '../utils/iconMap';

function toMenuDataItems(nodes: typeof useUserStore extends never ? never : any[]): MenuDataItem[] {
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
  const menuTree = useUserStore((s) => s.menuTree);
  const route = useMemo(() => ({ path: '/', routes: toMenuDataItems(menuTree) }), [menuTree]);

  return (
    <ProLayout
      title="Antd Admin"
      route={route}
      location={location}
      layout="mix"
      menuItemRender={(item, dom) => <Link to={item.path ?? '/'}>{dom}</Link>}
      /* ... avatar / logout dropdown ... */
    >
      <Outlet />
    </ProLayout>
  );
}
```

---

## 10. 新增页面规划

| 页面 | 路径 | 主要组件 | 权限 |
|------|------|---------|------|
| 首页 / Dashboard | `/` | 卡片 + Statistic + 时间轴 | 已登录即可 |
| 个人中心 | `/profile` | Tabs（基本信息 / 修改密码） | 已登录 |
| 用户管理 | `/system/users` | ProTable + Drawer（创建/编辑） + Modal（分配角色） | `user:list` |
| 角色管理 | `/system/roles` | ProTable + Drawer（创建/编辑） + Drawer（分配菜单 Tree） | `role:list` |
| 菜单管理 | `/system/menus` | ProTable 树形展示 + Drawer（创建/编辑） | `menu:list` |
| 403 | `/403` | Result 组件 | 公开 |
| 404 | `*` | Result 组件 | 公开 |

每个管理页统一：
- **顶部筛选区**：ProForm.QueryFilter
- **操作按钮区**：用 `<Permission>` 包裹「新建」「批量删除」
- **表格列**：操作列按权限码渲染「编辑」「删除」「分配角色」等按钮
- **抽屉/弹窗**：用 ProForm + 后端 DTO 校验规则同步

### 10.1 用户管理示意

```tsx
<Permission code="user:add">
  <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建用户</Button>
</Permission>

<ProTable
  rowKey="id"
  request={async (params) => {
    const { data } = await listUsers({
      page: params.current, size: params.pageSize,
      keyword: params.keyword,
    });
    return { data: data.data.items, total: data.data.total, success: true };
  }}
  columns={[
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '用户名', dataIndex: 'username' },
    { title: '邮箱', dataIndex: 'email' },
    { title: '状态', dataIndex: 'status', valueEnum: { 0: '禁用', 1: '启用' } },
    {
      title: '操作', valueType: 'option',
      render: (_, record) => [
        <Permission key="edit" code="user:edit"><a onClick={() => openEdit(record)}>编辑</a></Permission>,
        <Permission key="role" code="user:edit"><a onClick={() => openRoleAssign(record)}>分配角色</a></Permission>,
        <Permission key="lock" code="user:edit">
          <a onClick={() => record.locked ? unlock(record.id) : lock(record.id)}>
            {record.locked ? '解锁' : '锁定'}
          </a>
        </Permission>,
        <Permission key="del" code="user:delete">
          <Popconfirm onConfirm={() => remove(record.id)}><a>删除</a></Popconfirm>
        </Permission>,
      ],
    },
  ]}
/>
```

---

## 11. 关键实现示例

### 11.1 启动加载流程

```
浏览器打开
   │
   ▼
读取 localStorage.auth (zustand persist)
   │
   ├─ 没 token ──► /login
   │
   └─ 有 token ──► AuthGuard 通过
                   │
                   ▼
                BootstrapGuard 调用 GET /users/me
                   │
                   ├─ 200 ──► setUser(...) ──► 渲染 AdminLayout + 动态路由
                   │
                   └─ 401 ──► clear ──► /login
                   └─ 5xx ──► /login 并提示
```

### 11.2 401 刷新流程（与现有保持，仅改路径）

```
任意 API 拿到 401
   │
   ▼
有 refreshToken？
   ├─ 没 ──► 清状态，跳转 /login
   │
   └─ 有 ──► isRefreshing ?
              ├─ 是 ──► 入队等新 token
              │
              └─ 否 ──► 调 POST /api/v1/auth/refresh
                        │
                        ├─ 200 ──► setTokens, drain 队列, 重发原请求
                        │
                        └─ 4xx/5xx ──► 清状态, drain 队列(失败), 跳转 /login
```

### 11.3 动态 Router 的 Bootstrap 写法

```tsx
// App.tsx
import { useMemo } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useUserStore } from './store/useUserStore';
import { createAppRouter } from './router';

export default function App() {
  const menuTree = useUserStore((s) => s.menuTree);
  const router = useMemo(() => createAppRouter(menuTree), [menuTree]);
  return <RouterProvider router={router} key={menuTree.length} />;
}
```

`router/index.tsx` 导出工厂函数 `createAppRouter(menuTree)` 而非单例。

> 副作用：menuTree 改变（如管理员动态调整自己角色的菜单）会触发整树重建，能接受。

### 11.4 登录成功 → 拉取 me → 跳转

```tsx
// pages/Login/index.tsx
const handleLogin = async (values: LoginValues) => {
  const res = await login(values);
  if (res.data.code !== 200 || !res.data.data) return false;

  useAuthStore.getState().setTokens(
    res.data.data.accessToken,
    res.data.data.refreshToken,
  );

  // 立即拉取 /users/me 填充 RBAC
  const me = await getCurrentUser();
  if (me.data.code === 200 && me.data.data) {
    useUserStore.getState().setUser(me.data.data);
  }

  const from = new URLSearchParams(location.search).get('from') || '/';
  navigate(from, { replace: true });
  return true;
};
```

### 11.5 登出全清

```tsx
const handleLogout = async () => {
  try { await logout(); } catch { /* 忽略 */ }
  useAuthStore.getState().clear();
  useUserStore.getState().reset();
  navigate('/login', { replace: true });
};
```

---

## 12. 实施路线图（分阶段）

> 每个阶段可独立合并，不破坏既有功能。

### 阶段 0 · 准备（0.5 天）

- [ ] `pnpm install` 确保依赖完整
- [ ] 备份当前工作分支，新建 `feat/rbac-refactor`
- [ ] 写本文档（已完成 ✅）

### 阶段 1 · 基础对齐（0.5-1 天）

- [ ] 修复 `vite.config.ts` 代理（去掉 rewrite）
- [ ] 创建 `constants/api.ts`
- [ ] 拆分 `types/` 目录（common/auth/user/role/menu/enums）
- [ ] 更新 `RegisterRequest` 加 `email` 必填
- [ ] 更新 `Result<T>` 加 `traceId/timestamp` 可选字段
- [ ] 改 `api/request.ts` 的 refresh 路径
- [ ] 改 `api/auth.ts` 全部路径走 `API.auth.*`
- [ ] 更新登录/注册页表单字段
- [ ] 自测：登录 → 跳首页 → 登出 → 跳登录

### 阶段 2 · API 与状态（1 天）

- [ ] 新增 `api/user.ts`、`api/role.ts`、`api/menu.ts`
- [ ] 引入 `zustand/middleware/persist` 改造 `useAuthStore`
- [ ] 新增 `useUserStore`
- [ ] 添加 401/403/423/429 拦截器分支
- [ ] `utils/errorCode.ts` 错误码 → 文案映射

### 阶段 3 · RBAC 核心（1.5 天）

- [ ] 新增 `hooks/usePermission.ts`
- [ ] 新增 `components/Permission/`
- [ ] 新增 `router/guards/AuthGuard/BootstrapGuard/PermissionGuard`
- [ ] 重写 `router/index.tsx` 为工厂模式
- [ ] 实现 `router/buildRoutes.ts`
- [ ] `App.tsx` 改用 `useMemo` + 动态 router
- [ ] `AdminLayout.tsx` 改为从 store 读 menuTree
- [ ] `utils/iconMap.tsx`
- [ ] 新增 `pages/Forbidden/index.tsx` (403)
- [ ] 登录后调用 `/users/me`，store 注入完成后再跳转

### 阶段 4 · 业务页面（2-3 天，可并行）

- [ ] 用户管理页（list / drawer 创建 / drawer 编辑 / 分配角色 modal / 锁定 / 重置密码）
- [ ] 角色管理页（list / drawer 创建 / drawer 编辑 / 分配菜单 tree drawer / 反查用户 modal）
- [ ] 菜单管理页（tree table / drawer 创建子菜单 / drawer 编辑 / 排序）
- [ ] 个人中心（基本信息 + 修改密码）
- [ ] 首页 Dashboard 改造（可保留卡片，但数据接入真实接口）

### 阶段 5 · 体验与质量（1 天）

- [ ] 错误提示带 `traceId`
- [ ] 操作二次确认（删除/锁定/重置密码）
- [ ] 表格列排序参数与后端 `safeSort` 白名单对齐
- [ ] 接口失败重试体验（仅 GET 自动重试 1 次）
- [ ] 路由切换 loading
- [ ] ESLint / TypeScript 严格类型通过
- [ ] 简单 E2E（登录 → 用户管理 → 创建用户 → 分配角色 → 退出）

### 阶段 6 · 体系化（持续）

- [ ] 国际化（i18n）框架
- [ ] 主题切换（暗色/紧凑）
- [ ] 异常上报（traceId → Sentry）
- [ ] 操作日志查看页
- [ ] 大文件上传 / 头像
- [ ] WebSocket 通知

---

## 13. 风险清单

| # | 风险 | 影响 | 缓解 |
|---|------|------|------|
| R1 | React Router 7 不支持运行时增量路由 | 动态路由需重建 Router | 用工厂函数 + `useMemo + key` 重渲染 |
| R2 | menuTree 改变频繁会重建 router | 体验抖动 | 仅在 login/logout/me 变更时改 store；管理员改自己菜单后给提示「需重新登录生效」 |
| R3 | localStorage 中 refreshToken 易被 XSS 偷 | 安全 | 短期保留 localStorage；后端实现 HttpOnly Cookie 后切换 |
| R4 | 后端 `safeSort` 白名单与前端 ProTable 排序字段不一致 | 排序失效 | 每个 ProTable 列配置 `sorter: true` 时显式指定 `sortField`，与后端列名对齐 |
| R5 | menu.component 字段是字符串映射到 React 组件 | 拼写错误 → 404 | `componentRegistry` 集中维护；CI 阶段加 lint 检查 menu 表中所有 component 都有对应组件 |
| R6 | 后端 `/api/v1/auth/unlock/{userId}` 与 `/api/v1/users/{id}/unlock` 同时存在 | 调用混乱 | 前端统一调 `users/{id}/unlock`；废弃路径不暴露 UI |
| R7 | 后端默认端口 `8080` 与文档常见的 `9001` 不一致 | 代理失败 | vite proxy target 通过 `.env` 配置：`VITE_API_TARGET=http://localhost:8080` |
| R8 | `LockUserRequest` 后端已存在但本规划没用 | 锁定无原因记录 | UI 锁定弹框增加 reason 字段，发 body |
| R9 | 401 + refreshToken 也过期场景，并发请求重复跳转 | 多次 navigate | refresh 失败时 drainQueue + redirect 已处理，但要确认 `isRefreshing` 标志在异常分支被复位 |
| R10 | `Set<string>` 在 zustand 中持久化序列化丢失 | 持久化失败 | `useUserStore` 不开 persist；每次启动重新调 `/me` 重建 |

---

## 附录 A · 与后端 ErrorCode 对齐的提示文案

```ts
// utils/errorCode.ts
import { ErrorCode } from '../types/common';

export const ERROR_MESSAGES: Record<number, string> = {
  [ErrorCode.VALIDATION_FAILED]:     '请检查输入内容',
  [ErrorCode.UNAUTHORIZED]:          '登录已过期，请重新登录',
  [ErrorCode.REFRESH_TOKEN_INVALID]: '会话已失效，请重新登录',
  [ErrorCode.FORBIDDEN]:             '您无权执行该操作',
  [ErrorCode.USER_NOT_FOUND]:        '用户不存在',
  [ErrorCode.ROLE_NOT_FOUND]:        '角色不存在',
  [ErrorCode.MENU_NOT_FOUND]:        '菜单不存在',
  [ErrorCode.DUPLICATE_RESOURCE]:    '资源已存在',
  [ErrorCode.RESOURCE_IN_USE]:       '资源被占用，无法删除',
  [ErrorCode.LOCKED]:                '账户已被锁定，请联系管理员',
  [ErrorCode.TOO_MANY_REQUESTS]:     '请求过于频繁，请稍后再试',
  [ErrorCode.INTERNAL_ERROR]:        '服务器繁忙，请稍后再试',
};

export const friendlyMessage = (code: number, fallback: string) =>
  ERROR_MESSAGES[code] ?? fallback;
```

---

## 附录 B · 命名约定

- **API 函数**：动词 + 资源单数/复数。`listUsers / getUser / createUser / updateUser / removeUser / getCurrentUser / changePassword`
- **Store**：`use{Domain}Store`，selector 用箭头函数 `useUserStore((s) => s.user)` 而非整对象，避免重渲染
- **页面目录**：PascalCase（`User`、`Role`），下属用 `index.tsx` + 同级拆 `Drawer.tsx`、`RoleAssignModal.tsx`
- **权限码**：与后端 `@PreAuthorize` 一致，格式 `{资源}:{动作}`，仅小写字母与 `-`

---

> **下一步建议**：先把阶段 1 + 2 跑通，再开始阶段 3 的 RBAC 核心改造。如需我把本文档转成"AI 改进提示词"，可在阶段 1 完成后单独要一份。
