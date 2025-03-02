import { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { services } from '@/lib/services'
import { ServiceError } from '@/lib/services/types'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { Role } from '@/lib/enums'

type Params = {
  params: {
    id: string
  }
}

// POST /api/users/[id]/reset-password - 重置用户密码
export async function POST(request: NextRequest, { params }: Params) {
  try {
    // 1. 获取会话信息，校验权限
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json(
        {
          code: 401,
          message: '未授权访问',
          timestamp: Date.now(),
        },
        { status: 401 }
      )
    }

    // 只有管理员可以重置密码
    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        {
          code: 403,
          message: '权限不足',
          timestamp: Date.now(),
        },
        { status: 403 }
      )
    }

    // 2. 获取用户ID和请求数据
    const userId = params.id
    const { password } = await request.json()

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        {
          code: 400,
          message: '密码必须至少6个字符',
          timestamp: Date.now(),
        },
        { status: 400 }
      )
    }

    // 3. 调用服务
    const result = await services.user.resetPassword(userId, password)

    // 4. 返回结果
    return NextResponse.json(
      {
        code: 200,
        message: '重置密码成功',
        data: result,
        timestamp: Date.now(),
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error(`POST /api/users/${params.id}/reset-password error:`, error)
    const statusCode = error instanceof ServiceError ? error.statusCode : 500
    const message = error instanceof ServiceError ? error.message : '服务器错误'
    
    return NextResponse.json(
      {
        code: statusCode,
        message: message,
        timestamp: Date.now(),
      },
      { status: statusCode }
    )
  }
} 