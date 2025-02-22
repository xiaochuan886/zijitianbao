# 部署文档
**版本**: 1.0
**更新日期**: 2024-08-25

## 一、部署环境

### 1. 环境要求
- Node.js >= 18
- SQLite 3
- PM2 (生产环境)

### 2. 环境变量
```env
# .env.production
DATABASE_URL="file:./prod.db"
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your-secret"
```

## 二、部署流程

### 1. 构建应用
```bash
# 安装依赖
pnpm install

# 数据库迁移
pnpm prisma migrate deploy

# 构建应用
pnpm build
```

### 2. 启动服务
```bash
# 开发环境
pnpm dev

# 生产环境
pnpm start
```

### 3. PM2配置
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'funding-system',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

## 三、监控配置

### 1. 性能监控
- CPU使用率
- 内存使用
- 响应时间
- 错误率

### 2. 日志管理
```bash
# 日志目录结构
logs/
  ├── access.log    # 访问日志
  ├── error.log     # 错误日志
  └── app.log       # 应用日志
```

### 3. 告警配置
- 服务器资源告警
- 应用异常告警
- 业务指标告警

## 四、备份策略

### 1. 数据备份
```bash
# 自动备份脚本
#!/bin/bash
DATE=$(date +%Y%m%d)
cp ./prod.db ./backup/prod_$DATE.db
```

### 2. 备份计划
- 每日增量备份
- 每周全量备份
- 异地备份存储

## 五、回滚方案

### 1. 版本回滚
```bash
# 回滚到指定版本
git checkout v1.0.0
pnpm install
pnpm build
pm2 restart funding-system
```

### 2. 数据回滚
```bash
# 恢复数据库
cp ./backup/prod_20240825.db ./prod.db
```

## 六、CI/CD配置

### 1. GitHub Actions
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: pnpm install
      - run: pnpm test
      - run: pnpm build
      # 部署步骤
```

### 2. 自动化测试
- 单元测试
- 集成测试
- E2E测试

## 七、运维文档

### 1. 常见问题
- 服务启动失败
- 数据库连接异常
- 性能问题处理

### 2. 运维操作
- 日志查看
- 服务重启
- 数据备份恢复 