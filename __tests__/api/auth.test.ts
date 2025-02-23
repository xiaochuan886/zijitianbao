import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { POST as LOGIN } from '@/app/api/auth/route';
import { POST as REGISTER } from '@/app/api/auth/register/route';
import { PUT as CHANGE_PASSWORD } from '@/app/api/auth/password/route';
import { prismaMock } from '../../jest.setup';
import { User } from '@prisma/client';
import { hash } from 'bcrypt';

// Mock user data
const mockUser: User = {
  id: 'test-user-id',
  name: '测试用户',
  email: 'test@example.com',
  password: 'hashed_password',
  role: 'REPORTER',
  organizationId: 'test-org-id',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('认证API测试', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    test('用户登录成功', async () => {
      // Mock findUnique to return user with only selected fields
      prismaMock.user.findUnique.mockResolvedValue({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        password: mockUser.password,
        role: mockUser.role,
        organizationId: mockUser.organizationId,
      } as any);

      const headers = new Headers();
      headers.set('content-type', 'application/json');

      const body = {
        email: 'test@example.com',
        password: 'password123',
      };

      const req = {
        headers,
        json: () => Promise.resolve(body),
      } as any;

      const response = await LOGIN(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        code: 200,
        message: '登录成功',
        data: {
          user: {
            id: 'test-user-id',
            name: '测试用户',
            email: 'test@example.com',
            role: 'REPORTER',
            organizationId: 'test-org-id',
          }
        },
        timestamp: expect.any(Number)
      });
    });

    test('用户不存在', async () => {
      // Mock findUnique to return null
      prismaMock.user.findUnique.mockResolvedValue(null);

      const headers = new Headers();
      headers.set('content-type', 'application/json');

      const body = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const req = {
        headers,
        json: () => Promise.resolve(body),
      } as any;

      const response = await LOGIN(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual(
        expect.objectContaining({
          code: 401,
          message: '用户不存在',
        })
      );
    });

    test('密码错误', async () => {
      // Mock findUnique to return user
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      // Mock bcrypt compare to return false
      jest.spyOn(require('bcrypt'), 'compare').mockImplementationOnce(() => Promise.resolve(false));

      const headers = new Headers();
      headers.set('content-type', 'application/json');

      const body = {
        email: 'test@example.com',
        password: 'wrong_password',
      };

      const req = {
        headers,
        json: () => Promise.resolve(body),
      } as any;

      const response = await LOGIN(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual(
        expect.objectContaining({
          code: 401,
          message: '密码错误',
        })
      );
    });
  });

  describe('POST /api/auth/register', () => {
    test('用户注册成功', async () => {
      // Mock findUnique to return null (email not exists)
      prismaMock.user.findUnique.mockResolvedValue(null);
      // Mock create to return new user
      prismaMock.user.create.mockResolvedValue(mockUser);

      const headers = new Headers();
      headers.set('content-type', 'application/json');

      const body = {
        name: '测试用户',
        email: 'test@example.com',
        password: 'password123',
        organizationId: 'test-org-id',
      };

      const req = {
        headers,
        json: () => Promise.resolve(body),
      } as any;

      const response = await REGISTER(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(
        expect.objectContaining({
          code: 200,
          message: '注册成功',
          data: expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            email: expect.any(String),
            role: expect.any(String),
          }),
        })
      );
    });

    test('邮箱已被注册', async () => {
      // Mock findUnique to return existing user
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const headers = new Headers();
      headers.set('content-type', 'application/json');

      const body = {
        name: '新用户',
        email: 'test@example.com',
        password: 'password123',
      };

      const req = {
        headers,
        json: () => Promise.resolve(body),
      } as any;

      const response = await REGISTER(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual(
        expect.objectContaining({
          code: 400,
          message: '邮箱已被注册',
        })
      );
    });
  });

  describe('PUT /api/auth/password', () => {
    test('修改密码成功', async () => {
      // Mock findUnique to return user
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      // Mock update to return updated user
      prismaMock.user.update.mockResolvedValue(mockUser);

      const headers = new Headers();
      headers.set('authorization', 'Bearer admin-token');
      headers.set('content-type', 'application/json');

      const body = {
        oldPassword: 'old_password',
        newPassword: 'new_password',
      };

      const req = {
        headers,
        json: () => Promise.resolve(body),
      } as any;

      const response = await CHANGE_PASSWORD(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(
        expect.objectContaining({
          code: 200,
          message: '密码修改成功',
        })
      );
    });

    test('未登录不能修改密码', async () => {
      const headers = new Headers();
      headers.set('content-type', 'application/json');

      const body = {
        oldPassword: 'old_password',
        newPassword: 'new_password',
      };

      const req = {
        headers,
        json: () => Promise.resolve(body),
      } as any;

      const response = await CHANGE_PASSWORD(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual(
        expect.objectContaining({
          code: 401,
          message: '未登录',
        })
      );
    });

    test('原密码错误', async () => {
      // Mock findUnique to return user
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      // Mock bcrypt compare to return false
      jest.spyOn(require('bcrypt'), 'compare').mockImplementationOnce(() => Promise.resolve(false));

      const headers = new Headers();
      headers.set('authorization', 'Bearer admin-token');
      headers.set('content-type', 'application/json');

      const body = {
        oldPassword: 'wrong_password',
        newPassword: 'new_password',
      };

      const req = {
        headers,
        json: () => Promise.resolve(body),
      } as any;

      const response = await CHANGE_PASSWORD(req);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toEqual(
        expect.objectContaining({
          code: 401,
          message: '原密码错误',
        })
      );
    });
  });
}); 