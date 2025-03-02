# 认证系统迁移指南

## 背景

我们正在将系统从自定义JWT认证迁移到标准的NextAuth.js认证系统。这将带来以下好处：

1. 更安全、更可靠的认证机制
2. 更简单的会话管理
3. 内置的CSRF保护
4. 与Next.js更好的集成

## 迁移步骤

### 1. API路由迁移

所有API路由需要从使用 `parseSession` 改为使用 `getServerSession`：

#### 旧代码:

```typescript
import { parseSession } from '@/lib/auth/session';
import { checkPermission } from '@/lib/auth/permission';

export async function GET(req: NextRequest) {
  const session = parseSession(req.headers.get('authorization'));
  
  const hasPermission = await checkPermission(
    session,
    { resource: 'project', action: 'read', scope: 'all' }
  );
  
  if (!hasPermission) {
    return Response.json({ error: '权限不足' }, { status: 403 });
  }
  
  // 业务逻辑...
}
```

#### 新代码:

```typescript
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return Response.json({ error: '未授权访问' }, { status: 401 });
  }
  
  // 对于管理员权限
  if (session.user.role !== 'ADMIN') {
    // 检查用户是否有权限访问资源
    const userHasAccess = await checkUserAccess(session.user.id, resourceId);
    
    if (!userHasAccess) {
      return Response.json({ error: '权限不足' }, { status: 403 });
    }
  }
  
  // 业务逻辑...
}
```

### 2. 组件迁移

在客户端组件中使用 `useSession` 钩子：

```typescript
'use client';

import { useSession } from 'next-auth/react';

export default function MyComponent() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') {
    return <div>加载中...</div>;
  }
  
  if (status === 'unauthenticated') {
    return <div>请先登录</div>;
  }
  
  return <div>欢迎, {session.user.name}</div>;
}
```

### 3. 服务器组件迁移

在服务器组件中使用 `getCurrentUser` 或 `requireAuth` 函数：

```typescript
import { getCurrentUser } from '@/lib/session';

export default async function ServerComponent() {
  const user = await getCurrentUser();
  
  if (!user) {
    return <div>请先登录</div>;
  }
  
  return <div>欢迎, {user.name}</div>;
}
```

## 已迁移的文件

- [x] `src/app/api/organizations/[id]/departments/route.ts`
- [x] `middleware.ts`
- [x] `src/lib/session.ts`

## 待迁移的文件

- [ ] `src/app/api/organizations/[id]/route.ts`
- [ ] `src/app/api/organizations/[id]/departments/[departmentId]/route.ts`
- [ ] `src/app/api/fund-types/route.ts`
- [ ] `src/app/api/fund-types/[id]/route.ts`
- [ ] `src/app/api/project-categories/route.ts`
- [ ] `src/app/api/project-categories/[id]/route.ts`
- [ ] `src/app/api/projects/route.ts`
- [ ] `src/app/api/projects/[id]/route.ts`
- [ ] `src/app/api/projects/[id]/archive/route.ts`
- [ ] `src/app/api/users/route.ts`
- [ ] `src/app/api/users/[id]/route.ts`
- [ ] `src/app/api/users/[id]/reset-password/route.ts`
- [ ] `src/app/api/auth/password/route.ts`

## 最终目标

当所有API路由都迁移完成后，我们将删除以下文件：

- `src/lib/auth/session.ts`
- `src/lib/auth/permission.ts`
- `src/lib/auth/errors.ts`
- `src/lib/auth/decorators.ts`

并保留以下NextAuth相关文件：

- `src/lib/auth-options.ts`
- `src/lib/session.ts`
- `src/types/next-auth.d.ts` 