import { NextRequest } from 'next/server';
import { services } from '@/lib/services';
import { checkPermission } from '@/lib/auth/permission';
import { createPermissionError } from '@/lib/auth/errors';
import { parseSession } from '@/lib/auth/session';

// POST /api/organizations/[id]/departments - 创建部门
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 获取请求数据
    const data = await request.json();

    // 2. 权限检查
    const session = parseSession(request.headers.get('authorization'));
    const hasPermission = await checkPermission(
      session,
      { resource: 'department', action: 'create', scope: 'all' }
    );
    
    if (!hasPermission) {
      throw createPermissionError('INSUFFICIENT_PERMISSIONS');
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