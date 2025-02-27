import { NextRequest } from 'next/server'
import { services } from '@/lib/services'
import { ServiceError } from '@/lib/services/types'
import { parseSession } from '@/lib/auth/session'
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
    const session = parseSession(request.headers.get('authorization'))
    
    if (!session || !session.user) {
      return new Response(
        JSON.stringify({
          code: 401,
          message: '未授权访问',
          timestamp: Date.now(),
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // 只有管理员可以重置密码
    if (session.user.role !== Role.ADMIN) {
      return new Response(
        JSON.stringify({
          code: 403,
          message: '权限不足',
          timestamp: Date.now(),
        }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // 2. 获取用户ID和请求数据
    const userId = params.id
    const { password } = await request.json()

    if (!password || typeof password !== 'string' || password.length < 6) {
      return new Response(
        JSON.stringify({
          code: 400,
          message: '密码必须至少6个字符',
          timestamp: Date.now(),
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // 3. 调用服务
    const result = await services.user.resetPassword(userId, password)

    // 4. 返回结果
    return new Response(
      JSON.stringify({
        code: 200,
        message: '重置密码成功',
        data: result,
        timestamp: Date.now(),
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error(`POST /api/users/${params.id}/reset-password error:`, error)
    const statusCode = error instanceof ServiceError ? error.statusCode : 500
    const message = error instanceof ServiceError ? error.message : '服务器错误'
    
    return new Response(
      JSON.stringify({
        code: statusCode,
        message: message,
        timestamp: Date.now(),
      }),
      { 
        status: statusCode,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
} 