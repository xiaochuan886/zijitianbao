import { Session } from './types';
import { verify } from 'jsonwebtoken';
import { getToken } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * 解析会话令牌 - 兼容旧JWT和NextAuth
 * 
 * 这是一个临时兼容层，用于在迁移到NextAuth的过程中支持旧的JWT认证
 * 未来将完全迁移到NextAuth，届时此函数将被移除
 * 
 * @deprecated 使用getServerSession替代
 */
export function parseSession(authHeader: string | null): Session | null {
  if (!authHeader) return null;

  try {
    // 移除Bearer前缀
    const token = authHeader.replace('Bearer ', '');
    
    // 验证并解析token
    const payload = verify(token, JWT_SECRET) as {
      user: Session['user']
    };

    return {
      user: payload.user
    };
  } catch (error) {
    console.warn('旧JWT解析失败，尝试作为NextAuth令牌处理:', error);
    // 返回null，表示认证失败，API路由应该使用getServerSession
    return null;
  }
}

/**
 * 从请求中提取NextAuth令牌 - 这是为了方便在API路由中调用
 * 但建议直接使用getServerSession来获取会话
 * 
 * @deprecated 使用getServerSession替代
 */
export async function parseNextAuthToken(req: NextRequest) {
  try {
    return await getToken({ req });
  } catch (error) {
    console.error('NextAuth令牌解析失败:', error);
    return null;
  }
} 