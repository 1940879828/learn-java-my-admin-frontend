---
name: jwt-auth-implementation
overview: 基于JWT双Token认证API文档，实现登录页、Home页布局和登出功能，使用antd/antd-pro组件。
design:
  architecture:
    framework: react
    component: shadcn
  styleKeywords:
    - 企业级管理后台
    - Ant Design Pro
    - 简洁专业
  fontSystem:
    fontFamily: system-ui
    heading:
      size: 24px
      weight: 600
    subheading:
      size: 16px
      weight: 500
    body:
      size: 14px
      weight: 400
  colorSystem:
    primary:
      - "#1677FF"
    background:
      - "#F5F5F5"
      - "#FFFFFF"
    text:
      - "#000000"
      - "#333333"
      - "#666666"
    functional:
      - "#52C41A"
      - "#FF4D4F"
      - "#FAAD14"
todos:
  - id: install-deps
    content: 安装 react-router-dom 和 axios 依赖
    status: completed
  - id: create-types
    content: 创建 src/types/auth.ts 定义API类型（LoginRequest、LoginResponse、RefreshRequest等）
    status: completed
    dependencies:
      - install-deps
  - id: create-request-util
    content: 创建 src/utils/request.ts 封装axios实例（含Token拦截器和自动刷新逻辑）
    status: completed
    dependencies:
      - install-deps
  - id: create-auth-service
    content: 创建 src/services/auth.ts 实现login、logout、refresh API调用
    status: completed
    dependencies:
      - create-types
      - create-request-util
  - id: create-auth-context
    content: 创建 src/context/AuthContext.tsx 管理认证状态（用户信息、Token、登录/登出方法）
    status: completed
    dependencies:
      - create-auth-service
  - id: create-login-page
    content: 创建 src/pages/Login/index.tsx 使用 antd Form 实现登录页
    status: completed
    dependencies:
      - create-auth-context
  - id: create-layout
    content: 创建 src/layouts/BasicLayout.tsx 使用 ProLayout 实现左侧导航+顶部用户条+右侧内容区
    status: completed
    dependencies:
      - create-auth-context
  - id: create-home-page
    content: 创建 src/pages/Home/index.tsx 作为默认首页内容
    status: completed
    dependencies:
      - create-layout
  - id: configure-router
    content: 修改 src/App.tsx 配置路由（登录页、受保护的Home页路由）和 AuthProvider
    status: completed
    dependencies:
      - create-login-page
      - create-layout
      - create-home-page
  - id: update-entry
    content: 修改 src/main.tsx 移除旧样式引用，确保入口正确
    status: completed
    dependencies:
      - configure-router
  - id: generate-plan-doc
    content: 创建 docs/jwt-plan-mimo.md 输出完整计划文档（含API文档、数据结构、实现方案）
    status: completed
    dependencies:
      - create-types
---

## 用户需求

基于JWT双Token认证API文档，在antd-admin项目中实现完整的认证系统和主布局。

## 功能内容

1. **生成计划文档**：在 `docs/jwt-plan-mimo.md` 中输出完整的实施计划，包含API文档、数据结构、实现方案
2. **登录页面**：使用 antd/pro-components 现成组件实现用户名+密码登录表单，调用 `/auth/login` 接口
3. **Home页布局**：

- 左侧导航栏：使用 ProLayout 的菜单系统
- 顶部用户条：显示当前登录用户名，右侧提供登出操作
- 右侧内容区：主内容展示区域

4. **登出功能**：调用 `/auth/logout` 接口，清除本地Token，跳转回登录页
5. **Token管理**：存储accessToken和refreshToken，实现自动刷新Token的拦截器
6. **路由守卫**：未登录时自动跳转登录页，已登录时禁止访问登录页

## 约束条件

- 必须使用 antd 或 @ant-design/pro-components 现成组件
- 禁止自定义组件（但可以封装antd/antd-pro组件）
- 后端API地址：`http://localhost:8080`

## 技术栈

- **前端框架**：React 19 + TypeScript 6
- **构建工具**：Vite 8
- **UI组件库**：antd 6 + @ant-design/pro-components 2 + @ant-design/icons 6
- **路由**：react-router-dom v7（需安装）
- **HTTP客户端**：axios（需安装）
- **状态管理**：React Context（无需额外依赖）
- **包管理器**：pnpm

## 技术架构

### 系统架构

```mermaid
graph TD
    A[main.tsx] --> B[App.tsx]
    B --> C{路由判断}
    C -->|未登录| D[LoginPage]
    C -->|已登录| E[BasicLayout]
    E --> F[ProLayout左侧导航]
    E --> G[顶部用户条]
    E --> H[右侧内容区]
    H --> I[HomePage]
    H --> J[其他业务页面]
    
    D -->|登录成功| K[AuthContext]
    K -->|存储Token| L[localStorage]
    K -->|提供用户状态| E
    
    M[axios实例] -->|请求拦截| N[自动附加Authorization]
    M -->|响应拦截| O[401自动刷新Token]
    O -->|刷新失败| P[清除Token跳转登录]
```

### 模块划分

1. **类型定义层** (`src/types/`)：API请求/响应的TypeScript类型
2. **工具层** (`src/utils/`)：axios实例封装，Token读写工具
3. **服务层** (`src/services/`)：API调用函数
4. **状态层** (`src/context/`)：AuthContext管理认证状态
5. **布局层** (`src/layouts/`)：ProLayout封装的主布局
6. **页面层** (`src/pages/`)：LoginPage、HomePage
7. **路由层** (`src/router/`)：路由配置和守卫

### 数据流

```
用户输入 -> LoginForm -> authService.login() -> axios.post(/auth/login) 
-> 响应成功 -> AuthContext.setAuth(accessToken, refreshToken) 
-> localStorage存储 -> 路由跳转到Home页
```

### 关键设计决策

1. **使用React Context而非Redux/Zustand**：认证状态简单，Context足够，避免引入额外依赖
2. **使用ProLayout**：内置侧边栏导航+顶部栏+内容区布局，满足需求且高度可配置
3. **axios拦截器实现Token刷新**：401响应时自动用refreshToken换取新token，失败则登出
4. **路由守卫组件**：封装一个RouteGuard组件，统一处理认证检查

### 需要新增的依赖

```
{
  "react-router-dom": "^7.x",
  "axios": "^1.x"
}
```

## 设计风格

采用 Ant Design Pro 默认的企业级管理后台设计风格，使用 ProLayout 提供的标准布局。

### 登录页

- 居中卡片式登录表单，使用 antd Card + Form 组件
- 用户名和密码输入框，带验证规则
- 登录按钮，带loading状态
- 页面背景使用浅灰色渐变

### Home页布局

- **左侧导航栏**：ProLayout 自带的侧边菜单，支持折叠
- **顶部用户条**：ProLayout 右上角区域，显示用户名 + Dropdown菜单（含登出选项）
- **右侧内容区**：路由出口，展示各业务页面内容