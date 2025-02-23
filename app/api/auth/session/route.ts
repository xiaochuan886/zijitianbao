import { NextResponse } from 'next/server'
import { type RequestCookies } from 'next/dist/server/web/spec-extension/cookies'
import { cookies } from 'next/headers'
import { verifyToken } from '@/app/lib/auth/token'
import { prisma } from '@/app/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ user: null })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ user: null })
    }

    // 从数据库获取最新的用户信息
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
      },
    })

    if (!user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json({ user: null })
  }
} 