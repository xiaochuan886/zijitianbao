# 开发指南文档
**版本**: 1.0
**更新日期**: 2024-08-25

## 一、开发环境搭建
1. **环境要求**
   - Node.js >= 18
   - pnpm >= 8.0
   - VSCode + 推荐插件

2. **项目初始化**
```bash
# 安装依赖
pnpm install

# 环境变量配置
cp .env.example .env.local

# 数据库初始化
pnpm prisma db push

# 启动开发服务器
pnpm dev
```

## 二、技术栈规范
1. **前端技术栈**
   - Next.js 14 (App Router)
   - TailwindCSS
   - Shadcn UI
   - React Hook Form
   - TanStack Table/Query

2. **后端技术栈**
   - Next.js API Routes
   - Prisma ORM
   - SQLite
   - NextAuth.js

3. **开发工具**
   - TypeScript
   - ESLint
   - Prettier
   - Husky

## 三、代码规范
1. **命名规范**
   - 文件命名: 小写中划线
   - 组件命名: 大驼峰
   - 变量命名: 小驼峰
   - 常量命名: 大写下划线

2. **目录结构**
```
根目录/
├── app/                # 页面路由
│   ├── (main)/        # 主布局组（需要侧边栏的页面）
│   │   ├── layout.tsx # 主布局（包含侧边栏和导航）
│   │   ├── page.tsx   # 根页面（重定向到dashboard）
│   │   ├── dashboard/ # 仪表盘页面
│   │   ├── funding/   # 资金填报页面
│   │   ├── analysis/  # 数据分析页面
│   │   └── management/ # 管理页面
│   ├── login/         # 登录页面（独立布局）
│   ├── api/          # API路由
│   ├── layout.tsx    # 根布局
│   └── globals.css   # 全局样式
├── components/        # 组件
│   ├── ui/           # UI基础组件
│   ├── user-nav.tsx  # 用户导航组件
│   ├── main-nav.tsx  # 主导航组件
│   └── role-based-ui.tsx # 基于角色的UI控制组件
├── lib/              # 工具函数
│   ├── auth/         # 认证相关
│   │   ├── types.ts  # 权限类型定义
│   │   ├── guards.ts # 权限守卫
│   │   └── utils.ts  # 认证工具函数
│   ├── services/     # 服务层
│   │   ├── auth.service.ts    # 认证服务
│   │   ├── organization.service.ts # 机构服务
│   │   ├── project.service.ts # 项目服务
│   │   └── record.service.ts  # 记录服务
│   ├── prisma.ts     # Prisma客户端（单例模式）
│   ├── auth.tsx      # 认证相关工具函数
│   └── utils.ts      # 通用工具函数
├── hooks/            # 自定义Hook
├── styles/           # 样式文件
├── prisma/           # Prisma配置和模型
├── public/           # 静态资源
├── __tests__/        # 测试文件
└── Dev/             # 开发文档
```

3. **代码风格**
   - 使用 TypeScript 严格模式
   - 优先使用函数组件和Hooks
   - 遵循 ESLint 规则
   - 编写单元测试

## 四、开发流程
1. **分支管理**
   - main: 主分支
   - dev: 开发分支
   - feature/*: 功能分支
   - hotfix/*: 紧急修复

2. **提交规范**
```bash
# 提交格式
<type>(<scope>): <subject>

# 类型
feat: 新功能
fix: 修复
docs: 文档
style: 格式
refactor: 重构
test: 测试
chore: 其他
```

3. **代码审查**
   - 提交前自测
   - 代码评审
   - 自动化测试通过

## 五、发布流程
1. **测试环境**
   - 自动化测试
   - 性能测试
   - 兼容性测试

2. **预发布环境**
   - 功能验证
   - 数据迁移
   - 回滚机制

3. **生产环境**
   - 版本管理
   - 监控告警
   - 备份恢复

## 开发登录功能指南

### 1. 环境准备
```bash
# 安装依赖
pnpm install

# 初始化数据库
pnpm prisma generate
pnpm prisma migrate dev
pnpm db:seed

# 启动开发服务器
pnpm dev
```

### 2. 测试账户
使用以下任意账户进行测试：
- 管理员: admin@example.com / admin123
- 财务: finance@example.com / finance123
- 填报员: reporter@example.com / reporter123
- 审核员: auditor@example.com / auditor123
- 观察者: observer@example.com / observer123

### 3. 开发注意事项
- 确保.env文件中配置了正确的DATABASE_URL和JWT_SECRET
- 使用Prisma Studio查看数据库：pnpm prisma studio
- 使用单例模式实例化Prisma客户端
- 遵循API文档规范进行开发
- 确保错误处理完整性
- 注意密码加密和token安全

### 4. 调试方法
- 使用浏览器开发工具查看网络请求
- 检查localStorage中的token存储
- 查看服务器端日志输出
- 使用Prisma Studio验证数据 