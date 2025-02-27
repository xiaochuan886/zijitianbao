import { NextRequest } from 'next/server'
import { services } from '@/lib/services'
import { ServiceError } from '@/lib/services/types'
import { parseSession } from '@/lib/auth/session'
import { Role } from '@/lib/enums'
import { UserService } from '@/lib/services/user.service'

// GET /api/users - 获取用户列表
export async function GET(request: NextRequest) {
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

    // 只有管理员可以获取用户列表
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

    // 2. 获取查询参数
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10)
    const search = searchParams.get('search') || ''
    const organizationId = searchParams.get('organizationId') || undefined
    const role = searchParams.get('role') as Role || undefined
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    // 3. 调用服务
    const result = await services.user.getUsers({
      page,
      pageSize,
      search,
      organizationId,
      role,
      sortBy,
      sortOrder,
    })

    // 4. 返回结果
    return new Response(
      JSON.stringify({
        code: 200,
        message: '获取用户列表成功',
        data: result,
        timestamp: Date.now(),
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error: any) {
    console.error('GET /api/users error:', error)
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

// POST /api/users - 创建用户
export async function POST(request: NextRequest) {
  try {
    // 验证会话
    const session = parseSession(request.headers.get('authorization'))
    if (!session || !session.user) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401
      })
    }

    // 验证权限
    if (session.user.role !== Role.ADMIN) {
      return new Response(JSON.stringify({ message: 'Permission denied' }), {
        status: 403
      })
    }

    // 获取请求数据
    const data = await request.json()
    
    // 验证数据
    if (!data.name || !data.email || !data.password || !data.role) {
      return new Response(JSON.stringify({ message: 'Missing required fields' }), {
        status: 400
      })
    }

    // 处理多机构关联
    let organizationId = data.organizationId;
    let organizationIds = data.organizationIds;
    
    // 如果只提供了单个organizationId但没有提供organizationIds数组，则创建一个数组
    if (organizationId && (!organizationIds || organizationIds.length === 0)) {
      organizationIds = [organizationId];
    }

    // 创建用户
    const userService = new UserService()
    const result = await userService.createUser({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role as Role,
      organizationId, // 保持向后兼容
      organizationIds, // 添加多机构支持
    })

    return new Response(JSON.stringify(result), {
      status: 200
    })
  } catch (error: any) {
    console.error('POST /api/users error:', error)
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