import { NextRequest, NextResponse } from 'next/server';
import { services } from '@/lib/services';
import { checkPermission } from '@/lib/auth/permission';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';
import { ServiceError } from '@/lib/services/types';

// PUT /api/auth/password - 修改密码
export async function PUT(request: NextRequest) {
  try {
    // 1. 获取会话信息
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        {
          code: 401,
          message: '未登录',
          timestamp: Date.now(),
        },
        { status: 401 }
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
    return NextResponse.json(
      {
        code: 200,
        message: '密码修改成功',
        timestamp: Date.now(),
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('PUT /api/auth/password error:', error);
    const statusCode = error instanceof ServiceError ? error.statusCode : 500;
    const message = error instanceof ServiceError ? error.message : '服务器错误';
    
    return NextResponse.json(
      {
        code: statusCode,
        message: message,
        timestamp: Date.now(),
      },
      { status: statusCode }
    );
  }
} 