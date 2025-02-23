import { NextRequest } from 'next/server';
import { services } from '@/lib/services';
import { checkPermission } from '@/lib/auth/permission';
import { parseSession } from '@/lib/auth/session';
import { ServiceError } from '@/lib/services/types';

// PUT /api/auth/password - 修改密码
export async function PUT(request: NextRequest) {
  try {
    // 1. 获取会话信息
    const session = parseSession(request.headers.get('authorization'));
    if (!session?.user) {
      return new Response(
        JSON.stringify({
          code: 401,
          message: '未登录',
          timestamp: Date.now(),
        }),
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // 2. 获取请求数据
    const data = await request.json();

    // 3. 调用服务
    await services.auth.changePassword(
      session.user.id,
      data.oldPassword,
      data.newPassword
    );

    // 4. 返回结果
    return new Response(
      JSON.stringify({
        code: 200,
        message: '密码修改成功',
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
    console.error('PUT /api/auth/password error:', error);
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