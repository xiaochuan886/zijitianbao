import { NextRequest } from 'next/server';
import { OrganizationService } from '@/lib/services/organization.service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth-options';
import { NextResponse } from 'next/server';

const organizationService = new OrganizationService();

// GET /api/organizations/[id] - 获取机构详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
      const hasAccess = await organizationService.checkUserAccess(session.user.id, params.id);
      
      if (!hasAccess) {
        return NextResponse.json({ message: "权限不足" }, { status: 403 });
      }
    }

    // 2. 调用服务
    const result = await organizationService.findById(params.id);

    if (!result) {
      return NextResponse.json({ message: "机构不存在" }, { status: 404 });
    }

    // 3. 返回结果
    return NextResponse.json(result);
  } catch (error) {
    console.error('获取机构详情失败', error);
    return NextResponse.json(
      { message: '获取机构详情失败', error: (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT /api/organizations/[id] - 更新机构信息
export async function PUT(
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
    
    // 只有管理员可以更新机构信息
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "权限不足，只有管理员可以更新机构信息" }, { status: 403 });
    }

    // 3. 调用服务
    const result = await organizationService.update(params.id, data);

    // 4. 返回结果
    return NextResponse.json(result);
  } catch (error) {
    console.error('更新机构失败', error);
    return NextResponse.json(
      { message: '更新机构失败', error: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE /api/organizations/[id] - 删除机构
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 权限检查 - 使用getServerSession替代parseSession
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ message: "未授权访问" }, { status: 401 });
    }
    
    // 只有管理员可以删除机构
    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "权限不足，只有管理员可以删除机构" }, { status: 403 });
    }

    // 2. 调用服务
    await organizationService.delete(params.id);

    // 3. 返回结果
    return NextResponse.json({ message: '删除成功' });
  } catch (error) {
    console.error('删除机构失败', error);
    return NextResponse.json(
      { message: '删除机构失败', error: (error as Error).message },
      { status: 500 }
    );
  }
} 