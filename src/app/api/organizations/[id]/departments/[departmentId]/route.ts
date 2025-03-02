import { NextRequest, NextResponse } from 'next/server';
import { services } from '@/lib/services';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT /api/organizations/[id]/departments/[departmentId] - 更新部门
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; departmentId: string } }
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
        return NextResponse.json({ message: "权限不足" }, { status: 403 });
      }
    }

    // 3. 调用服务
    const result = await services.organization.updateDepartment(
      params.departmentId,
      data.name
    );

    // 4. 返回结果
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('更新部门失败', error);
    return NextResponse.json(
      { message: error.message || '更新部门失败', error: error.message },
      { status: error.statusCode || 500 }
    );
  }
}

// DELETE /api/organizations/[id]/departments/[departmentId] - 删除部门
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; departmentId: string } }
) {
  try {
    // 1. 权限检查 - 使用getServerSession替代parseSession
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
        return NextResponse.json({ message: "权限不足" }, { status: 403 });
      }
    }

    // 2. 调用服务
    await services.organization.deleteDepartment(params.departmentId);

    // 3. 返回结果
    return NextResponse.json({ message: '删除成功' });
  } catch (error: any) {
    console.error('删除部门失败', error);
    return NextResponse.json(
      { message: error.message || '删除部门失败', error: error.message },
      { status: error.statusCode || 500 }
    );
  }
} 