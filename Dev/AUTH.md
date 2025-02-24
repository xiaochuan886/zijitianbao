## 角色权限映射
```typescript
// 角色到权限的精确映射
const ROLE_MAP = {
  ADMIN: {
    resources: ['*'],
    actions: ['*'],
    scope: 'all'
  },
  REPORTER: {
    resources: ['record'],
    actions: ['create', 'read'],
    scope: 'own'  
  }
}
```

## 审计日志要求
- 记录所有敏感操作
- 保留180天
- 包含操作上下文信息 