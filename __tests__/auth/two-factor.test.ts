import { describe, expect, test, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { requireTwoFactor } from '@/lib/auth/two-factor';

// Mock verifyTwoFactorToken
jest.mock('@/lib/auth/two-factor', () => ({
  ...jest.requireActual('@/lib/auth/two-factor'),
  verifyTwoFactorToken: jest.fn(),
}));

describe('二次认证中间件测试', () => {
  const mockHandler = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('应该在没有token时返回403', async () => {
    const request = new NextRequest('http://localhost', {
      headers: new Headers({
        'authorization': 'Bearer valid-token'
      })
    });

    const response = await requireTwoFactor(mockHandler)(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toMatchObject({
      code: 403,
      message: '需要二次认证',
    });
    expect(mockHandler).not.toHaveBeenCalled();
  });

  test('应该在token验证成功时调用handler', async () => {
    const request = new NextRequest('http://localhost', {
      headers: new Headers({
        'authorization': 'Bearer valid-token',
        'x-2fa-token': 'valid-2fa-token'
      })
    });

    // 模拟 verifyTwoFactorToken 函数返回 true
    const { verifyTwoFactorToken } = jest.requireActual('@/lib/auth/two-factor');
    jest.spyOn(verifyTwoFactorToken, 'mockResolvedValueOnce').mockImplementation(() => Promise.resolve(true));

    await requireTwoFactor(mockHandler)(request);
    expect(mockHandler).toHaveBeenCalledWith(request);
  });

  test('应该在token验证失败时返回403', async () => {
    const request = new NextRequest('http://localhost', {
      headers: new Headers({
        'authorization': 'Bearer valid-token',
        'x-2fa-token': 'invalid-2fa-token'
      })
    });

    // 模拟 verifyTwoFactorToken 函数返回 false
    const { verifyTwoFactorToken } = jest.requireActual('@/lib/auth/two-factor');
    jest.spyOn(verifyTwoFactorToken, 'mockResolvedValueOnce').mockImplementation(() => Promise.resolve(false));

    const response = await requireTwoFactor(mockHandler)(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toMatchObject({
      code: 403,
      message: '二次认证失败',
    });
    expect(mockHandler).not.toHaveBeenCalled();
  });
}); 