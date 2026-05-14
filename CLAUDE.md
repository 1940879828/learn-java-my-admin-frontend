# JWT Admin Frontend - Claude Code 开发指南

## 项目概述

这是一个基于 React + TypeScript + Ant Design 的后台管理系统前端项目，配合 Spring Boot + JWT 的后端实现完整的 RBAC 权限管理。

### 技术栈

- **框架**: React 19 + TypeScript 6
- **构建工具**: Vite 8
- **UI 组件库**: Ant Design 6 + ProComponents 3
- **路由**: React Router 7
- **状态管理**: Zustand 5
- **HTTP 客户端**: Axios 1
- **编译优化**: React Compiler (Babel)

### 核心功能

- JWT Token 认证与自动刷新
- RBAC 权限控制（用户、角色、菜单管理）
- 动态路由与权限守卫
- 暗黑模式支持（手动切换，localStorage 持久化）
- 响应式布局

---

## 项目结构

```
src/
├── api/              # API 接口定义
├── components/       # 公共组件
│   └── Permission/   # 权限控制组件
├── constants/        # 常量定义
├── hooks/            # 自定义 Hooks
├── layouts/          # 布局组件
│   ├── AdminLayout   # 后台主布局
│   └── BlankLayout   # 空白布局（登录页等）
├── pages/            # 页面组件
│   ├── Login/        # 登录/注册
│   ├── User/         # 用户管理
│   ├── Role/         # 角色管理
│   ├── Menu/         # 菜单管理
│   └── Profile/      # 个人中心
├── router/           # 路由配置
│   └── guards/       # 路由守卫
├── store/            # Zustand 状态管理
│   ├── useAuthStore  # 认证状态（Token）
│   ├── useUserStore  # 用户信息
│   └── useThemeStore # 主题状态
├── types/            # TypeScript 类型定义
└── utils/            # 工具函数
```

---

## 代码规范

### 1. 组件规范

#### 函数组件
- 统一使用 **函数式组件** + **Hooks**
- 使用 `export default function` 导出主组件
- 组件文件名使用 PascalCase（如 `UserPage.tsx`）

```tsx
export default function UserPage() {
  // Component logic
}
```

#### 类型定义
- Props/State 类型定义在组件文件顶部
- 接口命名使用 PascalCase，以 `Props`/`Values`/`Response` 等结尾

```tsx
interface UserFormValues {
  username: string;
  password: string;
}
```

### 2. 状态管理规范

#### Zustand Store
- Store 文件命名：`use[Name]Store.ts`
- 持久化使用 `persist` 中间件 + `localStorage`
- State 类型定义清晰，包含操作方法

```typescript
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'light',
      toggleMode: () => set((state) => ({ 
        mode: state.mode === 'light' ? 'dark' : 'light' 
      })),
    }),
    { name: 'theme', storage: createJSONStorage(() => localStorage) }
  )
);
```

### 3. API 调用规范

- API 函数统一放在 `api/` 目录
- 错误处理在 Axios 拦截器中统一处理
- 组件中使用 `try-catch` 捕获错误，但不重复显示错误消息

```typescript
try {
  const res = await deleteUser(id);
  if (res.data.code === 200) {
    message.success('删除成功');
    actionRef.current?.reload();
  }
} catch (error) {
  // Error already handled by interceptor
}
```

### 4. 权限控制规范

#### 使用 Permission 组件
- 包裹需要权限控制的 UI 元素
- `code` 属性对应后端权限标识

```tsx
<Permission code="user:edit">
  <a onClick={() => setEditRecord(record)}>编辑</a>
</Permission>
```

#### 路由级权限
- 由 `PermissionGuard` 自动处理
- 无权限跳转到 `/forbidden`

---

## UI/UX 规范

### 表格规范 ⭐

**重要：所有表格必须固定宽度，屏幕宽度不够时显示横向滚动条，不压缩单元格宽度。**

#### ProTable 配置要求

```tsx
<ProTable
  columns={columns}
  scroll={{ x: 'max-content' }}  // 必须添加，启用横向滚动
  // ... other props
/>
```

#### 列宽度配置

```tsx
const columns: ProColumns<UserResponse>[] = [
  { title: 'ID', dataIndex: 'id', width: 80 },           // 固定宽度
  { title: '用户名', dataIndex: 'username', width: 120 }, // 固定宽度
  { title: '邮箱', dataIndex: 'email', width: 200 },     // 固定宽度
  { title: '操作', valueType: 'option', width: 250 },    // 操作列固定宽度
];
```

#### 原则
1. **每一列都应设置 `width` 属性**
2. **表格容器必须有 `scroll={{ x: 'max-content' }}`**
3. **操作列宽度根据按钮数量合理设置（通常 200-300px）**
4. **禁止使用 `ellipsis` 压缩内容，优先横向滚动**

### 布局规范

- 页面内容区域使用 `padding: 24px`
- 表单/抽屉宽度保持一致性（如 Drawer 宽度 600px）
- 响应式断点遵循 Ant Design 标准

### 主题规范

- 支持明/暗两种模式
- 主题切换在用户头像下拉菜单中
- 不跟随系统，手动切换，localStorage 持久化
- 使用 Ant Design 的 `theme.darkAlgorithm` 和 `theme.defaultAlgorithm`

---

## 路由与导航

### 路由配置

- 动态路由基于后端返回的菜单树生成
- 静态路由（登录、403、404）在 `router/index.tsx` 定义
- 路由守卫顺序：`AuthGuard` → `BootstrapGuard` → `PermissionGuard`

### 守卫职责

- **AuthGuard**: 验证 Token，未登录跳转 `/login`
- **BootstrapGuard**: 加载用户信息和菜单树
- **PermissionGuard**: 校验页面权限，无权限跳转 `/forbidden`

---

## 环境配置

### 环境变量

在项目根目录创建 `.env.local` 文件：

```env
VITE_API_BASE_URL=http://localhost:8080
```

### API 基础路径

- 通过 `VITE_API_BASE_URL` 配置后端地址
- 默认值：`http://localhost:8080`
- 代码中通过 `import.meta.env.VITE_API_BASE_URL` 读取

---

## 开发约定

### 1. 命名约定

- **文件名**: PascalCase（组件）、camelCase（工具函数）
- **变量名**: camelCase
- **常量名**: UPPER_SNAKE_CASE
- **类型/接口**: PascalCase

### 2. 导入顺序

```typescript
// 1. React 相关
import { useState } from 'react';

// 2. 第三方库
import { ProTable } from '@ant-design/pro-components';
import { message } from 'antd';

// 3. 项目内部 - 绝对路径
import { useUserStore } from '../../store/useUserStore';
import { listUsers } from '../../api/user';
import type { UserResponse } from '../../types/user';
```

### 3. 表单处理

- 使用 ProForm/ProFormText 等 ProComponents
- `initialValue` 设置默认值
- 验证规则使用 `rules` 属性

### 4. 错误处理

- HTTP 错误在 Axios 拦截器统一处理
- 组件中只处理业务逻辑错误
- 401 自动刷新 Token，刷新失败跳转登录页

### 5. 性能优化

- 使用 React Compiler 自动优化
- 大列表使用 ProTable 的分页功能
- 图标按需引入（`@ant-design/icons`）

---

## 常见问题

### Token 刷新机制

- Access Token 过期时自动调用刷新接口
- 刷新失败清除认证状态并跳转登录
- 不需要手动处理，由 Axios 拦截器自动完成

### 菜单不显示

- 检查后端返回的菜单数据是否包含 `menuType !== 'BUTTON'` 和 `visible !== false`
- 检查菜单的 `path` 和 `icon` 字段是否正确

### 权限按钮不显示

- 确认用户拥有对应的权限码（`user:edit`、`role:add` 等）
- 检查 `Permission` 组件的 `code` 属性是否与后端一致

---

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint
```

---

## 注意事项

1. **不要绕过权限控制**：所有需要权限的操作都应使用 `Permission` 组件包裹
2. **不要在组件中直接修改 Store**：使用 Store 提供的方法
3. **不要忘记清理副作用**：`useEffect` 中的定时器、监听器等需要清理
4. **表格必须固定宽度**：按照上述表格规范配置 `scroll` 和 `width`
5. **登录表单默认值**：用户名 `admin`，密码 `123456`（仅开发环境）

---

最后更新：2026-05-14
