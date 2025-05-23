import { NextRequest, NextResponse } from 'next/server'
import { services } from '@/lib/services'
import { ServiceError } from '@/lib/services/types'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { Role } from '@/lib/enums'
import { UserService } from '@/lib/services/user.service'

// GET /api/users - 获取用户列表
export async function GET(request: NextRequest) {
  try {
    // 1. 获取会话信息，校验权限 - 使用getServerSession替代parseSession
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        {
          message: '未授权访问',
          timestamp: Date.now(),
        },
        { status: 401 }
      );
    }

    // 只有管理员可以获取用户列表
    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        {
          message: '权限不足，只有管理员可以获取用户列表',
          timestamp: Date.now(),
        },
        { status: 403 }
      );
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
    return NextResponse.json({
      message: '获取用户列表成功',
      data: result,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error('GET /api/users error:', error)
    const statusCode = error instanceof ServiceError ? error.statusCode : 500
    const message = error instanceof ServiceError ? error.message : '服务器错误'
    
    return NextResponse.json(
      {
        message: message,
        timestamp: Date.now(),
      },
      { status: statusCode }
    );
  }
}

// POST /api/users - 创建用户
export async function POST(request: NextRequest) {
  try {
    // 验证会话 - 使用getServerSession替代parseSession
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 401 }
      );
    }

    // 验证权限
    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { message: '权限不足，只有管理员可以创建用户' },
        { status: 403 }
      );
    }

    // 获取请求数据
    const data = await request.json()
    
    // 验证数据
    if (!data.name || !data.email || !data.password || !data.role) {
      return NextResponse.json(
        { message: '缺少必填字段' },
        { status: 400 }
      );
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

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('POST /api/users error:', error)
    const statusCode = error instanceof ServiceError ? error.statusCode : 500
    const message = error instanceof ServiceError ? error.message : '服务器错误'
    
    return NextResponse.json(
      {
        message: message,
        timestamp: Date.now(),
      },
      { status: statusCode }
    );
  }
} 