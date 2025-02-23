import { NextRequest } from 'next/server';
import { services } from '@/lib/services';
import { ServiceError } from '@/lib/services/types';

// POST /api/auth/register - 用户注册
export async function POST(request: NextRequest) {
  try {
    // 1. 获取请求数据
    const data = await request.json();

    // 2. 调用服务
    const result = await services.auth.register(data);

    // 3. 返回结果
    return new Response(
      JSON.stringify({
        code: 200,
        message: '注册成功',
        data: result.user,
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
    console.error('POST /api/auth/register error:', error);
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