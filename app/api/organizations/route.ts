import { NextRequest } from 'next/server';
import { services } from '@/lib/services';
import { checkPermission } from '@/lib/auth/permission';
import { createPermissionError } from '@/lib/auth/errors';
import { parseSession } from '@/lib/auth/session';

// GET /api/organizations - 获取机构列表
export async function GET(request: NextRequest) {
  try {
    // 1. 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';
    const sorting = searchParams.get('sorting')
      ? JSON.parse(searchParams.get('sorting')!)
      : { field: 'createdAt', order: 'desc' };

    // 2. 权限检查
    const session = parseSession(request.headers.get('authorization'));
    const hasPermission = await checkPermission(
      session,
      { resource: 'organization', action: 'read', scope: 'all' }
    );
    
    if (!hasPermission) {
      throw createPermissionError('INSUFFICIENT_PERMISSIONS');
    }

    // 3. 调用服务
    const result = await services.organization.findAll(
      { page, pageSize },
      { search, sorting }
    );

    // 4. 返回结果
    return Response.json({
      code: 200,
      message: '获取成功',
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

// POST /api/organizations - 创建机构
export async function POST(request: NextRequest) {
  try {
    // 1. 获取请求数据
    const data = await request.json();

    // 2. 权限检查
    const session = parseSession(request.headers.get('authorization'));
    const hasPermission = await checkPermission(
      session,
      { resource: 'organization', action: 'create', scope: 'all' }
    );
    
    if (!hasPermission) {
      throw createPermissionError('INSUFFICIENT_PERMISSIONS');
    }

    // 3. 调用服务
    const result = await services.organization.create(data);

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