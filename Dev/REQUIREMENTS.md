我理解了业务流程，现在我来帮你更新需求文档。主要需要增加以下几个重要模块：

1. 用户角色与权限
2. 机构与项目管理
3. 填报流程的详细说明
4. 系统配置
5. 数据分析功能

让我帮你修改 REQUIREMENTS.md：

```markdown:form-system/REQUIREMENTS.md
# 资金计划填报系统需求文档
**版本**：3.0  
**最后更新**：2024-08-25  
**技术栈**：Next.js 14 + Prisma + SQLite + NextAuth

## 一、系统概述
本系统为多组织架构下的资金计划填报平台，支持多角色协作的资金计划填报、审核和分析。

### 核心特点
- 多角色协作填报流程
- 机构化的项目管理
- 双重财务审核机制
- 灵活的数据分析功能

## 二、角色定义

### 1. 系统角色
- 管理员：系统配置、机构管理、项目管理权限
- 填报人：项目资金需求预测填报权限、实际支付填报权限
- 填报财务：实际支付金额填报权限
- 审核财务：实际支付金额审核权限
- 观察员：数据查看权限

### 2. 权限矩阵
| 功能模块 | 管理员 | 填报人 | 填报财务 | 审核财务 | 观察员 |
|---------|--------|--------|-----------|-----------|--------|
| 机构管理 | ✓ | - | - | - | - |
| 项目管理 | ✓ | - | - | - | - |
| 需求预测 | - | ✓ | - | - | - |
| 实际支付 | - | ✓ | ✓ | ✓ | - |
| 数据查询 | ✓ | 本人 | 本机构 | 本机构 | 本机构 |

## 三、功能模块

### 1. 机构管理
- 机构信息维护（名称、编码）
- 项目专班/部门管理
- 资金需求类型管理

### 2. 项目管理
- 项目基本信息维护
- 多机构项目关联
- 子项目管理
- 子项目资金需求类型管理
- 项目状态管理（活跃/归档）
- 项目开始年份管理

### 3. 资金填报
#### 3.1 需求预测填报
- 批量项目选择
- 按月填报预测
- 多人填报记录
- 截止日期控制
- 撤回申请

#### 3.2 实际支付填报
- 双重填报机制（填报人+填报财务）
- 数据比对功能
- 审核流程
- 撤回申请

### 4. 数据分析
#### 4.1 数据查询
- 拖拽式查询界面
- 多维度筛选
- 数据导出功能
- 权限化数据展示

#### 4.2 数据看板
- 可视化图表配置
- 卡片式布局
- 自定义样式
- 实时数据更新

## 四、技术实现

### 1. 数据库设计
```prisma
model Organization {
  id          String   @id @default(cuid())
  name        String   // 机构名称
  code        String   // 机构编码
  departments Department[]
  projects    Project[]
}

model Department {
  id             String   @id @default(cuid())
  name           String   // 部门名称
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  projects       Project[]
}

model Project {
  id          String   @id @default(cuid())
  name        String   // 项目名称
  status      String   // active/archived
  organizations Organization[]
  departments   Department[]
  subProjects   SubProject[]
}

model SubProject {
  id          String   @id @default(cuid())
  name        String   // 子项目名称
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  fundTypes   FundType[]
  records     Record[]
}

model FundType {
  id          String   @id @default(cuid())
  name        String   // 资金需求类型
  subProjects SubProject[]
}

model Record {
  id          String   @id @default(cuid())
  subProjectId String
  subProject   SubProject @relation(fields: [subProjectId], references: [id])
  year        Int
  month       Int
  predicted   Float?   // 预测金额
  actualUser  Float?   // 填报人实际金额
  actualFinance Float? // 财务实际金额
  auditResult Float?   // 审核结果
  status      String   // draft/submitted/approved
  submittedBy String   // 提交人
  submittedAt DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model SystemConfig {
  id          String   @id @default(cuid())
  key         String   @unique
  value       String
  updatedAt   DateTime @updatedAt
}
```

### 2. 接口设计
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/organizations` | GET/POST/PUT | 机构管理 |
| `/api/projects` | GET/POST/PUT | 项目管理 |
| `/api/records/predict` | POST | 预测填报 |
| `/api/records/actual` | POST | 实际填报 |
| `/api/records/audit` | POST | 审核处理 |
| `/api/analysis/query` | POST | 数据查询 |
| `/api/dashboard` | GET/POST | 看板管理 |

## 五、非功能需求

### 1. 性能要求
- 表格渲染和编辑响应时间 < 100ms
- 批量保存响应时间 < 2s
- 数据分析查询响应时间 < 3s

### 2. 安全要求
- 基于角色的访问控制（RBAC）
  1. 用户身份认证
  2. 机构级数据隔离
  3. 操作权限精细控制
- 操作日志记录
  1. 记录关键操作行为
  2. 记录数据变更历史
  3. 支持操作审计追踪
- 数据访问安全
  1. API 接口访问控制
  2. 数据库访问白名单
  3. 提供数据分析视图
  4. 支持第三方工具对接

### 3. 可用性要求
- 支持Excel导入导出
- 响应式界面设计
- 操作引导提示

## 六、版本历史
| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 2.0 | 2024-08-23 | 初始版本 |
| 2.1 | 2024-08-24 | 增加表格交互设计 |
| 2.2 | 2024-08-24 | 更新数据库设计 |
| 3.0 | 2024-08-25 | 完善业务流程与角色权限 |
```

