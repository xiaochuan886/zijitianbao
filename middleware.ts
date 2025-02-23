import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/app/lib/auth/token'

// 中间件配置
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const pathname = request.nextUrl.pathname

  // 登录页面不需要验证
  if (pathname === '/login') {
    // 如果已经登录，重定向到仪表盘
    if (token) {
      try {
        const payload = await verifyToken(token)
        if (payload) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      } catch (error) {
        // Token无效，继续显示登录页面
      }
    }
    return NextResponse.next()
  }

  // API路由不需要验证
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // 验证token
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // 添加用户信息到请求头
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.id)
    requestHeaders.set('x-user-email', payload.email)
    requestHeaders.set('x-user-role', payload.role)
    if (payload.organizationId) {
      requestHeaders.set('x-organization-id', payload.organizationId)
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
} 