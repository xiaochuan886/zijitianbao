import { NextRequest } from 'next/server';
import { services } from '@/lib/services';
import { checkPermission } from '@/lib/auth/permission';
import { createPermissionError } from '@/lib/auth/errors';
import { parseSession } from '@/lib/auth/session';
import { ServiceError } from '@/lib/services/types';

// GET /api/organizations/[id] - 获取机构详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 权限检查
    const session = parseSession(request.headers.get('authorization'));
    const hasPermission = await checkPermission(
      session,
      { resource: 'organization', action: 'read', scope: 'all' }
    );
    
    if (!hasPermission) {
      return new Response(
        JSON.stringify({
          code: 403,
          message: '权限不足',
          timestamp: Date.now(),
        }),
        { 
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 2. 调用服务
    const result = await services.organization.findById(params.id);

    // 3. 返回结果
    return new Response(
      JSON.stringify({
        code: 200,
        message: '获取成功',
        data: result,
        timestamp: Date.now(),
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('GET /api/organizations/[id] error:', error);
    const statusCode = error instanceof ServiceError ? error.statusCode : 500;
    const message = error instanceof ServiceError ? error.message : '服务器错误';
    
    return new Response(
      JSON.stringify({
        code: statusCode,
        message: message,
        timestamp: Date.now(),
      }),
      { 
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// PUT /api/organizations/[id] - 更新机构
export async function PUT(
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
      { resource: 'organization', action: 'update', scope: 'all' }
    );
    
    if (!hasPermission) {
      return new Response(
        JSON.stringify({
          code: 403,
          message: '权限不足',
          timestamp: Date.now(),
        }),
        { 
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 3. 调用服务
    const result = await services.organization.update(params.id, data);

    // 4. 返回结果
    return new Response(
      JSON.stringify({
        code: 200,
        message: '更新成功',
        data: result,
        timestamp: Date.now(),
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('PUT /api/organizations/[id] error:', error);
    const statusCode = error instanceof ServiceError ? error.statusCode : 500;
    const message = error instanceof ServiceError ? error.message : '服务器错误';
    
    return new Response(
      JSON.stringify({
        code: statusCode,
        message: message,
        timestamp: Date.now(),
      }),
      { 
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// DELETE /api/organizations/[id] - 删除机构
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 权限检查
    const session = parseSession(request.headers.get('authorization'));
    const hasPermission = await checkPermission(
      session,
      { resource: 'organization', action: 'delete', scope: 'all' }
    );
    
    if (!hasPermission) {
      return new Response(
        JSON.stringify({
          code: 403,
          message: '权限不足',
          timestamp: Date.now(),
        }),
        { 
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 2. 调用服务
    await services.organization.delete(params.id);

    // 3. 返回结果
    return new Response(
      JSON.stringify({
        code: 200,
        message: '删除成功',
        timestamp: Date.now(),
      }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.error('DELETE /api/organizations/[id] error:', error);
    const statusCode = error instanceof ServiceError ? error.statusCode : 500;
    const message = error instanceof ServiceError ? error.message : '服务器错误';
    
    return new Response(
      JSON.stringify({
        code: statusCode,
        message: message,
        timestamp: Date.now(),
      }),
      { 
        status: statusCode,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 