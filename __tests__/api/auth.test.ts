import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { mockPrisma } from '../../jest.setup';
import bcrypt from 'bcrypt';
import { NextRequest } from 'next/server';
import { POST as LOGIN } from '@/app/api/auth/login/route';
import { POST as REGISTER } from '@/app/api/auth/register/route';
import { PUT as CHANGE_PASSWORD } from '@/app/api/auth/password/route';
import { Role, User } from '@prisma/client';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn().mockImplementation(() => Promise.resolve(true)),
  hash: jest.fn().mockImplementation(() => Promise.resolve('hashedPassword')),
}));

// Mock data
const mockUser: User = {
  id: 'test-user-id',
  name: '测试用户',
  email: 'test@example.com',
  password: 'hashedPassword',
  role: Role.REPORTER,
  organizationId: null,
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
      mockPrisma.user.findUnique.mockResolvedValue({
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        password: mockUser.password,
        role: mockUser.role,
        organizationId: mockUser.organizationId,
      } as User);

      const headers = new Headers();
      headers.set('content-type', 'application/json');
      
      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: mockUser.email,
          password: 'correctPassword',
        }),
      });

      const response = await LOGIN(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(mockUser.email);
    });

    test('用户不存在', async () => {
      // Mock findUnique to return null
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const headers = new Headers();
      headers.set('content-type', 'application/json');
      
      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'password',
        }),
      });

      const response = await LOGIN(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.message).toBe('用户不存在');
    });

    test('密码错误', async () => {
      // Mock findUnique to return user
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      // Mock bcrypt compare to return false
      (bcrypt.compare as jest.Mock).mockImplementationOnce(() => Promise.resolve(false));

      const headers = new Headers();
      headers.set('content-type', 'application/json');
      
      const request = new NextRequest('http://localhost/api/auth/login', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          email: mockUser.email,
          password: 'wrongPassword',
        }),
      });

      const response = await LOGIN(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe('密码错误');
    });
  });

  describe('POST /api/auth/register', () => {
    test('用户注册成功', async () => {
      // Mock findUnique to return null (email not exists)
      mockPrisma.user.findUnique.mockResolvedValue(null);
      // Mock create to return new user
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const headers = new Headers();
      headers.set('content-type', 'application/json');
      
      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: mockUser.name,
          email: mockUser.email,
          password: 'password',
        }),
      });

      const response = await REGISTER(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe(mockUser.email);
    });

    test('邮箱已被注册', async () => {
      // Mock findUnique to return existing user
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const headers = new Headers();
      headers.set('content-type', 'application/json');
      
      const request = new NextRequest('http://localhost/api/auth/register', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: mockUser.name,
          email: mockUser.email,
          password: 'password',
        }),
      });

      const response = await REGISTER(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.message).toBe('邮箱已被注册');
    });
  });

  describe('PUT /api/auth/password', () => {
    test('修改密码成功', async () => {
      // Mock findUnique to return user
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      // Mock update to return updated user
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const headers = new Headers();
      headers.set('content-type', 'application/json');
      headers.set('authorization', 'Bearer validToken');
      
      const request = new NextRequest('http://localhost/api/auth/password', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          oldPassword: 'oldPassword',
          newPassword: 'newPassword',
        }),
      });

      const response = await CHANGE_PASSWORD(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('密码修改成功');
    });

    test('未登录不能修改密码', async () => {
      const headers = new Headers();
      headers.set('content-type', 'application/json');
      
      const request = new NextRequest('http://localhost/api/auth/password', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          oldPassword: 'oldPassword',
          newPassword: 'newPassword',
        }),
      });

      const response = await CHANGE_PASSWORD(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe('未登录');
    });

    test('原密码错误', async () => {
      // Mock findUnique to return user
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      // Mock bcrypt compare to return false
      (bcrypt.compare as jest.Mock).mockImplementationOnce(() => Promise.resolve(false));

      const headers = new Headers();
      headers.set('content-type', 'application/json');
      headers.set('authorization', 'Bearer validToken');
      
      const request = new NextRequest('http://localhost/api/auth/password', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          oldPassword: 'wrongPassword',
          newPassword: 'newPassword',
        }),
      });

      const response = await CHANGE_PASSWORD(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.message).toBe('原密码错误');
    });
  });
}); 