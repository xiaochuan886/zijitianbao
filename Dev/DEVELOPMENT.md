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
funding-system/
  ├── app/             # 页面路由
  ├── components/      # 公共组件
  ├── lib/            # 工具函数
  ├── hooks/          # 自定义Hook
  ├── types/          # 类型定义
  └── styles/         # 样式文件
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