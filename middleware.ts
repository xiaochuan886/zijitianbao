import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { PermissionCache } from './lib/auth/cache'
import { PermissionAudit } from './lib/auth/audit'
import { PermissionMonitor } from './lib/auth/monitor'
import { createPermissionError, handlePermissionError } from './lib/auth/errors'
import { Permission } from './lib/auth/types'

// 自定义错误类型
interface CustomError extends Error {
  statusCode?: number
}

// Session类型
interface Session {
  userId: string
  organizationId?: string
}

// 受保护的路由及其所需权限
const PROTECTED_ROUTES: Record<string, Permission[]> = {
  '/api/organizations': [{ resource: 'organization', action: 'read', scope: 'all' }],
  '/api/organizations/create': [{ resource: 'organization', action: 'create', scope: 'all' }],
  '/api/projects': [{ resource: 'project', action: 'read', scope: 'organization' }],
  '/api/projects/create': [{ resource: 'project', action: 'create', scope: 'organization' }],
  '/api/records': [{ resource: 'record', action: 'read', scope: 'organization' }],
  '/api/records/create': [{ resource: 'record', action: 'create', scope: 'self' }],
}

// 中间件配置
export const config = {
  matcher: '/api/:path*',
}

// 解析session
function parseSession(authHeader: string | null): Session | null {
  if (!authHeader) return null
  try {
    // 这里应该根据实际的token格式进行解析
    return {
      userId: 'user-id',
      organizationId: 'org-id'
    }
  } catch {
    return null
  }
}

// 中间件函数
export default async function middleware(request: NextRequest) {
  const startTime = Date.now()
  let error: CustomError | null = null
  let currentSession: Session | null = null

  try {
    // 1. 检查是否是API请求
    if (!request.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.next()
    }

    // 2. 获取路由所需权限
    const requiredPermissions = PROTECTED_ROUTES[request.nextUrl.pathname]
    if (!requiredPermissions) {
      return NextResponse.next()
    }

    // 3. 获取用户会话
    const authHeader = request.headers.get('authorization')
    currentSession = parseSession(authHeader)
    if (!currentSession) {
      throw createPermissionError('UNAUTHORIZED')
    }

    // 4. 从缓存获取用户权限
    const userPermissions = PermissionCache.getUserPermissions(currentSession.userId)

    // 5. 检查权限
    const hasPermission = requiredPermissions.every(required =>
      userPermissions?.some(
        permission =>
          permission.resource === required.resource &&
          permission.action === required.action &&
          (permission.scope === 'all' ||
            (permission.scope === required.scope &&
              (required.scope !== 'organization' || currentSession?.organizationId)))
      )
    )

    if (!hasPermission) {
      throw createPermissionError('INSUFFICIENT_PERMISSIONS')
    }

    // 6. 记录审计日志
    await PermissionAudit.logCheck({
      userId: currentSession.userId,
      resource: request.nextUrl.pathname,
      permissions: requiredPermissions,
      result: true,
      duration: Date.now() - startTime,
    })

    // 7. 记录性能指标
    PermissionMonitor.recordCheck(Date.now() - startTime)

    return NextResponse.next()
  } catch (err) {
    error = handlePermissionError(err) as CustomError

    // 记录错误审计日志
    await PermissionAudit.logError({
      userId: currentSession?.userId || 'unknown',
      resource: request.nextUrl.pathname,
      error: error.message,
    })

    // 记录性能指标（包含错误）
    PermissionMonitor.recordCheck(Date.now() - startTime, true)

    // 返回错误响应
    return new NextResponse(
      JSON.stringify({
        code: error.statusCode || 500,
        message: error.message,
        timestamp: new Date().toISOString(),
      }),
      {
        status: error.statusCode || 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
} 