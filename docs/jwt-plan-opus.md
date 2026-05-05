# JWT 双 Token 认证前端实现计划

> 基于 Spring Security + JWT 双 Token（Access + Refresh）后端 API，在当前 Vite + React 19 + TypeScript + Ant Design 6 + Pro Components 项目中实现登录页、带导航布局的首页及登出功能。

---

## 一、项目现状分析

| 项 | 状态 |
|---|---|
| 构建工具 | Vite 8 + React 19 + TypeScript 6 |
| UI 库 | antd ^6.3.7 + @ant-design/pro-components ^2.8.10（已安装，未使用） |
| 路由 | **无**（需新增） |
| HTTP 请求 | **无**（需新增） |
| 状态管理 | **无**（需新增） |
| 认证鉴权 | **无**（需新增） |
| 页面/布局 | 仅 Vite 默认模板（需重写） |
| i18n | **无** |

---

## 二、状态管理方案选型：Zustand vs Jotai

### 对比

| 维度 | Zustand | Jotai |
|---|---|---|
| 心智模型 | 集中式 Store（类 Redux，但极简） | 原子化 Atom（自底向上，类 Recoil） |
| 状态组织 | 一个 store 包含 state + actions | 每个状态是独立 atom，组合使用 |
| React 外部使用 | `store.getState()` 直接调用，无需 hook | 需手动 `createStore()` + `store.get(atom)` / `store.set(atom)`，并通过 `<Provider store={store}>` 绑定 React 树 |
| 适合场景 | 中心化业务状态（认证、全局配置） | 细粒度、派生状态多的场景（表单联动、组件级状态） |
| 包体积 | ~1.1KB gzip | ~2.4KB gzip（不含 utils） |
| 学习成本 | 极低 | 稍高，需理解 atom / derived atom |

### 关键决策因素：Axios 拦截器中的 Token 读写

本项目的 Token 刷新逻辑在 Axios 响应拦截器中执行——这是**纯 JS 环境，不在 React 组件树内**，无法使用任何 hook。

- **Zustand**：`useAuthStore.getState().accessToken` 读取、`.setTokens(...)` 写入，**零额外配置**
- **Jotai**：需创建模块级 `store = createStore()`，通过 `store.get(tokenAtom)` / `store.set(tokenAtom, val)` 操作，且必须确保此 store 实例通过 `<Provider store={store}>` 注入 React 树，否则拦截器和组件读写的不是同一份数据

### 结论：选择 Zustand

1. 认证状态天然是**中心化**的单一关注点（token + username），不需要原子化拆分
2. Axios 拦截器需要**在 React 外部**频繁读写 Token，Zustand 的 `getState()` 无缝支持
3. API 更简单直接，auth store 只需一个文件约 20 行代码

> 若项目后续出现复杂表单、大量组件级派生状态需求，可引入 Jotai 与 Zustand 共存，各司其职。

---

## 三、需新增的依赖

```bash
pnpm add react-router-dom axios zustand
```

| 依赖 | 用途 |
|---|---|
| `react-router-dom` | SPA 路由 |
| `axios` | HTTP 请求（拦截器机制成熟，便于统一注入 Token 与刷新逻辑） |
| `zustand` | 轻量状态管理（管理用户信息 & Token） |

> **注意：** 不安装任何额外 UI 库，所有组件均使用 antd / @ant-design/pro-components 提供的现成组件。

---

## 三、目标目录结构

```
src/
├── main.tsx                    # 入口：挂载 App
├── App.tsx                     # 根组件：路由 Provider + antd ConfigProvider
├── index.css                   # 全局样式（保留）
│
├── api/                        # API 请求层
│   ├── request.ts              # Axios 实例 + 拦截器（Token 注入 / 401 刷新 / 错误处理）
│   └── auth.ts                 # 认证相关 API（login / register / refresh / logout / unlock）
│
├── store/                      # 状态管理
│   └── useAuthStore.ts         # Zustand：用户信息 + Token + 登录/登出 actions
│
├── router/                     # 路由配置
│   ├── index.tsx               # createBrowserRouter 路由表
│   └── AuthRoute.tsx           # 路由守卫组件（未登录 → 重定向登录页）
│
├── layouts/                    # 布局
│   └── AdminLayout.tsx         # ProLayout 封装：左侧导航 + 顶部用户栏 + 右侧内容区
│
├── pages/                      # 页面
│   ├── Login/
│   │   └── index.tsx           # 登录页（LoginFormPage / ProForm）
│   └── Home/
│       └── index.tsx           # 首页（欢迎卡片）
│
└── types/                      # 类型定义
    └── auth.ts                 # API 请求/响应类型（与后端 Schema 对应）
```

---

## 四、类型定义（`src/types/auth.ts`）

根据后端 OpenAPI Schema，定义以下 TypeScript 类型：

```typescript
/** 统一响应结构 */
export interface Result<T = unknown> {
  code: number;
  message: string;
  data: T;
}

/** 登录请求 */
export interface LoginRequest {
  username: string;  // required
  password: string;  // required
}

/** 注册请求 */
export interface RegisterRequest {
  username: string;  // 3-20字符，^[a-zA-Z0-9_]+$
  password: string;  // 6-20字符
}

/** 刷新 Token 请求 */
export interface RefreshRequest {
  refreshToken: string;  // required
}

/** 登录/刷新响应 */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;  // "Bearer"
}

/** JWT 用户信息 */
export interface JwtUserDetails {
  userId: number;
  username: string;
  enabled: boolean;
  accountNonExpired: boolean;
  accountNonLocked: boolean;
  credentialsNonExpired: boolean;
  authorities: { authority: string }[];
}
```

---

## 五、详细实现步骤

### 步骤 1：API 请求层

#### 1.1 Axios 实例（`src/api/request.ts`）

- 创建 Axios 实例，`baseURL` 设为 `http://localhost:8080`
- **请求拦截器**：
  - 从 `localStorage` 读取 `accessToken`
  - 若存在，在 `Authorization` header 中注入 `Bearer <accessToken>`
- **响应拦截器**：
  - 当收到 **401** 状态码时：
    1. 从 `localStorage` 读取 `refreshToken`
    2. 若有 refreshToken，调用 `/auth/refresh` 接口获取新 Token 对
    3. 刷新成功 → 更新 localStorage 和 Zustand store → 用新 Token 重试原请求
    4. 刷新失败 → 清除本地 Token → 跳转登录页
  - **防止并发刷新**：使用一个 `isRefreshing` 标志 + 等待队列，保证同时只有一个刷新请求，其余请求排队等待刷新完成后重试
  - 其他错误：使用 antd `message.error()` 提示后端返回的 `message` 字段

#### 1.2 认证 API（`src/api/auth.ts`）

基于 Axios 实例封装 5 个函数，直接对应后端接口：

| 函数 | 方法 | 路径 | 请求体 | 响应 |
|---|---|---|---|---|
| `login(data: LoginRequest)` | POST | `/auth/login` | `LoginRequest` | `Result<LoginResponse>` |
| `register(data: RegisterRequest)` | POST | `/auth/register` | `RegisterRequest` | `Result<void>` |
| `refreshToken(data: RefreshRequest)` | POST | `/auth/refresh` | `RefreshRequest` | `Result<LoginResponse>` |
| `logout(data?: JwtUserDetails)` | POST | `/auth/logout` | `JwtUserDetails`（可选） | `Result<void>` |
| `unlockUser(userId: number)` | POST | `/auth/unlock/{userId}` | 无 | `Result<void>` |

---

### 步骤 2：状态管理（`src/store/useAuthStore.ts`）

使用 Zustand 创建认证 Store：

```typescript
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  username: string | null;

  setTokens: (accessToken: string, refreshToken: string) => void;
  setUsername: (username: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}
```

- **初始化**：从 `localStorage` 读取已保存的 Token
- **setTokens**：同时更新 state 和 `localStorage`
- **clearAuth**：清除 state 和 `localStorage` 中所有认证信息
- **isAuthenticated**：判断 `accessToken` 是否存在

> localStorage 存储键名：`accessToken`、`refreshToken`、`username`

---

### 步骤 3：路由配置

#### 3.1 路由表（`src/router/index.tsx`）

使用 `react-router-dom` v6 的 `createBrowserRouter`：

```
路由结构：
/login          → Login 页面（公开）
/               → AuthRoute 守卫
  /             → AdminLayout 布局
    /           → Home 首页（index route）
```

| 路径 | 组件 | 说明 |
|---|---|---|
| `/login` | `Login/index.tsx` | 公开访问 |
| `/` | `AuthRoute` > `AdminLayout` | 需认证，嵌套布局 |
| `/`（index） | `Home/index.tsx` | 默认首页 |

#### 3.2 路由守卫（`src/router/AuthRoute.tsx`）

- 使用 `<Outlet />` 作为子路由出口
- 检查 Zustand store 中是否已认证（`isAuthenticated()`）
- 未认证 → `<Navigate to="/login" replace />`
- 已认证 → 渲染 `<Outlet />`

---

### 步骤 4：登录页（`src/pages/Login/index.tsx`）

**使用组件：** `@ant-design/pro-components` 的 **`LoginFormPage`** 或 **`LoginForm`**

#### 界面设计

- 使用 `LoginFormPage` 作为全屏登录页容器
  - 配置 `title`、`subTitle`（项目名称/描述）
  - 配置 `backgroundImageUrl` 或使用默认样式
- 表单字段使用 `ProFormText` 组件：
  - **用户名**：`ProFormText`，name="username"，prefix 使用 `<UserOutlined />`，必填
  - **密码**：`ProFormText.Password`，name="password"，prefix 使用 `<LockOutlined />`，必填
- 底部提供"注册账号"链接/按钮

#### 交互逻辑

1. 用户填写用户名和密码，点击"登录"
2. 调用 `login(values)` API
3. 成功（`code === 200` 或按后端约定判断）：
   - 将 `accessToken`、`refreshToken` 存入 Zustand store
   - 解析 accessToken 中的用户名（或直接用登录表单中的用户名）存入 store
   - 使用 `antd` 的 `message.success('登录成功')` 提示
   - `navigate('/', { replace: true })` 跳转首页
4. 失败：
   - 使用 `antd` 的 `message.error(res.message)` 显示错误信息（如用户名不存在、密码错误、账户被锁定等）
5. 登录按钮在请求期间使用 `loading` 状态，防止重复提交

#### 注册功能（可选扩展）

- 在登录页底部添加"注册"入口
- 使用 antd `Modal` + `ProForm` 弹出注册表单
- 字段：用户名（3-20字符，字母数字下划线）、密码（6-20字符）、确认密码
- 调用 `register()` API

---

### 步骤 5：管理布局（`src/layouts/AdminLayout.tsx`）

**使用组件：** `@ant-design/pro-components` 的 **`ProLayout`**

#### 布局结构

```
┌──────────────────────────────────────────────┐
│  ProLayout                                    │
│ ┌──────────┬─────────────────────────────────┐│
│ │          │  顶部栏（ProLayout 内置）        ││
│ │  左侧    │  右上角：用户名 + 登出按钮      ││
│ │  导航栏  ├─────────────────────────────────┤│
│ │          │                                 ││
│ │  菜单    │  内容区域                        ││
│ │          │  <Outlet /> 子路由              ││
│ │          │                                 ││
│ └──────────┴─────────────────────────────────┘│
└──────────────────────────────────────────────┘
```

#### ProLayout 配置

```typescript
<ProLayout
  title="Antd Admin"
  logo={false}  // 或自定义 logo
  layout="mix"  // 混合布局（侧边 + 顶部）或 "side"（纯侧边栏）
  route={menuRoute}  // 菜单路由数据
  location={location}
  menuItemRender={(item, dom) => <Link to={item.path!}>{dom}</Link>}
  avatarProps={{
    src: undefined,  // 头像 URL，可无
    title: username,  // 从 store 读取
    size: 'small',
    render: (_props, dom) => (
      <Dropdown menu={{ items: userMenuItems }}>
        {dom}
      </Dropdown>
    ),
  }}
  actionsRender={() => [...]}  // 可选：通知铃铛等
>
  <Outlet />
</ProLayout>
```

#### 左侧菜单数据

菜单使用 ProLayout 的 `route` 属性静态配置：

```typescript
const menuRoute = {
  path: '/',
  routes: [
    {
      path: '/',
      name: '首页',
      icon: <HomeOutlined />,
    },
    // 后续可扩展更多菜单
  ],
};
```

#### 右上角用户操作栏

利用 ProLayout 的 `avatarProps` 配置：

- 显示当前用户名
- 使用 antd 的 `Dropdown` 组件包裹头像区域
- 下拉菜单项：
  - **登出**：图标 `<LogoutOutlined />`，点击触发登出流程

---

### 步骤 6：首页（`src/pages/Home/index.tsx`）

**使用组件：** antd 的 `Card`、`Typography`、`Space` 等

- 简单的欢迎页面
- 显示 "欢迎回来，{username}" 的欢迎语
- 使用 antd `Card` 组件展示
- 后续可扩展为仪表盘

---

### 步骤 7：登出功能

#### 登出流程

1. 用户在右上角下拉菜单中点击"登出"
2. 弹出 antd `Modal.confirm` 确认框："确定要退出登录吗？"
3. 确认后：
   - 调用 `logout()` API（携带 Bearer Token）通知后端清除 Refresh Token
   - 无论 API 是否成功，执行客户端清理：
     - 调用 `useAuthStore.getState().clearAuth()` 清除所有 Token 和用户信息
     - `navigate('/login', { replace: true })` 跳转登录页
   - 使用 `message.success('已退出登录')` 提示

---

### 步骤 8：根组件改造（`src/App.tsx`）

改造 `App.tsx`，移除 Vite 默认模板内容：

```typescript
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { RouterProvider } from 'react-router-dom';
import router from './router';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <RouterProvider router={router} />
    </ConfigProvider>
  );
}

export default App;
```

- 使用 antd `ConfigProvider` 包裹，设置中文 locale
- 使用 `RouterProvider` 提供路由

---

## 六、Token 管理策略

### 6.1 存储方案

| 键名 | 存储位置 | 说明 |
|---|---|---|
| `accessToken` | localStorage | 短期有效的访问令牌 |
| `refreshToken` | localStorage | 长期有效的刷新令牌 |
| `username` | localStorage | 当前登录用户名 |

### 6.2 Token 刷新机制（核心逻辑在 `request.ts` 响应拦截器中）

```
请求 → 服务端返回 401
  ├── 有 refreshToken？
  │     ├── 是否正在刷新？
  │     │     ├── 是 → 将请求加入等待队列
  │     │     └── 否 → 发起 /auth/refresh 请求
  │     │           ├── 刷新成功 → 更新 Token → 重试原请求 + 队列中所有请求
  │     │           └── 刷新失败 → 清除 Token → 跳转登录页
  │     └── 否 → 清除 Token → 跳转登录页
```

### 6.3 请求头注入

所有需要认证的请求自动在 `Authorization` header 中携带：

```
Authorization: Bearer <accessToken>
```

---

## 七、组件使用清单

| 功能 | 使用组件 | 来源 |
|---|---|---|
| 登录页整体布局 | `LoginFormPage` | @ant-design/pro-components |
| 登录表单字段 | `ProFormText` / `ProFormText.Password` | @ant-design/pro-components |
| 管理后台布局 | `ProLayout` | @ant-design/pro-components |
| 用户下拉菜单 | `Dropdown` | antd |
| 消息提示 | `message` | antd |
| 确认弹框 | `Modal.confirm` | antd |
| 欢迎卡片 | `Card`、`Typography` | antd |
| 全局配置 | `ConfigProvider` | antd |
| 图标 | `UserOutlined`、`LockOutlined`、`LogoutOutlined`、`HomeOutlined` | @ant-design/icons |

> **约束：** 所有 UI 均使用上述 antd / @ant-design/pro-components 的现成组件，禁止自定义 UI 组件，但允许对上述组件进行组合封装。

---

## 八、实施顺序 & 任务清单

| # | 任务 | 预计改动文件 | 依赖 |
|---|---|---|---|
| 1 | 安装新增依赖 | `package.json` | 无 |
| 2 | 定义 TypeScript 类型 | `src/types/auth.ts`（新建） | 无 |
| 3 | 创建 Axios 实例 + 拦截器 | `src/api/request.ts`（新建） | #2 |
| 4 | 封装认证 API | `src/api/auth.ts`（新建） | #2, #3 |
| 5 | 创建 Zustand 认证 Store | `src/store/useAuthStore.ts`（新建） | #2 |
| 6 | 创建路由守卫 | `src/router/AuthRoute.tsx`（新建） | #5 |
| 7 | 实现登录页 | `src/pages/Login/index.tsx`（新建） | #4, #5 |
| 8 | 实现管理布局（含登出） | `src/layouts/AdminLayout.tsx`（新建） | #4, #5 |
| 9 | 实现首页 | `src/pages/Home/index.tsx`（新建） | #5 |
| 10 | 配置路由表 | `src/router/index.tsx`（新建） | #6, #7, #8, #9 |
| 11 | 改造 App.tsx 和 main.tsx | `src/App.tsx`、`src/main.tsx` | #10 |
| 12 | 清理无用文件 | 删除 `App.css`、`assets/react.svg`、`assets/vite.svg` | #11 |
| 13 | 配置 Vite 代理（可选） | `vite.config.ts` | 无 |

---

## 九、Vite 开发代理配置（可选）

为解决开发环境跨域问题，可在 `vite.config.ts` 中添加代理：

```typescript
export default defineConfig({
  // ... 现有配置
  server: {
    proxy: {
      '/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

若配置了代理，`request.ts` 中 `baseURL` 改为空字符串或 `/`。

---

## 十、注意事项

1. **不新增 i18n 文件**：所有界面文案直接使用中文硬编码
2. **不新增自定义组件**：所有 UI 仅通过 antd / pro-components 现成组件组合实现
3. **hero.png 缺失**：当前 `App.tsx` 引用了不存在的 `hero.png`，在步骤 11 改造时会一并移除
4. **React 19 兼容性**：确保所使用的 antd 6 和 pro-components 版本与 React 19 兼容
5. **Token 安全**：localStorage 方案适用于一般 B 端系统；若有更高安全要求，可后续改用 httpOnly Cookie 方案
