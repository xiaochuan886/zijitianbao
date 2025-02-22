import { describe, expect, test, beforeAll, afterAll } from '@jest/globals';
import { createMocks } from 'node-mocks-http';
import { prisma } from '@/lib/prisma';
import * as auth from '@/lib/auth/session';
import { GET, POST } from '@/app/api/organizations/route';
import { GET as getById, PUT, DELETE } from '@/app/api/organizations/[id]/route';

// Mock session
jest.mock('@/lib/auth/session', () => ({
  parseSession: jest.fn()
}));

describe('机构管理API测试', () => {
  let testOrgId: string;
  
  beforeAll(async () => {
    // 清理测试数据
    await prisma.organization.deleteMany();
  });

  afterAll(async () => {
    await prisma.organization.deleteMany();
    await prisma.$disconnect();
  });

  describe('GET /api/organizations', () => {
    test('管理员应该能获取机构列表', async () => {
      // Mock管理员session
      (auth.parseSession as jest.Mock).mockReturnValue({
        user: { id: '1', role: 'ADMIN' }
      });

      const { req, res } = createMocks({
        method: 'GET',
      });

      await GET(req);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.code).toBe(200);
      expect(Array.isArray(data.data.items)).toBe(true);
    });

    test('未授权用户不能获取机构列表', async () => {
      // Mock未授权session
      (auth.parseSession as jest.Mock).mockReturnValue(null);

      const { req, res } = createMocks({
        method: 'GET',
      });

      await GET(req);

      expect(res._getStatusCode()).toBe(403);
    });
  });

  describe('POST /api/organizations', () => {
    test('管理员应该能创建机构', async () => {
      // Mock管理员session
      (auth.parseSession as jest.Mock).mockReturnValue({
        user: { id: '1', role: 'ADMIN' }
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: '测试机构',
          code: 'TEST001'
        }
      });

      await POST(req);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.code).toBe(200);
      expect(data.data.id).toBeDefined();
      testOrgId = data.data.id;
    });

    test('机构编码不能重复', async () => {
      // Mock管理员session
      (auth.parseSession as jest.Mock).mockReturnValue({
        user: { id: '1', role: 'ADMIN' }
      });

      const { req, res } = createMocks({
        method: 'POST',
        body: {
          name: '测试机构2',
          code: 'TEST001'
        }
      });

      await POST(req);

      expect(res._getStatusCode()).toBe(400);
      const data = JSON.parse(res._getData());
      expect(data.message).toContain('编码已存在');
    });
  });

  describe('GET /api/organizations/[id]', () => {
    test('应该能获取机构详情', async () => {
      // Mock管理员session
      (auth.parseSession as jest.Mock).mockReturnValue({
        user: { id: '1', role: 'ADMIN' }
      });

      const { req, res } = createMocks({
        method: 'GET',
      });

      await getById(req, { params: { id: testOrgId } });

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.code).toBe(200);
      expect(data.data.id).toBe(testOrgId);
    });
  });

  describe('PUT /api/organizations/[id]', () => {
    test('应该能更新机构信息', async () => {
      // Mock管理员session
      (auth.parseSession as jest.Mock).mockReturnValue({
        user: { id: '1', role: 'ADMIN' }
      });

      const { req, res } = createMocks({
        method: 'PUT',
        body: {
          name: '更新后的机构名称'
        }
      });

      await PUT(req, { params: { id: testOrgId } });

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.code).toBe(200);
      expect(data.data.name).toBe('更新后的机构名称');
    });
  });

  describe('DELETE /api/organizations/[id]', () => {
    test('应该能删除机构', async () => {
      // Mock管理员session
      (auth.parseSession as jest.Mock).mockReturnValue({
        user: { id: '1', role: 'ADMIN' }
      });

      const { req, res } = createMocks({
        method: 'DELETE',
      });

      await DELETE(req, { params: { id: testOrgId } });

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data.code).toBe(200);
    });
  });
}); 