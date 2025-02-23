import { describe, expect, test, jest, beforeEach } from '@jest/globals';
import { GET, POST } from '@/app/api/organizations/route';
import { GET as GET_BY_ID, PUT, DELETE } from '@/app/api/organizations/[id]/route';
import { mockPrisma } from '../../jest.setup';
import { Organization, Department, Prisma } from '@prisma/client';
import { Session } from '@/lib/auth/types';

// Mock parseSession
jest.mock('@/lib/auth/session', () => ({
  parseSession: jest.fn((authHeader: string | null): Session | null => {
    if (authHeader === 'Bearer admin-token') {
      return {
        user: {
          id: 'admin-id',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'ADMIN',
          organizationId: null,
          departmentId: null,
        },
      };
    }
    return null;
  }),
}));

// Mock checkPermission
jest.mock('@/lib/auth/permission', () => ({
  checkPermission: jest.fn(async () => true),
}));

describe('机构管理API测试', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    const mockOrganization = {
      id: '1',
      name: '测试机构',
      code: 'TEST001',
      createdAt: new Date(),
      updatedAt: new Date(),
      departments: [],
      users: [],
      projects: [],
      _count: {
        departments: 0,
        users: 0,
        projects: 0
      }
    } as unknown as Organization & {
      departments: Department[];
      users: any[];
      projects: any[];
      _count: {
        departments: number;
        users: number;
        projects: number;
      };
    };

    // Mock organization.findMany
    mockPrisma.organization.findMany.mockResolvedValue([mockOrganization]);

    // Mock organization.count
    mockPrisma.organization.count.mockResolvedValue(1);

    // Mock organization.findUnique
    mockPrisma.organization.findUnique.mockImplementation(({ where }) => {
      if (where.code === 'TEST001' || where.id === '1') {
        return Promise.resolve(mockOrganization);
      }
      return Promise.resolve(null);
    });

    // Mock organization.create
    mockPrisma.organization.create.mockImplementation(({ data }) => {
      return Promise.resolve({
        ...mockOrganization,
        id: '2',
        name: data.name,
        code: data.code,
        departments: data.departments?.create ? [{ 
          id: '1',
          name: (data.departments.create as any)[0].name,
          organizationId: '2',
          createdAt: new Date(),
          updatedAt: new Date()
        }] : [],
        _count: {
          departments: data.departments?.create ? 1 : 0,
          users: 0,
          projects: 0
        }
      } as unknown as Organization & {
        departments: Department[];
        users: any[];
        projects: any[];
        _count: {
          departments: number;
          users: number;
          projects: number;
        };
      });
    });

    // Mock organization.update
    mockPrisma.organization.update.mockImplementation(({ data }) => {
      return Promise.resolve({
        ...mockOrganization,
        name: data.name as string || mockOrganization.name,
        code: data.code as string || mockOrganization.code,
        departments: data.departments?.upsert ? (data.departments.upsert as any).map((dept: any, index: number) => ({
          id: dept.where.id === 'new' ? `new-${index}` : dept.where.id,
          name: dept.create.name,
          organizationId: '1',
          createdAt: new Date(),
          updatedAt: new Date()
        })) : mockOrganization.departments,
        _count: {
          departments: data.departments?.upsert ? (data.departments.upsert as any).length : 0,
          users: 0,
          projects: 0
        }
      } as unknown as Organization & {
        departments: Department[];
        users: any[];
        projects: any[];
        _count: {
          departments: number;
          users: number;
          projects: number;
        };
      });
    });

    // Mock organization.delete
    mockPrisma.organization.delete.mockResolvedValue(mockOrganization);
  });

  describe('GET /api/organizations', () => {
    test('管理员应该能获取机构列表', async () => {
      const headers = new Headers();
      headers.set('authorization', 'Bearer admin-token');

      const req = {
        headers,
        nextUrl: new URL('http://localhost/api/organizations'),
      } as any;

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        code: 200,
        message: '获取成功',
        data: expect.any(Object),
      });
    });

    test('未授权用户不能获取机构列表', async () => {
      const headers = new Headers();
      headers.set('authorization', 'Bearer invalid-token');

      const req = {
        headers,
        nextUrl: new URL('http://localhost/api/organizations'),
      } as any;

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toMatchObject({
        code: 403,
        message: '权限不足',
      });
    });
  });

  describe('POST /api/organizations', () => {
    test('管理员应该能创建机构', async () => {
      const headers = new Headers();
      headers.set('authorization', 'Bearer admin-token');
      headers.set('content-type', 'application/json');

      const body = {
        name: '新测试机构',
        code: 'TEST002',
        departments: [{ name: '测试部门1' }, { name: '测试部门2' }],
      };

      const req = {
        headers,
        json: () => Promise.resolve(body),
      } as any;

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        code: 200,
        message: '创建成功',
        data: expect.any(Object),
      });
    });

    test('机构编码不能重复', async () => {
      const headers = new Headers();
      headers.set('authorization', 'Bearer admin-token');
      headers.set('content-type', 'application/json');

      const body = {
        name: '测试机构2',
        code: 'TEST001', // 已存在的编码
        departments: [{ name: '测试部门' }],
      };

      const req = {
        headers,
        json: () => Promise.resolve(body),
      } as any;

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({
        code: 400,
        message: '机构编码已存在',
      });
    });
  });

  describe('PUT /api/organizations/[id]', () => {
    test('应该能更新机构信息', async () => {
      const headers = new Headers();
      headers.set('authorization', 'Bearer admin-token');
      headers.set('content-type', 'application/json');

      const body = {
        name: '更新后的机构名称',
        code: 'TEST003',
        departments: [{ name: '新部门' }],
      };

      const req = {
        headers,
        json: () => Promise.resolve(body),
      } as any;

      const response = await PUT(req, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        code: 200,
        message: '更新成功',
        data: expect.any(Object),
      });
    });
  });

  describe('DELETE /api/organizations/[id]', () => {
    test('应该能删除机构', async () => {
      const headers = new Headers();
      headers.set('authorization', 'Bearer admin-token');

      const req = {
        headers,
      } as any;

      const response = await DELETE(req, { params: { id: '1' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        code: 200,
        message: '删除成功',
        data: expect.any(Object),
      });
    });
  });
}); 