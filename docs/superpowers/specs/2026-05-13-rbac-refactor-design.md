# Frontend RBAC Refactor - Implementation Design

**Date:** 2026-05-13  
**Project:** learn-java-my-admin-frontend  
**Based on:** docs/前端重构与RBAC方案.md  
**Strategy:** Layered Progressive Execution

---

## Executive Summary

This design document outlines the implementation plan for refactoring the antd-admin frontend to integrate a complete RBAC (Role-Based Access Control) system. The refactor aligns with the backend's 38-commit refactor that migrated API paths from `/auth/**` to `/api/v1/**` and introduced full user/role/menu CRUD capabilities.

**Execution Strategy:** Three-layer progressive implementation  
**Branch:** `feat/rbac-refactor`  
**Total Commits:** 3 (one per layer)  
**Runtime Validation:** None (code implementation only, no tests or dev server)

---

## Background and Context

### Current State
- Simple authentication system (login/register/logout only)
- Hardcoded menu in AdminLayout
- Route guard only checks token existence
- API paths use deprecated `/auth/*` format
- No RBAC concepts (no roles, permissions, or dynamic menus)
- Manual localStorage management in useAuthStore

### Target State
- Full RBAC system with roles, permissions, and dynamic menus
- API paths aligned with backend `/api/v1/*`
- Three-tier route guards (Auth → Bootstrap → Permission)
- Dynamic menu generation from backend menuTree
- Zustand persist middleware for state management
- Complete admin pages (User/Role/Menu management)

### Constraints
- Backend APIs are complete and ready for integration
- No runtime testing required (pure code development)
- No test execution needed
- Must follow existing plan document precisely
- TypeScript strict mode enabled

---

## Architecture Overview

### Layered Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Foundation Layer                                  │
│  ──────────────────────────────────────────────────────     │
│  • types/       - TypeScript type definitions               │
│  • constants/   - API paths, permission codes               │
│  • utils/       - Utility functions                         │
│  • vite.config  - Proxy configuration fix                   │
│                                                              │
│  Output: Complete type system and utilities                 │
└─────────────────────────────────────────────────────────────┘
                          ↓ depends on
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: Business Logic Layer                              │
│  ──────────────────────────────────────────────────────     │
│  • api/         - API calls (auth/user/role/menu)           │
│  • store/       - Zustand state (auth/user/app)             │
│  • router/      - Routes and guards                         │
│  • hooks/       - Custom hooks (usePermission, etc.)        │
│                                                              │
│  Output: Complete data flow and routing system              │
└─────────────────────────────────────────────────────────────┘
                          ↓ depends on
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: Presentation Layer                                │
│  ──────────────────────────────────────────────────────     │
│  • components/  - Reusable components (Permission, etc.)    │
│  • layouts/     - Layout components (AdminLayout, etc.)     │
│  • pages/       - Page components (User/Role/Menu, etc.)    │
│  • App.tsx      - Application entry with router             │
│                                                              │
│  Output: Complete UI and user interactions                  │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Strict Dependency Direction**: Lower layers don't depend on upper layers
2. **Type-First Development**: All types defined in Layer 1 before implementation
3. **No Runtime Validation**: Pure code implementation without running the project
4. **Follow Specification**: Strictly adhere to the original plan document

---

## Layer 1: Foundation Layer

### Scope

Establish the complete type system, constants, and utility functions that will be used by all upper layers.

### File Structure

```
src/
├── types/
│   ├── common.ts          # NEW: Result<T>, PageRequest, PageResponse<T>, ErrorCode
│   ├── auth.ts            # UPDATE: Add email to RegisterRequest
│   ├── user.ts            # NEW: User types
│   ├── role.ts            # NEW: Role types
│   ├── menu.ts            # NEW: Menu types
│   └── enums.ts           # NEW: DataScope, MenuType
├── constants/
│   ├── api.ts             # NEW: All API path constants
│   └── permissions.ts     # NEW: Permission code constants
├── utils/
│   ├── permission.ts      # NEW: Permission check functions
│   ├── tree.ts            # NEW: Tree conversion utilities
│   ├── iconMap.tsx        # NEW: Icon name to component mapping
│   └── errorCode.ts       # NEW: Error code to message mapping
└── vite.config.ts         # UPDATE: Remove rewrite logic
```

### Key Changes

#### types/common.ts (NEW)
```typescript
export interface Result<T = unknown> {
  code: number;
  message: string;
  data: T;
  traceId?: string;      // NEW: For tracking
  timestamp?: string;    // NEW: For debugging
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

#### types/auth.ts (UPDATE)
```typescript
export interface RegisterRequest {
  username: string;
  password: string;
  email: string;        // NEW: Required field
  phone?: string;       // NEW: Optional field
}
```

#### types/user.ts (NEW)
```typescript
export interface UserDetailResponse extends UserResponse {
  roles: RoleResponse[];
  permissions: string[];      // Flattened permission codes
  menuTree: MenuTreeNode[];   // User's visible menu tree
}
```
This is the core RBAC data structure returned by `GET /users/me`.

#### constants/api.ts (NEW)
```typescript
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
    me:           `${V1}/users/me`,          // CRITICAL: Bootstrap endpoint
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

#### utils/permission.ts (NEW)
```typescript
export const hasPermission = (userPermissions: Set<string>, code: string): boolean =>
  userPermissions.has(code);

export const hasAnyPermission = (userPermissions: Set<string>, codes: string[]): boolean =>
  codes.some(c => userPermissions.has(c));

export const hasAllPermissions = (userPermissions: Set<string>, codes: string[]): boolean =>
  codes.every(c => userPermissions.has(c));
```

#### vite.config.ts (UPDATE)
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      // REMOVE: rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
}
```

### Deliverables

- Complete TypeScript type definitions for all API requests/responses
- Centralized API path management
- Utility functions for permission checks, tree conversion, icon mapping
- Fixed Vite proxy configuration

### Commit Message
```
feat: 基础设施层 - types, constants, utils

- Add comprehensive type definitions (common, auth, user, role, menu, enums)
- Add API path constants with /api/v1 prefix
- Add utility functions (permission, tree, iconMap, errorCode)
- Fix vite proxy configuration (remove rewrite)
- Update RegisterRequest to include required email field
- Add traceId and timestamp to Result<T> type

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Layer 2: Business Logic Layer

### Scope

Implement API calls, state management, routing system, and custom hooks using the types and utilities from Layer 1.

### File Structure

```
src/
├── api/
│   ├── request.ts         # UPDATE: Refresh path, add 403/423/429 handlers
│   ├── auth.ts            # UPDATE: Use API constants
│   ├── user.ts            # NEW: User API
│   ├── role.ts            # NEW: Role API
│   ├── menu.ts            # NEW: Menu API
│   └── index.ts           # NEW: Re-export all APIs
├── store/
│   ├── useAuthStore.ts    # UPDATE: Use zustand persist middleware
│   ├── useUserStore.ts    # NEW: RBAC state (user/permissions/menuTree)
│   └── useAppStore.ts     # NEW: UI state (optional)
├── hooks/
│   ├── usePermission.ts   # NEW: Permission check hooks
│   ├── useUserMenu.ts     # NEW: Get user menu as MenuDataItem[]
│   └── useBootstrap.ts    # NEW: Bootstrap logic (optional)
├── router/
│   ├── guards/
│   │   ├── AuthGuard.tsx          # NEW: Replace AuthRoute
│   │   ├── BootstrapGuard.tsx     # NEW: Call /users/me
│   │   └── PermissionGuard.tsx    # NEW: Route-level permission
│   ├── buildRoutes.ts     # NEW: menuTree → RouteObject[]
│   ├── staticRoutes.tsx   # NEW: Static routes
│   └── index.tsx          # UPDATE: Export factory function
└── App.tsx                # UPDATE: Dynamic router with useMemo
```

### Key Implementations

#### api/request.ts (UPDATE)
```typescript
// Update refresh path
const REFRESH_TOKEN_PATH = '/api/v1/auth/refresh';

// Add response interceptor cases
case 403:
  if (!cfg._skipErrorHandler) {
    message.error(`无权限访问 (traceId: ${data?.traceId ?? 'n/a'})`);
  }
  break;
case 423:
  Modal.error({ title: '账户已被锁定', content: data?.message || '请联系管理员' });
  break;
case 429:
  message.warning('操作过于频繁，请稍后再试');
  break;

// Expose X-Trace-Id header for error reporting
```

#### store/useAuthStore.ts (UPDATE)
```typescript
import { persist, createJSONStorage } from 'zustand/middleware';

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
```
Remove manual localStorage operations and username field.

#### store/useUserStore.ts (NEW)
```typescript
interface UserState {
  user: UserDetailResponse | null;
  permissions: Set<string>;        // O(1) lookup
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
  setUser: (u) => set({
    user: u,
    permissions: new Set(u.permissions),
    menuTree: u.menuTree,
    loaded: true,
  }),
  reset: () => set({ user: null, permissions: new Set(), menuTree: [], loaded: false }),
}));
```
**Do not enable persist** - reload from `/users/me` on each app start.

#### router/guards/AuthGuard.tsx (NEW)
```typescript
export default function AuthGuard() {
  const hasToken = useAuthStore((s) => !!s.accessToken);
  const loc = useLocation();
  if (!hasToken) {
    return <Navigate to={`/login?from=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;
  }
  return <Outlet />;
}
```

#### router/guards/BootstrapGuard.tsx (NEW)
```typescript
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

#### router/guards/PermissionGuard.tsx (NEW)
```typescript
interface Props { code?: string; codes?: string[]; mode?: 'all' | 'any'; }

export default function PermissionGuard({ code, codes, mode = 'any' }: Props) {
  const { has, hasAll, hasAny } = usePermission();
  const ok = code ? has(code) : (mode === 'all' ? hasAll(codes!) : hasAny(codes!));
  return ok ? <Outlet /> : <Navigate to="/403" replace />;
}
```

#### router/buildRoutes.ts (NEW)
```typescript
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

#### router/index.tsx (UPDATE)
```typescript
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

#### App.tsx (UPDATE)
```typescript
export default function App() {
  const menuTree = useUserStore((s) => s.menuTree);
  const router = useMemo(() => createAppRouter(menuTree), [menuTree]);
  return <RouterProvider router={router} key={menuTree.length} />;
}
```

#### hooks/usePermission.ts (NEW)
```typescript
export function usePermission() {
  const permissions = useUserStore((s) => s.permissions);
  
  return {
    has: (code: string) => permissions.has(code),
    hasAny: (codes: string[]) => codes.some((c) => permissions.has(c)),
    hasAll: (codes: string[]) => codes.every((c) => permissions.has(c)),
  };
}
```

### Deliverables

- Complete API layer (auth/user/role/menu)
- RBAC state management (tokens + user + permissions + menuTree)
- Three-tier route guards (Auth → Bootstrap → Permission)
- Dynamic route generation from menuTree
- Permission check hooks

### Commit Message
```
feat: 业务逻辑层 - api, store, router, hooks

- Implement complete API layer (auth, user, role, menu)
- Refactor useAuthStore with zustand persist middleware
- Add useUserStore for RBAC state (user, permissions, menuTree)
- Implement three-tier route guards (Auth, Bootstrap, Permission)
- Add dynamic route generation from backend menuTree
- Add usePermission hook for permission checks
- Update request interceptor with 403/423/429 handlers
- Update App.tsx for dynamic router recreation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Layer 3: Presentation Layer

### Scope

Build the complete UI layer including reusable components, layouts, and all admin pages.

### File Structure

```
src/
├── components/
│   ├── Permission/
│   │   └── index.tsx      # NEW: Permission wrapper component
│   └── PageContainer/
│       └── index.tsx      # NEW: Unified page header (optional)
├── layouts/
│   ├── AdminLayout.tsx    # UPDATE: Read menuTree from store
│   └── BlankLayout.tsx    # NEW: Blank layout for login/404
├── pages/
│   ├── Login/
│   │   └── index.tsx      # UPDATE: Add email field, call /users/me
│   ├── Home/
│   │   └── index.tsx      # UPDATE: Dashboard style
│   ├── User/              # NEW: User management
│   │   ├── index.tsx
│   │   ├── CreateDrawer.tsx
│   │   ├── EditDrawer.tsx
│   │   └── RoleAssignModal.tsx
│   ├── Role/              # NEW: Role management
│   │   ├── index.tsx
│   │   ├── FormDrawer.tsx
│   │   └── MenuAssignDrawer.tsx
│   ├── Menu/              # NEW: Menu management
│   │   ├── index.tsx
│   │   └── FormDrawer.tsx
│   ├── Profile/           # NEW: User profile
│   │   ├── index.tsx
│   │   ├── InfoTab.tsx
│   │   └── PasswordTab.tsx
│   └── Forbidden/
│       └── index.tsx      # NEW: 403 page
└── App.tsx                # Already updated in Layer 2
```

### Key Implementations

#### components/Permission/index.tsx (NEW)
```typescript
interface Props {
  code?: string;
  codes?: string[];
  mode?: 'all' | 'any';
  fallback?: ReactNode;
  children: ReactNode;
}

export default function Permission({ code, codes, mode = 'any', fallback = null, children }: Props) {
  const { has, hasAll, hasAny } = usePermission();
  const ok = code ? has(code) : (mode === 'all' ? hasAll(codes ?? []) : hasAny(codes ?? []));
  return <>{ok ? children : fallback}</>;
}
```

Usage:
```tsx
<Permission code="user:add">
  <Button type="primary" onClick={openCreate}>新建用户</Button>
</Permission>
```

#### layouts/AdminLayout.tsx (UPDATE)
```typescript
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
  const menuTree = useUserStore((s) => s.menuTree);
  const user = useUserStore((s) => s.user);
  const route = useMemo(() => ({ path: '/', routes: toMenuDataItems(menuTree) }), [menuTree]);

  return (
    <ProLayout
      title="Antd Admin"
      route={route}
      location={location}
      layout="mix"
      menuItemRender={(item, dom) => <Link to={item.path ?? '/'}>{dom}</Link>}
      avatarProps={{
        src: user?.avatar,
        title: user?.username,
        render: (_, dom) => <UserDropdown>{dom}</UserDropdown>
      }}
    >
      <Outlet />
    </ProLayout>
  );
}
```

#### pages/Login/index.tsx (UPDATE)
```typescript
// Update register form to include email field (required)
<ProFormText
  name="email"
  label="邮箱"
  rules={[
    { required: true, message: '请输入邮箱' },
    { type: 'email', message: '请输入有效的邮箱地址' },
  ]}
/>

// Update login handler
const handleLogin = async (values: LoginValues) => {
  const res = await login(values);
  if (res.data.code !== 200 || !res.data.data) return false;
  
  useAuthStore.getState().setTokens(
    res.data.data.accessToken,
    res.data.data.refreshToken
  );
  
  // Immediately fetch /users/me to populate RBAC state
  const me = await getCurrentUser();
  if (me.data.code === 200 && me.data.data) {
    useUserStore.getState().setUser(me.data.data);
  }
  
  const from = new URLSearchParams(location.search).get('from') || '/';
  navigate(from, { replace: true });
  return true;
};
```

#### pages/User/index.tsx (NEW - Example)
```typescript
export default function UserPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<UserResponse | null>(null);
  
  return (
    <>
      <Permission code="user:add">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          新建用户
        </Button>
      </Permission>
      
      <ProTable
        rowKey="id"
        request={async (params) => {
          const { data } = await listUsers({
            page: params.current,
            size: params.pageSize,
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
            title: '操作',
            valueType: 'option',
            render: (_, record) => [
              <Permission key="edit" code="user:edit">
                <a onClick={() => setEditRecord(record)}>编辑</a>
              </Permission>,
              <Permission key="role" code="user:edit">
                <a onClick={() => openRoleAssign(record)}>分配角色</a>
              </Permission>,
              <Permission key="lock" code="user:edit">
                <a onClick={() => record.locked ? unlock(record.id) : lock(record.id)}>
                  {record.locked ? '解锁' : '锁定'}
                </a>
              </Permission>,
              <Permission key="del" code="user:delete">
                <Popconfirm title="确认删除?" onConfirm={() => remove(record.id)}>
                  <a>删除</a>
                </Popconfirm>
              </Permission>,
            ],
          },
        ]}
      />
      
      <CreateDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditDrawer record={editRecord} onClose={() => setEditRecord(null)} />
    </>
  );
}
```

#### pages/Role/index.tsx (NEW)
Similar structure to User page, with:
- ProTable for role list
- FormDrawer for create/edit
- MenuAssignDrawer with Tree selector for assigning menus to role
- Action buttons with permission checks

#### pages/Menu/index.tsx (NEW)
- ProTable with `expandable` for tree display
- FormDrawer for create/edit with parent menu selector
- Sort order management

#### pages/Profile/index.tsx (NEW)
```typescript
export default function ProfilePage() {
  return (
    <PageContainer>
      <Tabs
        items={[
          { key: 'info', label: '基本信息', children: <InfoTab /> },
          { key: 'password', label: '修改密码', children: <PasswordTab /> },
        ]}
      />
    </PageContainer>
  );
}
```

#### pages/Forbidden/index.tsx (NEW)
```typescript
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

### Page Inventory

| Page | Path | Components | Key Features |
|------|------|-----------|--------------|
| User Management | `/system/users` | ProTable + 3 Drawers/Modals | CRUD + Role assignment + Lock/Unlock |
| Role Management | `/system/roles` | ProTable + 2 Drawers | CRUD + Menu assignment (Tree) + User lookup |
| Menu Management | `/system/menus` | ProTable (tree) + 1 Drawer | CRUD + Parent-child relationship + Sort |
| Profile | `/profile` | Tabs + 2 Forms | View info + Change password |
| Forbidden | `/403` | Result component | 403 notice + Return home |

### Experience Enhancements (Stage 5)

- Error messages include `traceId` for debugging
- `Popconfirm` for destructive actions (delete/lock/reset)
- Table loading states
- Form validation aligned with backend DTOs
- Success `message` notifications for operations

### Deliverables

- Complete RBAC UI system
- 5 admin pages (User/Role/Menu/Profile + Home)
- Permission-controlled buttons and actions
- Dynamic menu in AdminLayout
- Polished user experience

### Commit Message
```
feat: 界面呈现层 - components, layouts, pages

- Add Permission wrapper component for button-level access control
- Update AdminLayout to render dynamic menu from store
- Add BlankLayout for public pages
- Update Login page with email field and /users/me call
- Add User management page with CRUD and role assignment
- Add Role management page with menu assignment tree
- Add Menu management page with tree table
- Add Profile page with info and password tabs
- Add Forbidden (403) page
- Add comprehensive permission checks on all action buttons
- Add user experience enhancements (confirmations, loading, messages)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Git Workflow

### Branch Strategy

```
main (current: 2615598)
  │
  └─→ feat/rbac-refactor (new branch)
        │
        ├─ Commit 1: Layer 1 (Foundation)
        │    └─ types/ + constants/ + utils/ + vite.config.ts
        │
        ├─ Commit 2: Layer 2 (Business Logic)
        │    └─ api/ + store/ + router/ + hooks/ + App.tsx
        │
        └─ Commit 3: Layer 3 (Presentation)
             └─ components/ + layouts/ + pages/
```

### Workflow Steps

1. **Create branch**
   ```bash
   git checkout -b feat/rbac-refactor
   ```

2. **Layer 1 implementation** → Stage + Commit 1

3. **Layer 2 implementation** → Stage + Commit 2

4. **Layer 3 implementation** → Stage + Commit 3

5. **Final state**: Ready for merge to main (no PR creation in this phase)

---

## Implementation Sequence

### Phase 1: Layer 1 - Foundation (Commit 1)

1. Create all type files in `types/`
2. Create constant files in `constants/`
3. Create utility files in `utils/`
4. Update `vite.config.ts`
5. Stage and commit

### Phase 2: Layer 2 - Business Logic (Commit 2)

1. Update `api/request.ts` interceptors
2. Update `api/auth.ts` to use constants
3. Create `api/user.ts`, `api/role.ts`, `api/menu.ts`
4. Create `api/index.ts` for re-exports
5. Refactor `store/useAuthStore.ts` with persist
6. Create `store/useUserStore.ts`
7. Create all router guards in `router/guards/`
8. Create `router/buildRoutes.ts`
9. Update `router/index.tsx` to export factory
10. Create hooks in `hooks/`
11. Update `App.tsx` for dynamic router
12. Stage and commit

### Phase 3: Layer 3 - Presentation (Commit 3)

1. Create `components/Permission/`
2. Update `layouts/AdminLayout.tsx`
3. Create `layouts/BlankLayout.tsx`
4. Update `pages/Login/index.tsx`
5. Update `pages/Home/index.tsx`
6. Create `pages/User/` with all sub-components
7. Create `pages/Role/` with all sub-components
8. Create `pages/Menu/` with all sub-components
9. Create `pages/Profile/` with tabs
10. Create `pages/Forbidden/index.tsx`
11. Stage and commit

---

## Risk Assessment and Mitigation

### Risk 1: React Router 7 Immutability
**Issue:** React Router 7's `createBrowserRouter` is immutable after creation  
**Impact:** Cannot dynamically add routes at runtime  
**Mitigation:** Use factory function + `useMemo` + `key` prop to recreate router when menuTree changes

### Risk 2: menuTree Changes Trigger Full Rebuild
**Issue:** Any menuTree change causes complete router rebuild  
**Impact:** Potential UI flicker  
**Mitigation:** 
- menuTree only changes on login/logout/me refresh
- For admin self-menu changes, show notification "需重新登录生效"

### Risk 3: Set<string> Persistence
**Issue:** `Set` doesn't serialize well for zustand persist  
**Impact:** Cannot persist permissions  
**Mitigation:** Don't persist `useUserStore` - reload from `/users/me` on each app start

### Risk 4: Component Registry Typos
**Issue:** `menu.component` string may not match `componentRegistry` keys  
**Impact:** Routes lead to blank pages  
**Mitigation:** Centralize registry in `buildRoutes.ts`; consider future CI validation

### Risk 5: Backend Port Mismatch
**Issue:** Vite proxy targets `localhost:8080` but backend may use different port  
**Impact:** API calls fail  
**Mitigation:** Document to check backend `application.yml` for actual port; consider `.env` configuration

### Risk 6: No Runtime Validation
**Issue:** Code implemented without running tests or dev server  
**Impact:** Hidden bugs may exist  
**Mitigation:** 
- Rely on TypeScript strict mode for type safety
- Follow specification precisely to minimize logic errors
- Future validation phase will catch runtime issues

---

## Acceptance Criteria

### Layer 1 Completion Checklist
- [ ] All type files created with complete definitions
- [ ] API constants cover all backend endpoints
- [ ] Utility functions implemented and exported
- [ ] Vite config updated (rewrite removed)
- [ ] TypeScript compilation passes with no errors
- [ ] Commit created with proper message

### Layer 2 Completion Checklist
- [ ] All API modules implemented (auth/user/role/menu)
- [ ] useAuthStore refactored with persist middleware
- [ ] useUserStore implemented with RBAC state
- [ ] All three route guards implemented
- [ ] buildRoutes function implemented
- [ ] Router factory function exported
- [ ] App.tsx updated for dynamic router
- [ ] usePermission hook implemented
- [ ] TypeScript compilation passes
- [ ] Commit created with proper message

### Layer 3 Completion Checklist
- [ ] Permission component implemented
- [ ] AdminLayout updated to use store menuTree
- [ ] BlankLayout created
- [ ] Login page updated (email field + /users/me call)
- [ ] User management page complete
- [ ] Role management page complete
- [ ] Menu management page complete
- [ ] Profile page complete
- [ ] Forbidden page created
- [ ] All permission checks in place
- [ ] TypeScript compilation passes
- [ ] Commit created with proper message

### Final Verification
- [ ] All three layers committed
- [ ] Branch `feat/rbac-refactor` ready for review
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] All files follow project conventions

---

## Notes

- This design strictly follows `docs/前端重构与RBAC方案.md`
- No runtime validation is performed (pure code implementation)
- No tests will be executed during implementation
- Backend APIs are assumed to be complete and functional
- Future validation phase will verify actual functionality

---

## Next Steps

After this design is approved:
1. Invoke `writing-plans` skill to create detailed implementation plan
2. Execute implementation layer by layer
3. Create three commits as specified
4. Prepare branch for merge review

