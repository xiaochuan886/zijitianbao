import { NextResponse } from 'next/server'
import { type RequestCookies } from 'next/dist/server/web/spec-extension/cookies'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const cookieStore = cookies() as unknown as RequestCookies
    
    // 清除token cookie
    const response = NextResponse.json({ message: '退出成功' })
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })
    
    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { message: '退出失败' },
      { status: 500 }
    )
  }
} 