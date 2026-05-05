---
name: create-codebuddy-md
overview: 分析React + TypeScript + Vite项目代码库，创建CODEBUDDY.md文件，包含常用开发命令和架构说明。
todos:
  - id: explore-codebase
    content: 使用 [subagent:code-explorer] 深入探索代码库结构
    status: pending
  - id: analyze-architecture
    content: 分析项目架构和模块依赖关系
    status: pending
    dependencies:
      - explore-codebase
  - id: extract-commands
    content: 提取常用开发命令和配置
    status: pending
    dependencies:
      - explore-codebase
  - id: create-codebuddy-md
    content: 创建CODEBUDDY.md文件
    status: pending
    dependencies:
      - analyze-architecture
      - extract-commands
  - id: validate-content
    content: 验证文档内容的准确性和完整性
    status: pending
    dependencies:
      - create-codebuddy-md
---

## 用户需求

分析当前React + TypeScript + Vite模板项目代码库，创建CODEBUDDY.md文件，用于指导CodeBuddy在该仓库中工作。

## 功能内容

1. **常用命令文档**：包含开发、构建、lint等常用命令的使用说明
2. **代码架构说明**：描述项目的高级架构和结构，帮助快速上手

## 视觉效果

生成一个结构清晰、内容准确的Markdown文件，便于开发者快速理解项目结构和开发流程

## 技术栈

- **前端框架**：React 19 + TypeScript 6
- **构建工具**：Vite 8
- **UI组件库**：Ant Design 6 + Ant Design Pro Components
- **代码规范**：ESLint + TypeScript ESLint
- **包管理器**：pnpm

## 技术架构

### 项目结构

```
antd-admin/
├── src/
│   ├── assets/          # 静态资源（图片、SVG等）
│   ├── App.tsx          # 主应用组件
│   ├── App.css          # 应用样式
│   ├── main.tsx         # 应用入口
│   └── index.css        # 全局样式
├── public/              # 公共静态资源
├── vite.config.ts       # Vite配置
├── tsconfig.json        # TypeScript配置
├── eslint.config.js     # ESLint配置
└── package.json         # 项目配置
```

### 核心模块

1. **应用入口**：main.tsx负责React应用的初始化和渲染
2. **主组件**：App.tsx是主要的业务组件
3. **样式系统**：CSS文件定义全局和组件样式
4. **构建配置**：Vite配置包含React插件和Babel编译器

### 开发流程

- 使用Vite进行开发服务器热更新
- TypeScript提供类型检查
- ESLint确保代码质量
- pnpm管理依赖包

## 实现细节

### 关键配置文件

- **vite.config.ts**：配置React插件和React Compiler
- **tsconfig.app.json**：应用代码的TypeScript配置
- **tsconfig.node.json**：Node.js环境配置
- **eslint.config.js**：ESLint规则配置

### 依赖关系

- React 19作为核心框架
- Ant Design 6提供UI组件
- Vite 8作为构建工具
- TypeScript 6提供类型支持

## Agent Extensions

### SubAgent

- **code-explorer**
- **用途**：探索代码库结构，分析文件依赖关系
- **预期结果**：获取完整的项目架构信息，用于生成准确的CODEBUDDY.md文档