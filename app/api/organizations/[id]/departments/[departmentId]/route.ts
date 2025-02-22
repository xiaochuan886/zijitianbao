import { NextRequest } from 'next/server';
import { services } from '@/lib/services';
import { checkPermission } from '@/lib/auth/permission';
import { createPermissionError } from '@/lib/auth/errors';
import { parseSession } from '@/lib/auth/session';

// PUT /api/organizations/[id]/departments/[departmentId] - 更新部门
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; departmentId: string } }
) {
  try {
    // 1. 获取请求数据
    const data = await request.json();

    // 2. 权限检查
    const session = parseSession(request.headers.get('authorization'));
    const hasPermission = await checkPermission(
      session,
      { resource: 'department', action: 'update', scope: 'all' }
    );
    
    if (!hasPermission) {
      throw createPermissionError('INSUFFICIENT_PERMISSIONS');
    }

    // 3. 调用服务
    const result = await services.organization.updateDepartment(
      params.departmentId,
      data.name
    );

    // 4. 返回结果
    return Response.json({
      code: 200,
      message: '更新成功',
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

// DELETE /api/organizations/[id]/departments/[departmentId] - 删除部门
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; departmentId: string } }
) {
  try {
    // 1. 权限检查
    const session = parseSession(request.headers.get('authorization'));
    const hasPermission = await checkPermission(
      session,
      { resource: 'department', action: 'delete', scope: 'all' }
    );
    
    if (!hasPermission) {
      throw createPermissionError('INSUFFICIENT_PERMISSIONS');
    }

    // 2. 调用服务
    await services.organization.deleteDepartment(params.departmentId);

    // 3. 返回结果
    return Response.json({
      code: 200,
      message: '删除成功',
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