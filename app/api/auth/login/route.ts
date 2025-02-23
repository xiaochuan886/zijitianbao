import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { prisma } from '@/app/lib/prisma'
import { comparePassword } from '@/app/lib/auth/password'
import { generateToken } from '@/app/lib/auth/token'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = loginSchema.parse(body)

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        role: true,
        organizationId: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { message: '用户不存在' },
        { status: 401 }
      )
    }

    // 验证密码
    const isValid = await comparePassword(password, user.password)
    if (!isValid) {
      return NextResponse.json(
        { message: '密码错误' },
        { status: 401 }
      )
    }

    // 生成token
    const token = await generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    })

    // 设置cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
      },
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7天
      path: '/',
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: '无效的请求数据' },
        { status: 400 }
      )
    }

    console.error('Login error:', error)
    return NextResponse.json(
      { message: '服务器错误' },
      { status: 500 }
    )
  }
} 