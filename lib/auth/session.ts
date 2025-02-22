import { Session } from './types';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
    console.error('Session parse error:', error);
    return null;
  }
} 