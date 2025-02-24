# 数据库设计文档
**版本**: 1.0
**更新日期**: 2024-08-25

## 一、数据库模型

### 1. 用户与权限
```prisma
// 用户表
model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  password      String    // 加密存储
  organizationId String?
  organization  Organization? @relation(fields: [organizationId], references: [id])
  role          Role      @default(REPORTER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

// 角色枚举
enum Role {
  ADMIN
  REPORTER
  FINANCE
  AUDITOR
  OBSERVER
}
```

### 2. 组织架构
```prisma
// 机构表
model Organization {
  id          String   @id @default(cuid())
  name        String
  code        String   @unique
  departments Department[]
  users       User[]
  projects    Project[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// 部门表
model Department {
  id             String   @id @default(cuid())
  name           String
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  projects       Project[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

### 3. 项目管理
```prisma
// 项目表
model Project {
  id            String   @id @default(cuid())
  name          String
  status        String   // active/archived
  startYear     Int
  organizations Organization[]
  departments   Department[]
  subProjects   SubProject[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

// 子项目表
model SubProject {
  id          String   @id @default(cuid())
  name        String
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  fundTypes   FundType[]
  records     Record[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// 资金需求类型表
model FundType {
  id          String   @id @default(cuid())
  name        String
  subProjects SubProject[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 4. 资金记录
```prisma
// 记录表
model Record {
  id            String   @id @default(cuid())
  subProjectId  String
  subProject    SubProject @relation(fields: [subProjectId], references: [id])
  year          Int
  month         Int
  predicted     Float?   // 预测金额
  actualUser    Float?   // 填报人实际金额
  actualFinance Float?   // 财务实际金额
  auditResult   Float?   // 审核结果
  status        String   // draft/submitted/approved
  submittedBy   String   // 提交人ID
  submittedAt   DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([subProjectId, year, month])
}
```

## 二、索引设计

### 1. 主键索引
- 所有表使用cuid作为主键
- 使用@id标注主键

### 2. 唯一索引
```prisma
// 机构编码唯一索引
@@unique([code])

// 记录唯一索引
@@unique([subProjectId, year, month])
```

### 3. 外键索引
- 所有关联字段自动创建索引
- 多对多关系通过中间表实现

## 三、数据迁移

### 1. 迁移命令
```bash
# 生成迁移文件
pnpm prisma migrate dev --name init

# 应用迁移
pnpm prisma migrate deploy

# 重置数据库
pnpm prisma migrate reset
```

### 2. 数据备份
```bash
# 导出数据
pnpm prisma db pull

# 导入数据
pnpm prisma db push
```

## 四、性能优化

### 1. 查询优化
- 使用复合索引
- 避免N+1查询
- 使用分页查询

### 2. 缓存策略
- 使用Redis缓存热数据
- 实现缓存自动失效
- 防止缓存击穿

## 五、数据安全

### 1. 访问控制
- 基于角色的访问控制
- 数据行级权限
- SQL注入防护

### 2. 数据备份
- 定时全量备份
- 增量备份策略
- 备份文件加密

## 索引规范
### 必须创建的复合索引
```prisma
model Record {
  @@index([year, month]) // 按年月查询
  @@index([projectId, status]) // 项目状态查询
}
```

### 禁止的索引类型
- 全文索引（使用专用搜索服务）
- 超过3列的复合索引 