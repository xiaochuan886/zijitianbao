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
│   │   │   │   │   ├── page.tsx    # 预测列表页
│   │   │   │   │   ├── columns.tsx # 列表表格列定义
│   │   │   │   │   └── edit/       # 预测编辑页
│   │   │   │   │       └── page.tsx # 预测编辑页面
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

## 功能说明

### 资金需求预测填报

资金需求预测填报功能允许用户对未来月份的资金需求进行预测和填报。主要功能包括：

1. **项目列表查看**：用户可以查看所有需要填报的项目，并根据机构、部门、项目名称和状态进行筛选。
2. **批量填报**：用户可以选择多个项目进行批量填报。
3. **自动保存**：在填报过程中，系统会自动保存用户的输入，防止数据丢失。
4. **批量提交**：用户可以选择多个已填报的项目进行批量提交。

### 数据结构

资金需求预测填报功能涉及以下数据表：

- **Project**：项目表，包含项目基本信息。
- **SubProject**：子项目表，一个项目可以包含多个子项目。
- **FundType**：资金需求类型表，定义不同的资金需求类型。
- **Record**：记录表，存储每个子项目在特定月份的资金需求预测数据，包括预测金额和备注信息。

### API接口

资金需求预测填报功能提供以下API接口：

1. **GET /api/funding/predict**：获取资金需求预测项目列表。
   - 参数：organizationId, departmentId, projectName, status, year, month
   - 返回：项目列表，包含项目ID、名称、机构、部门、状态等信息

2. **GET /api/funding/predict/[id]**：获取特定项目的详细信息。
   - 参数：id (路径参数), year, month (查询参数)
   - 返回：项目详情，包含子项目、资金类型和历史记录等信息

3. **POST /api/funding/predict/save**：保存资金需求预测草稿。
   - 参数：records (记录ID和金额的映射), remarks (记录ID和备注的映射)
   - 返回：成功或失败信息

4. **POST /api/funding/predict/submit**：提交资金需求预测。
   - 参数：records (记录ID和金额的映射), remarks (记录ID和备注的映射)
   - 返回：成功或失败信息

5. **POST /api/funding/predict/batch-submit**：批量提交资金需求预测。
   - 参数：projectIds (项目ID数组), year, month
   - 返回：成功或失败信息，以及提交的记录数量

### 使用方法

1. 在项目列表页面，用户可以查看所有需要填报的项目，并使用筛选条件过滤项目。
2. 选择一个或多个项目，点击"批量填报"按钮进入填报页面。
3. 在填报页面，用户可以为每个子项目的不同资金类型输入预测金额和备注。
4. 系统会自动保存用户的输入，用户也可以手动点击"保存"按钮保存草稿。
5. 填报完成后，用户可以点击"提交"按钮提交数据，提交后的数据将不能再次修改。
6. 用户也可以在项目列表页面选择多个已填报的项目，点击"批量提交"按钮进行批量提交。

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

### v0.3.0 (2024-02-28)
- 添加资金需求预测填报功能
  - 项目表单展示与筛选
  - 表格化填报界面
  - 自动保存草稿
  - 批量编辑与提交
  - 数据校验与锁定

### v0.2.1 (2024-02-27)
- 优化机构管理功能
  - 改进部门管理交互体验
    - 统一部门管理入口
    - 优化按钮布局和样式
  - 完善部门管理功能
    - 修复部门列表显示问题
    - 优化部门编辑体验
    - 完善错误处理和提示
  - 代码质量改进
    - 优化组件结构
    - 改进状态管理
    - 完善类型定义
  - 文档更新
    - 更新项目文档
    - 完善开发指南

### v0.2.0 (2024-02-26)
- 添加机构管理功能
  - 机构列表管理（支持分页和搜索）
  - 机构信息的增删改
  - 部门批量管理
  - 基于角色的数据权限控制
- 优化用户体验
  - 添加加载状态
  - 完善错误处理
  - 优化表单验证
- 技术改进
  - 使用 TanStack Table
  - 实现响应式设计
  - 优化 API 结构

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
