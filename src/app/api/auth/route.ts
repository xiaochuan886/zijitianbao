import { NextRequest } from 'next/server';
import { services } from '@/lib/services';
import { sign } from 'jsonwebtoken';
import { ServiceError } from '@/lib/services/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRES_IN = '24h';

// POST /api/auth/login - 用户登录
export async function POST(request: NextRequest) {
  try {
    // 1. 获取请求数据
    const data = await request.json();

    // 2. 调用服务
    const result = await services.auth.login(data);

    // 3. 生成token
    const token = sign(
      { user: result.user },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRES_IN }
    );

    // 4. 返回结果
    return new Response(
      JSON.stringify({
        code: 200,
        message: '登录成功',
        data: {
          token,
          user: result.user,
        },
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
    console.error('POST /api/auth/login error:', error);
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