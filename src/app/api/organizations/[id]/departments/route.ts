import { NextRequest } from 'next/server';
import { services } from '@/lib/services';
import { checkPermission } from '@/lib/auth/permission';
import { createPermissionError } from '@/lib/auth/errors';
import { parseSession } from '@/lib/auth/session';
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth-options"
import { z } from "zod"

const prisma = new PrismaClient()

// 请求体验证schema
const departmentsSchema = z.object({
  departments: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1, "部门名称不能为空"),
      isDeleted: z.boolean().optional(),
    })
  ),
})

// POST /api/organizations/[id]/departments - 创建部门
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 获取请求数据
    const data = await request.json();

    // 2. 权限检查 - 使用getServerSession替代parseSession
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ message: "未授权访问" }, { status: 401 });
    }
    
    // 管理员有全部权限，非管理员需要检查关联
    if (session.user.role !== "ADMIN") {
      // 检查用户是否与该组织有关联
      const userOrg = await prisma.userOrganization.findFirst({
        where: {
          userId: session.user.id,
          organizationId: params.id,
        }
      });
      
      if (!userOrg) {
        return NextResponse.json({ message: "无权限执行此操作" }, { status: 403 });
      }
    }

    // 3. 调用服务
    const result = await services.organization.addDepartment(
      params.id,
      data.name
    );

    // 4. 返回结果
    return Response.json({
      code: 200,
      message: '创建成功',
      data: result,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    return Response.json({
      code: error.statusCode || 500,
      message: error.message || '服务器错误',
      timestamp: Date.now(),
    }, {
      status: error.statusCode || 500,
    });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 使用getServerSession代替parseSession进行身份验证
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ message: "未授权访问" }, { status: 401 })
    }

    // 管理员有全部权限，非管理员需要检查关联
    if (session.user.role !== "ADMIN") {
      // 检查用户是否与该组织有关联
      const userOrg = await prisma.userOrganization.findFirst({
        where: {
          userId: session.user.id,
          organizationId: params.id,
        }
      });
      
      if (!userOrg) {
        return NextResponse.json({ message: "无权限执行此操作" }, { status: 403 })
      }
    }

    const body = await request.json()
    const result = departmentsSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { message: "请求参数错误", errors: result.error.errors },
        { status: 400 }
      )
    }

    const { departments } = result.data

    // 开启事务处理批量操作
    await prisma.$transaction(async (tx) => {
      // 处理需要删除的部门 - 改为软删除
      const departmentsToDelete = departments
        .filter((dept) => dept.id && dept.isDeleted)
        .map((dept) => dept.id as string)

      if (departmentsToDelete.length > 0) {
        // 使用软删除替代真实删除
        await tx.department.updateMany({
          where: {
            id: { in: departmentsToDelete },
            organizationId: params.id,
          },
          data: {
            isDeleted: true,
          }
        })
      }

      // 处理需要更新的部门
      const departmentsToUpdate = departments
        .filter((dept) => dept.id && !dept.isDeleted)
        .map((dept) => ({
          where: { id: dept.id },
          data: { name: dept.name },
        }))

      for (const update of departmentsToUpdate) {
        await tx.department.update(update)
      }

      // 处理需要新建的部门
      const departmentsToCreate = departments
        .filter((dept) => !dept.id && !dept.isDeleted)
        .map((dept) => ({
          name: dept.name,
          organizationId: params.id,
        }))

      if (departmentsToCreate.length > 0) {
        await tx.department.createMany({
          data: departmentsToCreate,
        })
      }
    })

    // 获取更新后的部门列表 - 只返回未删除的部门
    const updatedDepartments = await prisma.department.findMany({
      where: {
        organizationId: params.id,
        isDeleted: false
      },
      orderBy: { createdAt: "asc" },
    })

    return NextResponse.json(updatedDepartments)
  } catch (error) {
    console.error("部门管理错误:", error)
    return NextResponse.json(
      { message: "服务器内部错误" },
      { status: 500 }
    )
  }
} 