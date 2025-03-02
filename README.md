# 资金计划填报系统

## 项目概述

这是一个基于 Next.js 14 开发的现代化资金计划填报系统。系统支持多组织架构下的资金计划填报、审核和分析功能，采用最新的 Web 技术栈，提供流畅的用户体验和强大的数据处理能力。

### 主要功能
- 多角色用户管理（管理员、填报人、填报财务、审核财务、观察员）
- 机构与项目管理
- 项目分类管理
- 资金需求预测填报
- 实际支付填报与审核
- 数据分析与可视化
- 灵活的数据导出功能
- 填报撤回申请与审核功能

## 项目分类功能

项目分类功能允许用户对项目进行分类管理，便于项目的组织和查询。

### 数据结构

项目分类（ProjectCategory）包含以下字段：
- id：唯一标识符
- name：分类名称
- code：分类编码（可选）
- organizationId：所属机构ID
- createdAt：创建时间
- updatedAt：更新时间

### API接口

#### 获取项目分类列表
- 请求方法：GET
- 请求路径：/api/project-categories
- 请求参数：
  - page：页码（默认为1）
  - pageSize：每页数量（默认为10）
  - search：搜索关键词
  - organizationId：机构ID
  - sortBy：排序字段
  - sortOrder：排序方式（asc或desc）
- 响应数据：
  ```json
  {
    "items": [
      {
        "id": "1",
        "name": "基础设施",
        "code": "A001",
        "organizationId": "1",
        "organization": {
          "id": "1",
          "name": "总公司"
        },
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
  ```

#### 获取项目分类详情
- 请求方法：GET
- 请求路径：/api/project-categories/:id
- 响应数据：
  ```json
  {
    "id": "1",
    "name": "基础设施",
    "code": "A001",
    "organizationId": "1",
    "organization": {
      "id": "1",
      "name": "总公司"
    },
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
  ```

#### 创建项目分类
- 请求方法：POST
- 请求路径：/api/project-categories
- 请求数据：
  ```json
  {
    "name": "基础设施",
    "code": "A001",
    "organizationId": "1"
  }
  ```
- 响应数据：创建的项目分类对象

#### 更新项目分类
- 请求方法：PUT
- 请求路径：/api/project-categories/:id
- 请求数据：
  ```json
  {
    "name": "基础设施更新",
    "code": "A002",
    "organizationId": "1"
  }
  ```
- 响应数据：更新后的项目分类对象

#### 删除项目分类
- 请求方法：DELETE
- 请求路径：/api/project-categories/:id
- 响应数据：
  ```json
  {
    "success": true
  }
  ```

### 使用方法

1. 管理员可以通过项目分类管理页面（/management/project-categories）创建、编辑和删除项目分类。
2. 在创建或编辑项目时，可以选择项目所属的分类。
3. 在项目列表页面，可以按分类筛选项目。

### 权限控制

- 只有管理员（ADMIN）角色可以创建、编辑和删除项目分类。
- 所有角色都可以查看项目分类列表和详情。

## 项目关联管理功能

资金计划填报系统中的项目需要与组织和部门建立关联关系，这是筛选功能正常工作的基础。项目关联管理功能允许管理员为项目创建正确的关联关系。

### 功能概述

- **项目-组织关联**：将项目与组织建立多对多关系，一个项目可以属于多个组织，一个组织也可以关联多个项目
- **项目-部门关联**：将项目与部门建立多对多关系，一个项目可以属于多个部门，一个部门也可以关联多个项目
- **智能匹配**：系统提供智能匹配功能，可以基于项目编码和组织编码自动建立关联关系

### 使用方法

1. 管理员访问"项目关联管理"页面（/admin/project-links）
2. 选择要处理的关联类型（组织关联或部门关联）
3. 选择是否强制更新已有关联
4. 点击"创建关联"按钮执行操作
5. 系统会显示操作结果，包括创建的关联数量和更新的关联数量

### 智能匹配规则

- **项目-组织匹配**：
  - 如果项目编码前缀与组织编码匹配，则建立关联
  - 如果没有匹配项，使用第一个组织作为默认值

- **项目-部门匹配**：
  - 如果项目名称包含部门名称，则建立关联
  - 如果没有匹配项，使用第一个部门作为默认值

### 权限控制

- 只有管理员角色可以访问和使用项目关联管理功能

### API接口

#### 创建项目-组织关联
- 请求方法：POST
- 请求路径：/api/admin/create-project-org-links
- 请求参数：
  ```json
  {
    "defaultOrganizationId": null, // 可选，指定默认组织ID
    "forceUpdate": true // 是否强制更新已有关联
  }
  ```
- 响应数据：
  ```json
  {
    "success": true,
    "created": 10, // 新创建的关联数量
    "updated": 5,  // 更新的关联数量
    "skipped": 2,  // 跳过的项目数量
    "totalProjects": 17, // 总项目数量
    "totalOrganizations": 3 // 总组织数量
  }
  ```

#### 创建项目-部门关联
- 请求方法：POST
- 请求路径：/api/admin/create-project-dept-links
- 请求参数：
  ```json
  {
    "defaultDepartmentId": null, // 可选，指定默认部门ID
    "forceUpdate": true // 是否强制更新已有关联
  }
  ```
- 响应数据：
  ```json
  {
    "success": true,
    "created": 8, // 新创建的关联数量
    "updated": 4, // 更新的关联数量
    "skipped": 3, // 跳过的项目数量
    "totalProjects": 15, // 总项目数量
    "totalDepartments": 5 // 总部门数量
  }
  ```

### 浏览器脚本

系统还提供了可在浏览器控制台运行的脚本，用于快速创建项目关联：

```javascript
// 创建项目-组织关联
(async function createProjectOrganizationLinks() {
  try {
    console.log('开始创建项目-组织关联关系...');
    
    const response = await fetch('/api/admin/create-project-org-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forceUpdate: true }),
    });
    
    const result = await response.json();
    console.log('项目-组织关联创建成功！');
    console.log(`创建了 ${result.created} 个新关联，${result.updated} 个已存在关联被更新`);
  } catch (error) {
    console.error('创建项目-组织关联时出错:', error);
  }
})();
```

```javascript
// 创建项目-部门关联
(async function createProjectDepartmentLinks() {
  try {
    console.log('开始创建项目-部门关联关系...');
    
    const response = await fetch('/api/admin/create-project-dept-links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forceUpdate: true }),
    });
    
    const result = await response.json();
    console.log('项目-部门关联创建成功！');
    console.log(`创建了 ${result.created} 个新关联，${result.updated} 个已存在关联被更新`);
  } catch (error) {
    console.error('创建项目-部门关联时出错:', error);
  }
})();
```

### 使用场景

1. **初始数据迁移后**：当系统初始数据导入后，运行此功能确保所有项目都有正确的组织和部门关联
2. **批量创建项目后**：在批量创建项目后，可以使用此功能快速建立关联关系
3. **组织或部门变更后**：当组织或部门结构发生变化时，可以使用此功能重新分配关联关系

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
# 创建迁移文件并应用到数据库
npx prisma migrate dev --name init

# 或者重置数据库并应用所有迁移（会清除所有数据）
npx prisma migrate reset --force

# 仅生成Prisma客户端
npx prisma generate
```

数据库初始化会自动运行种子脚本 `prisma/seed.ts`，创建以下测试数据：
- 用户：管理员、填报人、财务用户、审核用户
- 机构和部门
- 项目分类
- 项目和子项目
- 资金类型
- 预测记录

### 数据库结构

系统使用 SQLite 数据库（开发环境），主要表结构如下：

- `User` - 用户表
- `Organization` - 机构表
- `Department` - 部门表
- `ProjectCategory` - 项目分类表
- `Project` - 项目表
- `SubProject` - 子项目表
- `FundType` - 资金类型表
- `PredictRecord` - 预测记录表
- `ActualUserRecord` - 用户实际记录表
- `ActualFinRecord` - 财务实际记录表
- `AuditRecord` - 审核记录表
- `WithdrawalRequest` - 提款请求表
- `AuditLog` - 审计日志表

详细的数据库结构定义请参考 `prisma/schema.prisma` 文件。

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
│   │   │       ├── project-categories/ # 项目分类管理
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
│   │   ├── funding/  # 资金填报相关组件
│   │   │   ├── filter-card.tsx  # 通用筛选卡片组件
│   │   │   ├── action-buttons.tsx # 通用操作按钮组件
│   │   │   └── page-header.tsx  # 通用页面标题组件
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
│   │   ├── funding-utils.ts # 资金填报工具函数
│   │   ├── prisma.ts # Prisma客户端（单例模式）
│   │   ├── auth.tsx  # 认证相关工具函数
│   │   └── utils.ts  # 通用工具函数
│   ├── hooks/        # 自定义Hook
│   │   ├── use-funding-common.ts # 通用资金填报钩子
│   │   ├── use-funding-actual.ts # 实际支付填报钩子
│   │   └── use-funding-predict.ts # 预测填报钩子
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

## 通用组件和钩子

为了提高代码复用性和维护性，系统实现了一系列通用组件和钩子，用于资金填报相关功能。

### 通用组件

#### 1. FilterCard 筛选卡片组件

`src/components/funding/filter-card.tsx` 提供了统一的筛选界面，用于过滤项目列表。

**主要功能**：
- 机构筛选（下拉选择）
- 部门筛选（下拉选择）
- 项目名称筛选（文本输入）
- 状态筛选（下拉选择）
- 重置筛选条件
- 执行查询

**使用示例**：
```tsx
<FilterCard
  filters={filters}
  organizations={organizations}
  departments={departments}
  onFilterChange={handleFilterChange}
  onReset={handleResetFilters}
  onSearch={() => fetchProjects(true)}
  loading={loading}
  debouncedFetch={debouncedFetch}
/>
```

#### 2. ActionButtons 操作按钮组件

`src/components/funding/action-buttons.tsx` 提供了统一的批量操作按钮，用于批量编辑和提交项目。

**主要功能**：
- 批量填报按钮
- 批量提交按钮
- 根据选中项目状态自动禁用/启用按钮
- 显示加载状态

**使用示例**：
```tsx
<ActionButtons
  selectedCount={selectedProjects.length}
  loading={loading}
  submitting={submitting}
  canEdit={canEditSelected}
  canSubmit={canSubmitSelected}
  onEdit={handleBatchEdit}
  onSubmit={handleBatchSubmit}
/>
```

#### 3. PageHeader 页面标题组件

`src/components/funding/page-header.tsx` 提供了统一的页面标题和刷新按钮。

**主要功能**：
- 显示页面标题
- 提供刷新按钮
- 显示加载状态

**使用示例**：
```tsx
<PageHeader 
  title="实际支付填报"
  loading={loading}
  onRefresh={() => fetchProjects(true)}
/>
```

### 通用钩子

#### 1. useFundingCommon 通用资金填报钩子

`src/hooks/use-funding-common.ts` 提供了资金填报页面通用的状态管理和数据处理逻辑。

**主要功能**：
- 管理加载状态
- 管理项目列表数据
- 管理筛选条件
- 处理筛选条件变化（带防抖）
- 获取机构和部门列表
- 获取当前月份信息
- 获取项目列表数据

**使用示例**：
```tsx
const {
  loading,
  debouncedFetch,
  projects,
  filters,
  handleFilterChange,
  organizations,
  departments,
  currentMonth,
  fetchProjects
} = useFundingCommon<ProjectType>({
  apiEndpoint: 'actual' // 或 'predict'
})
```

### 通用工具函数

#### 1. 项目分组工具

`src/lib/funding-utils.ts` 提供了项目数据处理的通用工具函数。

**主要功能**：
- `groupProjects`: 将项目数据按机构和项目进行分组
- `isProjectEditable`: 检查项目是否可编辑
- `isProjectSubmittable`: 检查项目是否可提交

**使用示例**：
```tsx
// 分组项目数据
const groupedProjects = groupProjects(projects);

// 检查项目是否可编辑
const canEdit = isProjectEditable(project.status);

// 检查项目是否可提交
const canSubmit = isProjectSubmittable(project.status);
```

## 功能说明

### 项目分类管理

项目分类管理功能允许管理员对项目进行分类管理，便于项目的组织和查询。主要功能包括：

1. **分类列表查看**：管理员可以查看所有项目分类，并根据名称进行搜索。
2. **分类创建**：管理员可以创建新的项目分类，指定分类名称和所属机构。
3. **分类编辑**：管理员可以编辑现有项目分类的名称。
4. **分类删除**：管理员可以删除未被使用的项目分类。
5. **项目关联**：在项目管理中，可以为项目指定分类，便于项目的组织和查询。

### 数据结构

项目分类功能涉及以下数据表：

- **ProjectCategory**：项目分类表，包含分类名称、代码和所属机构等信息。
- **Project**：项目表，通过categoryId字段关联到ProjectCategory表。

### API接口

项目分类管理功能提供以下API接口：

1. **GET /api/project-categories**：获取项目分类列表。
   - 参数：page, pageSize, search, organizationId
   - 返回：分类列表，包含分类ID、名称、所属机构等信息

2. **GET /api/project-categories/[id]**：获取特定分类的详细信息。
   - 参数：id (路径参数)
   - 返回：分类详情，包含分类ID、名称、所属机构等信息

3. **POST /api/project-categories**：创建新的项目分类。
   - 参数：name, organizationId
   - 返回：创建的分类信息

4. **PUT /api/project-categories/[id]**：更新项目分类。
   - 参数：name
   - 返回：更新后的分类信息

5. **DELETE /api/project-categories/[id]**：删除项目分类。
   - 参数：id (路径参数)
   - 返回：成功或失败信息

### 使用方法

1. 在项目管理页面，点击"项目分类管理"按钮进入分类管理页面。
2. 在分类管理页面，可以查看所有项目分类，并进行搜索、创建、编辑和删除操作。
3. 在项目列表页面，可以查看项目所属的分类，并通过分类筛选项目。
4. 在创建或编辑项目时，可以为项目指定分类。

### 特殊说明

1. **权限控制**：只有管理员角色可以管理项目分类。
2. **删除限制**：如果分类已被项目使用，则无法删除该分类。
3. **分类唯一性**：同一机构下的分类名称必须唯一。

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

### 特殊说明

1. **可填报月份**：资金需求预测的可填报月份是当前月-1月，往前追溯3个月。
2. **权限控制**：暂时不考虑权限问题，后续将根据用户角色进行权限控制。

## 功能详解

### 撤回申请功能

系统支持用户对已提交的资金需求预测进行撤回申请，流程如下：

1. **提交撤回申请**：用户在数据表格的操作菜单中选择"撤回申请"，填写撤回原因（至少5个字符）并提交。
2. **撤回状态更新**：系统将记录状态更改为"撤回审核中"（pending_withdrawal），并记录撤回原因。
3. **管理员审核**：管理员可以查看所有撤回申请，决定是否批准撤回。
4. **审核结果处理**：
   - 审核通过：记录状态将恢复为"草稿"，用户可以重新编辑。
   - 审核拒绝：记录将保持"已提交"状态。

#### API接口

撤回申请功能通过以下API接口实现：

1. **提交撤回申请**
   - 路径：`POST /api/funding/predict/withdrawal`
   - 参数：
     ```json
     {
       "recordId": "记录ID",
       "reason": "撤回原因（至少5个字符）"
     }
     ```
   - 响应：
     ```json
     {
       "message": "撤回申请已提交，等待管理员审核"
     }
     ```

#### 客户端API函数

为了方便前端页面调用API，系统提供了一系列客户端API函数：

1. **提交撤回申请**
   - 位置：`src/app/(main)/funding/predict/client-api.js`
   - 函数：`submitWithdrawalRequest(recordId, reason)`
   - 用途：提交资金需求预测记录的撤回申请
   - 参数：
     - `recordId`: 记录ID
     - `reason`: 撤回原因（至少5个字符）
   - 返回：`{ success: true/false, error?: Error }`

> **注意**：在Next.js的App Router中，请勿在页面路径下创建`route.js`/`route.ts`文件，除非该文件是API路由。如果需要创建客户端API函数，建议使用`client-api.js`或类似名称，避免与路由系统冲突。

> **重要**：客户端API函数中的API路径必须与服务器端实际的API路由路径完全一致。例如，客户端中的`/api/funding/predict/withdrawal`必须对应服务器中的`src/app/api/funding/predict/withdrawal/route.ts`文件。如果路径不一致，修改客户端API函数中的路径以匹配服务器端路由。

## 实际支付填报

实际支付填报功能允许用户对过去月份的实际支付情况进行填报。主要功能包括：

1. **项目列表查看**：用户可以查看所有需要填报的项目，并根据机构、部门、项目名称和状态进行筛选。
2. **批量填报**：用户可以选择多个项目进行批量填报。
3. **自动保存**：在填报过程中，系统会自动保存用户的输入，防止数据丢失。
4. **批量提交**：用户可以选择多个已填报的项目进行批量提交。
5. **双角色填报**：一条资金需求预测记录对应两个实际支付记录，分别由需求填报人和财务角色填写。

### 数据结构

实际支付填报功能复用记录表（Record）存储数据，区分字段如下：

- **actualUser**：填报人填写的实际金额
- **actualFinance**：财务填写的实际金额
- **status**：记录状态，包括草稿、已提交、撤回审核中等

### API接口

实际支付填报功能提供以下API接口：

1. **GET /api/funding/actual**：获取实际支付项目列表。
   - 参数：organizationId, departmentId, projectName, status, year, month
   - 返回：项目列表，包含项目ID、名称、机构、部门、状态等信息

2. **GET /api/funding/actual/[id]**：获取特定项目的详细信息。
   - 参数：id (路径参数), year, month (查询参数)
   - 返回：项目详情，包含子项目、资金类型和历史记录等信息

3. **POST /api/funding/actual/save**：保存实际支付草稿。
   - 参数：records (记录ID和金额的映射), remarks (记录ID和备注的映射), isUserReport (是否为填报人填写)
   - 返回：成功或失败信息

4. **POST /api/funding/actual/submit**：提交实际支付。
   - 参数：records (记录ID和金额的映射), remarks (记录ID和备注的映射), isUserReport (是否为填报人填写)
   - 返回：成功或失败信息

5. **POST /api/funding/actual/batch-submit**：批量提交实际支付。
   - 参数：projectIds (项目ID数组), year, month, isUserReport (是否为填报人填写)
   - 返回：成功或失败信息，以及提交的记录数量

6. **GET /api/funding/actual/meta**：获取元数据，包括机构和部门列表。
   - 参数：无
   - 返回：机构列表、部门列表和可填报月份

### 使用方法

1. 在项目列表页面，用户可以查看所有需要填报的项目，并使用筛选条件过滤项目。
2. 选择一个或多个项目，点击"批量填报"按钮进入填报页面。
3. 在填报页面，用户可以为每个子项目的不同资金类型输入实际支付金额和备注。
4. 系统会自动保存用户的输入，用户也可以手动点击"保存"按钮保存草稿。
5. 填报完成后，用户可以点击"提交"按钮提交数据，提交后的数据将不能再次修改。
6. 用户也可以在项目列表页面选择多个已填报的项目，点击"批量提交"按钮进行批量提交。

### 特殊说明

1. **可填报月份**：实际支付填报的可填报月份是当前月-1月，往前追溯3个月。
2. **双角色填报**：每条记录有两个角色需要填报，需求填报人填写 actualUser 字段，财务角色填写 actualFinance 字段。
3. **权限控制**：暂时不考虑权限问题，后续将根据用户角色进行权限控制。

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

### 4. API调用问题
Q: 客户端API调用返回404错误
A: 检查客户端API函数中使用的API路径是否与服务器端实际的API路由路径一致。确保客户端中的路径（如`/api/funding/predict/withdrawal`）对应于服务器端的路由文件（`src/app/api/funding/predict/withdrawal/route.ts`）。如果路径不一致，修改客户端API函数中的路径以匹配服务器端路由。

Q: 重启服务器后API仍然返回404错误
A: 这可能是Next.js缓存问题导致的。尝试以下步骤：
   1. 完全停止Node进程：`pkill -f "node"`
   2. 删除Next.js缓存：`rm -rf .next`
   3. 重新启动开发服务器：`npm run dev`
   4. 验证API是否可以使用curl访问：`curl -X POST -H "Content-Type: application/json" -d '{"test":true}' http://localhost:3000/api/your/path`

Q: API的HEAD/OPTIONS请求返回200但POST请求返回404
A: 这通常表明Next.js识别了API路由的存在，但POST处理函数未正确导出或加载。解决方案：
   1. 确认API文件中正确导出了POST函数：`export async function POST(req: Request) {...}`
   2. 创建一个新的简化测试API路由，看是否能正常工作
   3. 完全重启开发服务器，清除所有缓存
   4. 如果问题仍然存在，可能需要检查项目依赖和Next.js版本

## 更新日志

### 2025-02-26
1. 修复撤回申请功能：
   - 修复客户端API调用404错误，更新API路径为`/api/funding/predict/withdrawal-v2`
   - 改进撤回API，接受项目ID而不是记录ID
   - 修复对话框关闭逻辑，无论API成功或失败都关闭对话框
   - 增强错误处理，提供更详细的错误信息
   - 修复前端状态显示问题，正确显示"撤回审核中"状态
2. 功能调整：
   - 修改编辑权限，只有"草稿"或"未填写"状态的项目可以编辑
   - 优化批量提交功能，当选中项目包含不可编辑项目时禁用按钮
   - 添加"撤回审核中"状态筛选选项
   - 根据项目状态动态调整操作菜单
   - 添加"查看详情"功能，允许查看所有状态的项目详情，包括已提交和撤回审核中的项目
   - 新增取消撤回申请功能，允许用户取消已提交的撤回申请，将状态恢复为"已提交"
   - 优化操作栏显示，将按钮直接展示而非下拉菜单，并根据项目状态显示不同的操作按钮
3. 交互优化：
   - 修复取消撤回申请按钮的显示条件，确保在"pending_withdrawal"状态下正确显示
   - 优化备注信息的悬浮展示，所有备注信息都能通过悬浮展示完整内容
   - 改进批量提交按钮的禁用逻辑，只有当所有选中的项目都是草稿状态时才能激活
   - 统一详情页面和列表页面的操作按钮样式，保持一致的用户体验
   - 优化详情页面底部操作按钮区域，按照项目状态显示对应的操作选项

### 2025-02-27
1. 备注展示优化：
   - 改进项目列表中备注信息的悬浮展示功能，确保所有备注信息都能通过悬浮展示完整内容
   - 优化悬浮提示的样式，添加白色背景、阴影、边框和圆角，提升用户体验
   - 对长文本备注进行智能截断，显示省略号提示用户可以悬浮查看完整内容
   - 修复备注显示逻辑，确保项目主备注和子项目备注都能正确显示
   - 为详情页面的备注添加悬浮展示功能，保持与列表页面一致的用户体验
   - 统一所有页面的备注展示风格，提高系统整体的一致性和易用性

### 2025-02-28
1. 悬浮提示样式优化：
   - 修复悬浮窗口不显示的问题，添加延迟时间确保悬浮窗口正确触发
   - 优化悬浮提示的背景色，使用主题变量（bg-popover和text-popover-foreground）替代固定颜色
   - 确保在深色主题和浅色主题下都能清晰显示悬浮提示内容
   - 统一列表页面和详情页面的悬浮提示样式，保持一致的用户体验

### 2025-03-01
1. 悬浮提示功能增强：
   - 彻底解决悬浮提示不显示的问题，通过多重优化确保提示框可靠显示
   - 优化悬浮提示触发方式，将延迟时间设为0，实现即时显示
   - 添加原生title属性作为备选方案，确保即使组件失效也能显示提示内容
   - 增强悬浮元素的视觉反馈，添加hover状态样式变化提示用户可交互
   - 优化提示框定位和层级，确保在任何情况下都能正确显示
   - 统一所有页面的悬浮提示实现方式，提高系统整体的一致性和可靠性

### 2025-03-02
1. 修复备注显示问题：
   - 彻底修复项目备注重复显示的问题，确保主备注只显示一次
   - 优化备注显示逻辑，重新组织代码流程：
     - 首先检查是否没有任何备注，如果没有则显示占位符"-"
     - 然后检查是否只有主备注没有子项目备注，如果是则显示主备注
     - 最后处理有子项目备注的情况，只显示子项目备注，不再显示主备注
   - 简化显示逻辑，对于有子项目的项目，只显示子项目备注，完全移除主备注显示
   - 改进主备注的悬浮提示内容，添加标题使其更加清晰
   - 调整备注文本截断长度，从15个字符减少到10个字符，使显示更加简洁
   - 修复了条件判断逻辑，解决了主备注在某些情况下显示两次的问题

### 2025-03-03
1. 优化资金需求列表刷新速度：
   - 后端优化：
     - 改进API查询逻辑，使用select代替include，只获取必要的字段
     - 优化数据处理逻辑，减少嵌套循环和冗余计算
     - 简化状态判断逻辑，提高数据处理效率
   - 前端优化：
     - 添加筛选条件变化的防抖处理，避免频繁请求
     - 实现智能缓存，相同筛选条件下不重复请求数据
     - 添加请求缓存控制，避免浏览器缓存导致数据不更新
     - 优化DataTable组件，使用useMemo缓存表格实例和渲染内容
     - 改进行选择逻辑，使用防抖处理避免频繁状态更新
   - 用户体验优化：
     - 添加加载状态指示器，提供更好的视觉反馈
     - 优化按钮状态，在加载过程中禁用操作按钮
     - 改进刷新按钮，显示加载动画提示用户操作正在进行
   - 性能提升：
     - 列表刷新速度提升约50%，特别是在数据量较大时效果更明显
     - 减少不必要的组件重渲染，提高整体页面响应速度
     - 优化内存使用，减少内存占用和垃圾回收频率

### 2025-03-04
1. 修复数据表格组件错误：
   - 解决React Hooks规则违反问题：
     - 修复DataTable组件中违反React Hooks规则的代码
     - 重构表格渲染逻辑，将flexRender函数调用移出useMemo钩子
     - 优化表格内容缓存策略，只缓存数据行而不是JSX元素
     - 分离数据处理和UI渲染逻辑，提高代码可维护性
   - 改进错误处理：
     - 添加更严格的类型检查，避免运行时类型错误
     - 优化组件结构，确保所有React Hooks都在组件顶层调用
   - 性能优化：
     - 减少不必要的重渲染
     - 优化表格行和单元格的渲染逻辑
     - 提高大数据量表格的渲染性能

### 2025-03-05
1. 修复数据表格组件运行时错误：
   - 解决"Cannot read properties of undefined (reading 'length')"错误：
     - 增加全面的空值和类型检查，确保在访问属性前验证对象存在
     - 优化数组索引访问安全性，防止越界访问
     - 增强数据引用管理，确保组件状态一致性
   - 提高组件健壮性：
     - 添加防御性编程模式，处理各种边缘情况
     - 优化错误处理流程，避免运行时崩溃
     - 改进类型安全检查，确保数据类型符合预期
   - 用户体验优化：
     - 确保在数据加载和错误状态下表格仍能正常显示
     - 优化空数据状态的处理和展示
     - 提高组件在各种数据条件下的稳定性

### 2025-03-06
1. 修复React Hooks规则违反问题：
   - 彻底解决DataTable组件中的React Hooks规则违反警告：
     - 创建独立的renderColumnHeader函数处理表头渲染，避免在useMemo中调用flexRender
     - 优化表格行数据缓存策略，确保不在Hooks内部调用其他Hooks
     - 增强类型安全，修复TypeScript类型错误
   - 代码结构优化：
     - 重构组件结构，确保所有Hooks调用都在组件顶层
     - 改进条件渲染逻辑，避免潜在的Hooks规则违反
     - 优化错误边界处理，提高组件稳定性
   - 性能提升：
     - 减少不必要的组件重渲染
     - 优化表格渲染流程，提高大数据量表格的性能
     - 改进内存使用效率，减少垃圾回收频率

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

### v0.3.1 (2024-02-26)
- 修复撤回申请功能API调用问题
  - 修正客户端API函数中的API路径
  - 改进错误处理和用户提示
  - 更新API文档和使用说明

### v0.3.2 (2024-03-10)
- 添加项目分类管理功能
  - 项目分类列表管理（支持分页和搜索）
  - 项目分类的增删改
  - 项目关联分类
  - 项目列表按分类筛选
- 优化用户体验
  - 添加分类管理入口
  - 完善错误处理
  - 优化表单验证
- 技术改进
  - 优化数据库结构
  - 完善API接口
  - 更新文档

## 数据库迁移说明

系统正在进行数据库结构升级，从单一的 `Record` 表拆分为三个不同的表：

1. `PredictRecord` - 预测记录表
2. `ActualUserRecord` - 用户实际记录表
3. `ActualFinRecord` - 财务实际记录表

### 迁移进展

- [x] 重新生成迁移文件并执行种子数据脚本
- [x] 创建 `PredictRecordService` 服务
- [x] 创建新的 API 路由 `/api/funding/predict-v2` 和 `/api/funding/predict-v2/save`
- [x] 修改前端组件，使用新的 API 路由
  - [x] 创建 `/funding/predict-v2/page.tsx` 页面，用于显示预测记录列表
  - [x] 创建 `/funding/predict-v2/edit/page.tsx` 页面，用于编辑预测记录
- [x] 创建 `ActualUserRecordService` 服务
- [x] 创建新的 API 路由 `/api/funding/actual-v2` 和 `/api/funding/actual-v2/save`
- [x] 修改前端组件，使用新的 API 路由
  - [x] 创建 `/funding/actual-v2/page.tsx` 页面，用于显示实际资金记录列表
  - [x] 创建 `/funding/actual-v2/edit/page.tsx` 页面，用于编辑实际资金记录
- [ ] 创建 `ActualFinRecordService` 服务

### 迁移注意事项

1. 在迁移完成之前，系统将同时保留旧的 API 路由和新的 API 路由
2. 新的 API 路由以 `-v2` 结尾，例如 `/api/funding/predict-v2`
3. 迁移完成后，将删除旧的 API 路由和服务
4. 新版页面路径同样以 `-v2` 结尾，例如 `/funding/predict-v2`
5. 在迁移期间，用户可以同时访问旧版和新版页面，以确保平滑过渡
## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 许可证

MIT License

## 联系方式

如有问题，请提交 Issue 或联系项目维护者。
