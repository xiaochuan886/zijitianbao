import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// 中间件配置 - 这将应用于所有路由
export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了:
     * - 静态文件和图片
     * - API 路由（这些在内部处理身份验证）
     * - Auth 相关的路由（登录、注册等）
     */
    '/((?!_next/static|_next/image|favicon.ico|images|api/auth).*)',
  ],
}

export default async function middleware(request: NextRequest) {
  // 从请求中获取token，这将使用相同的逻辑来检查是否有会话
  const token = await getToken({ req: request })
  const isLoggedIn = !!token
  
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  
  // 访问登录页但已登录，重定向到首页
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  // 访问需要保护的路由但未登录，重定向到登录页
  if (!isLoggedIn && !isAuthPage && !isApiRoute) {
    const callbackUrl = request.nextUrl.pathname
    return NextResponse.redirect(
      new URL(`/auth/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, request.url)
    )
  }
  
  return NextResponse.next()
} 