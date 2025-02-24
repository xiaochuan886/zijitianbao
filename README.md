# 资金计划填报系统

## 项目概述

这是一个基于 Next.js 14 开发的现代化资金计划填报系统。系统支持多组织架构下的资金计划填报、审核和分析功能，采用最新的 Web 技术栈，提供流畅的用户体验和强大的数据处理能力。

### 主要功能
- 多角色用户管理（管理员、填报人、填报财务、审核财务、观察员）
- 机构与项目管理
- 资金需求预测填报
- 实际支付填报与审核
- 数据分析与可视化
- 灵活的数据导出功能

## 快速开始

### 环境要求
- Node.js >= 18
- pnpm >= 8.0
- SQLite 3
- VSCode (推荐)

### 安装步骤

1. 克隆项目
```bash
git clone [项目地址]
cd funding-system
```

2. 安装依赖
```bash
pnpm install
```

3. 环境配置
```bash
# 复制环境变量配置文件
cp .env.example .env.local

# 编辑 .env.local 文件，配置必要的环境变量
```

4. 数据库初始化
```bash
pnpm prisma db push
```

5. 启动开发服务器
```bash
pnpm dev
```

访问 http://localhost:3000 查看应用

## 项目结构

```
根目录/
├── src/               # 源代码目录
│   ├── app/          # 页面路由
│   │   ├── (main)/   # 主布局组（需要侧边栏的页面）
│   │   │   ├── layout.tsx    # 主布局（包含侧边栏和导航）
│   │   │   ├── page.tsx      # 根页面（重定向到dashboard）
│   │   │   ├── dashboard/    # 仪表盘页面
│   │   │   ├── funding/      # 资金填报页面
│   │   │   │   ├── page.tsx  # 填报首页
│   │   │   │   ├── predict/  # 需求预测
│   │   │   │   ├── actual/   # 实际支付
│   │   │   │   └── audit/    # 财务审核
│   │   │   ├── analysis/     # 数据分析页面
│   │   │   │   ├── page.tsx  # 分析首页
│   │   │   │   ├── dashboard/# 分析看板
│   │   │   │   └── query/    # 数据查询
│   │   │   └── management/   # 管理页面
│   │   │       ├── page.tsx  # 管理首页
│   │   │       ├── organizations/ # 机构管理
│   │   │       ├── projects/     # 项目管理
│   │   │       └── users/        # 用户管理
│   │   ├── login/      # 登录页面（独立布局）
│   │   │   ├── layout.tsx # 登录布局
│   │   │   └── page.tsx   # 登录页面
│   │   ├── api/       # API路由
│   │   │   ├── auth/  # 认证相关API
│   │   │   └── ...    # 其他API
│   │   ├── layout.tsx # 根布局
│   │   └── globals.css # 全局样式
│   ├── components/    # 组件
│   │   ├── ui/       # UI基础组件
│   │   ├── user-nav.tsx  # 用户导航组件
│   │   ├── main-nav.tsx  # 主导航组件
│   │   └── role-based-ui.tsx # 基于角色的UI控制组件
│   ├── lib/          # 工具函数
│   │   ├── auth/     # 认证相关
│   │   │   ├── types.ts    # 权限类型定义
│   │   │   ├── guards.ts   # 权限守卫
│   │   │   └── utils.ts    # 认证工具函数
│   │   ├── services/ # 服务层
│   │   │   ├── auth.service.ts    # 认证服务
│   │   │   ├── organization.service.ts # 机构服务
│   │   │   ├── project.service.ts # 项目服务
│   │   │   └── record.service.ts  # 记录服务
│   │   ├── prisma.ts # Prisma客户端（单例模式）
│   │   ├── auth.tsx  # 认证相关工具函数
│   │   └── utils.ts  # 通用工具函数
│   ├── hooks/        # 自定义Hook
│   └── styles/       # 样式文件
├── prisma/           # Prisma配置和模型
│   ├── schema.prisma # 数据库模型定义
│   └── seed.ts      # 种子数据脚本
├── public/           # 静态资源
├── __tests__/        # 测试文件
└── Dev/             # 开发文档
    ├── API.md       # API文档
    ├── FEATURES.md  # 功能说明文档
    ├── PROGRESS.md  # 进度文档
    └── ...          # 其他文档
```

## 开发指南

### 技术栈
- 前端框架: Next.js 14 (App Router)
- UI 框架: TailwindCSS + Shadcn UI
- 状态管理: React Context + Hooks
- 数据库: Prisma + SQLite
- 认证: NextAuth.js

### 开发规范
1. 代码规范
   - 使用 TypeScript 严格模式
   - 遵循 ESLint 规则
   - 使用 Prettier 格式化代码

2. 组件开发
   - 优先使用服务器组件
   - 必要时使用客户端组件（添加 "use client" 指令）
   - 组件文档化（使用 JSDoc 注释）

3. 提交规范
```bash
<type>(<scope>): <subject>

# type: feat|fix|docs|style|refactor|test|chore
# scope: 影响范围
# subject: 简短描述
```

## 部署指南

### 生产环境部署
1. 构建应用
```bash
pnpm build
```

2. 启动应用
```bash
pnpm start
```

### 使用 PM2 部署
```bash
pm2 start ecosystem.config.js
```

## 测试

### 运行测试
```bash
# 单元测试
pnpm test

# E2E 测试
pnpm test:e2e
```

## 常见问题

### 1. 开发环境问题
Q: 启动开发服务器失败
A: 检查 Node.js 版本是否满足要求，确保所有依赖安装正确

### 2. 数据库问题
Q: Prisma 迁移失败
A: 检查数据库连接配置，确保 SQLite 文件权限正确

### 3. 部署问题
Q: 生产环境构建失败
A: 检查环境变量配置，确保所有必要的配置都已设置

## 更新日志

### v0.1.0 (2024-02-25)
- 初始化项目
- 实现基础UI组件
- 添加项目管理功能

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 许可证

MIT License

## 联系方式

如有问题，请提交 Issue 或联系项目维护者。
