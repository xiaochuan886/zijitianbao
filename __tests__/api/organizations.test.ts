import { describe, expect, test, jest, beforeAll, beforeEach } from '@jest/globals';
import { GET, POST } from '@/app/api/organizations/route';
import { GET as GET_BY_ID, PUT, DELETE } from '@/app/api/organizations/[id]/route';
import { prismaMock } from '../../jest.setup';
import { Organization } from '@prisma/client';
import { Session, Permission } from '@/lib/auth/types';

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
  checkPermission: jest.fn(async (session: Session | null, required: Permission): Promise<boolean> => {
    if (!session?.user) return false;
    return session.user.role === 'ADMIN';
  }),
}));

const mockOrg: Organization = {
  id: 'test-org-id',
  name: '测试机构',
  code: 'TEST001',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockOrgWithDepartments = {
  ...mockOrg,
  departments: [
    {
      id: 'test-dept-id',
      name: '测试部门',
      organizationId: 'test-org-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  ],
  _count: {
    users: 0,
    projects: 0,
  }
};

const mockOrgWithRelations = {
  ...mockOrgWithDepartments,
  users: [],
  projects: [],
};

let testOrgId = 'test-org-id';

describe('机构管理API测试', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock organization.findMany
    prismaMock.organization.findMany.mockResolvedValue([mockOrgWithDepartments]);
    // Mock organization.count
    prismaMock.organization.count.mockResolvedValue(1);
    // Mock organization.create
    prismaMock.organization.create.mockResolvedValue(mockOrgWithDepartments);
    // Mock organization.findUnique for existing organization
    prismaMock.organization.findUnique.mockImplementation(async (args) => {
      if (args.where.id === testOrgId) {
        return mockOrgWithRelations;
      }
      if (args.where.code === 'TEST001') {
        return null;
      }
      return null;
    });
    // Mock organization.update
    prismaMock.organization.update.mockResolvedValue(mockOrgWithDepartments);
    // Mock organization.delete
    prismaMock.organization.delete.mockResolvedValue(mockOrgWithDepartments);
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
      expect(data).toEqual(
        expect.objectContaining({
          code: 200,
          message: '获取成功',
          data: expect.objectContaining({
            items: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                name: expect.any(String),
                code: expect.any(String),
                departments: expect.arrayContaining([
                  expect.objectContaining({
                    id: expect.any(String),
                    name: expect.any(String),
                  })
                ]),
              }),
            ]),
            total: expect.any(Number),
            page: expect.any(Number),
            pageSize: expect.any(Number),
            totalPages: expect.any(Number),
          }),
        })
      );
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
      expect(data).toEqual(
        expect.objectContaining({
          code: 403,
          message: '权限不足',
        })
      );
    });
  });

  describe('POST /api/organizations', () => {
    test('管理员应该能创建机构', async () => {
      const headers = new Headers();
      headers.set('authorization', 'Bearer admin-token');
      headers.set('content-type', 'application/json');

      const body = {
        name: '测试机构',
        code: 'TEST002',
        departments: [{ name: '测试部门' }],
      };

      const req = {
        headers,
        json: () => Promise.resolve(body),
      } as any;

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(
        expect.objectContaining({
          code: 200,
          message: '创建成功',
          data: expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            code: expect.any(String),
            departments: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                name: expect.any(String),
              })
            ]),
          }),
        })
      );
      testOrgId = data.data.id;
    });

    test('机构编码不能重复', async () => {
      // Mock findUnique to simulate duplicate code
      prismaMock.organization.findUnique.mockResolvedValueOnce(mockOrg);

      const headers = new Headers();
      headers.set('authorization', 'Bearer admin-token');
      headers.set('content-type', 'application/json');

      const body = {
        name: '测试机构2',
        code: 'TEST001',
        departments: [{ name: '测试部门' }],
      };

      const req = {
        headers,
        json: () => Promise.resolve(body),
      } as any;

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual(
        expect.objectContaining({
          code: 400,
          message: '机构编码已存在',
        })
      );
    });
  });

  describe('GET /api/organizations/[id]', () => {
    test('应该能获取机构详情', async () => {
      const headers = new Headers();
      headers.set('authorization', 'Bearer admin-token');

      const req = {
        headers,
      } as any;

      const response = await GET_BY_ID(req, { params: { id: testOrgId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(
        expect.objectContaining({
          code: 200,
          message: '获取成功',
          data: expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            code: expect.any(String),
            departments: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                name: expect.any(String),
              })
            ]),
          }),
        })
      );
    });
  });

  describe('PUT /api/organizations/[id]', () => {
    test('应该能更新机构信息', async () => {
      const headers = new Headers();
      headers.set('authorization', 'Bearer admin-token');
      headers.set('content-type', 'application/json');

      const body = {
        name: '更新后的机构名称',
        departments: [{ name: '更新后的部门名称' }],
      };

      const req = {
        headers,
        json: () => Promise.resolve(body),
      } as any;

      const response = await PUT(req, { params: { id: testOrgId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(
        expect.objectContaining({
          code: 200,
          message: '更新成功',
          data: expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            code: expect.any(String),
            departments: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                name: expect.any(String),
              })
            ]),
          }),
        })
      );
    });
  });

  describe('DELETE /api/organizations/[id]', () => {
    test('应该能删除机构', async () => {
      const headers = new Headers();
      headers.set('authorization', 'Bearer admin-token');

      const req = {
        headers,
      } as any;

      const response = await DELETE(req, { params: { id: testOrgId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(
        expect.objectContaining({
          code: 200,
          message: '删除成功',
        })
      );
    });
  });
}); 