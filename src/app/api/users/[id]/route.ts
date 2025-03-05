import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { services } from '@/lib/services'
import { ServiceError } from '@/lib/services/types'
import { Role } from '@/lib/enums'
import { UserService } from '@/lib/services/user.service'

type Params = {
  params: {
    id: string
  }
}

// GET /api/users/[id] - 获取用户详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取会话信息
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const userId = params.id;
    if (!userId) {
      return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });
    }

    // 查询用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("获取用户信息失败:", error);
    return NextResponse.json(
      { error: "获取用户信息失败" },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - 更新用户
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取会话信息，校验权限
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

    // 只有管理员可以更新用户
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

    const { id } = params
    const data = await request.json()
    
    // 处理多机构关联
    let organizationId = data.organizationId;
    let organizationIds = data.organizationIds;
    
    // 如果只提供了单个organizationId但没有提供organizationIds数组，则创建一个数组
    if (organizationId && (!organizationIds || organizationIds.length === 0)) {
      organizationIds = [organizationId];
    }
    
    // 调用服务更新用户
    const userService = new UserService()
    const user = await userService.updateUser(id, {
      ...data,
      organizationIds, // 添加多机构支持
    })

    return NextResponse.json(
      {
        code: 200,
        message: '更新用户成功',
        data: user,
        timestamp: Date.now(),
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error(`PUT /api/users/${params.id} error:`, error)
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

// DELETE /api/users/[id] - 删除用户
export async function DELETE(request: NextRequest, { params }: Params) {
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

    // 只有管理员可以删除用户
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

    // 2. 获取用户ID
    const userId = params.id

    // 3. 调用服务
    const result = await services.user.deleteUser(userId)

    // 4. 返回结果
    return NextResponse.json(
      {
        code: 200,
        message: '删除用户成功',
        data: result,
        timestamp: Date.now(),
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error(`DELETE /api/users/${params.id} error:`, error)
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