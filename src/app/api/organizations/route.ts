import { NextRequest } from 'next/server';
import { OrganizationService } from '@/lib/services/organization.service';
import { checkPermission } from '@/lib/auth/permission';
import { parseSession } from '@/lib/auth/session';

const organizationService = new OrganizationService();

// GET /api/organizations - 获取机构列表
export async function GET(request: NextRequest) {
  try {
    // 1. 获取查询参数
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const search = searchParams.get('search') || '';

    // 2. 权限检查
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

    // 3. 调用服务
    const result = await organizationService.findAll(
      { page, pageSize },
      { search }
    );

    // 4. 返回结果
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
    console.error('GET /api/organizations error:', error);
    return new Response(
      JSON.stringify({
        code: 500,
        message: error.message || '服务器错误',
        timestamp: Date.now(),
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
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
    const result = await organizationService.create(data);

    // 4. 返回结果
    return new Response(
      JSON.stringify({
        code: 200,
        message: '创建成功',
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
    console.error('POST /api/organizations error:', error);
    return new Response(
      JSON.stringify({
        code: 500,
        message: error.message || '服务器错误',
        timestamp: Date.now(),
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
} 