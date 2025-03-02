import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import { Role } from "@/lib/enums";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

const prisma = new PrismaClient();

// 定义组织类型
interface Organization {
  id: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
  departments?: any[];
  users?: any[];
  projects?: any[];
}

/**
 * GET /api/organizations
 * 获取组织列表
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const includeRelations = searchParams.get('includeRelations') === 'true';
    
    // 使用 getServerSession 获取会话
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.error("认证失败：用户未登录");
      return NextResponse.json(
        { error: "身份验证失败，请重新登录" },
        { status: 401 }
      );
    }
    
    // 获取组织列表
    let organizations: Organization[] = [];
    
    // 基本查询选项
    const orderBy: Prisma.OrganizationOrderByWithRelationInput = { 
      name: 'asc' 
    };
    
    // 管理员可以看到所有组织
    if (session.user.role === Role.ADMIN) {
      if (includeRelations) {
        try {
          const rawOrganizations = await prisma.$queryRaw`
            SELECT 
              o.id, o.name, o.code, o.createdAt, o.updatedAt,
              (SELECT JSON_GROUP_ARRAY(JSON_OBJECT(
                'id', d.id, 'name', d.name
              )) FROM Department d WHERE d.organizationId = o.id AND d.isDeleted = 0) as departments,
              (SELECT JSON_GROUP_ARRAY(JSON_OBJECT(
                'id', u.id, 'name', u.name, 'role', u.role, 'email', u.email
              )) FROM User u WHERE u.organizationId = o.id AND u.active = 1) as users,
              (SELECT JSON_GROUP_ARRAY(JSON_OBJECT(
                'id', p.id, 'name', p.name, 'status', p.status
              )) FROM Project p WHERE p.organizationId = o.id) as projects
            FROM Organization o
            ORDER BY o.name ASC
          `;
          organizations = rawOrganizations as Organization[];
        } catch (error) {
          console.error("SQL查询失败:", error);
          organizations = await prisma.organization.findMany({
            include: {
              departments: true,
              users: {
                where: { active: true }
              },
              projects: true
            },
            orderBy
          });
        }
      } else {
        organizations = await prisma.organization.findMany({
          orderBy
        });
      }
    } else {
      // 非管理员只能看到自己所属的组织
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { organizationId: true }
      });
      
      if (user?.organizationId) {
        if (includeRelations) {
          try {
            const rawOrganizations = await prisma.$queryRaw`
              SELECT 
                o.id, o.name, o.code, o.createdAt, o.updatedAt,
                (SELECT JSON_GROUP_ARRAY(JSON_OBJECT(
                  'id', d.id, 'name', d.name
                )) FROM Department d WHERE d.organizationId = o.id AND d.isDeleted = 0) as departments,
                (SELECT JSON_GROUP_ARRAY(JSON_OBJECT(
                  'id', u.id, 'name', u.name, 'role', u.role, 'email', u.email
                )) FROM User u WHERE u.organizationId = o.id AND u.active = 1) as users,
                (SELECT JSON_GROUP_ARRAY(JSON_OBJECT(
                  'id', p.id, 'name', p.name, 'status', p.status
                )) FROM Project p WHERE p.organizationId = o.id) as projects
              FROM Organization o
              WHERE o.id = ${user.organizationId}
              ORDER BY o.name ASC
            `;
            organizations = rawOrganizations as Organization[];
          } catch (error) {
            console.error("SQL查询失败:", error);
            organizations = await prisma.organization.findMany({
              where: { id: user.organizationId },
              include: {
                departments: true,
                users: {
                  where: { active: true }
                },
                projects: true
              },
              orderBy
            });
          }
        } else {
          organizations = await prisma.organization.findMany({
            where: { id: user.organizationId },
            orderBy
          });
        }
      } else {
        organizations = [];
      }
    }
    
    // 解析JSON字符串为对象
    if (includeRelations) {
      organizations = organizations.map((org: any) => {
        try {
          if (typeof org.departments === 'string') {
            org.departments = JSON.parse(org.departments);
          }
          if (typeof org.users === 'string') {
            org.users = JSON.parse(org.users);
          }
          if (typeof org.projects === 'string') {
            org.projects = JSON.parse(org.projects);
          }
          
          // 确保是数组
          org.departments = Array.isArray(org.departments) ? org.departments : [];
          org.users = Array.isArray(org.users) ? org.users : [];
          org.projects = Array.isArray(org.projects) ? org.projects : [];
          
          return org;
        } catch (e) {
          console.error('解析关联数据失败:', e);
          return org;
        }
      });
    }
    
    return NextResponse.json(organizations);
  } catch (error) {
    console.error("获取组织列表失败:", error);
    
    return NextResponse.json(
      { error: "获取组织列表失败", details: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/organizations
 * 创建新组织
 */
export async function POST(req: NextRequest) {
  try {
    // 使用 getServerSession 获取会话
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "身份验证失败，请重新登录" },
        { status: 401 }
      );
    }
    
    // 只有管理员可以创建组织
    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { error: "权限不足，只有管理员可以创建组织" },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    
    // 验证请求数据
    if (!body.name || !body.code) {
      return NextResponse.json(
        { error: "机构名称和代码不能为空" },
        { status: 400 }
      );
    }
    
    // 检查代码是否已存在
    const existingOrg = await prisma.organization.findUnique({
      where: {
        code: body.code
      }
    });
    
    if (existingOrg) {
      return NextResponse.json(
        { error: "机构代码已存在" },
        { status: 400 }
      );
    }
    
    // 创建新组织
    const newOrganization = await prisma.organization.create({
      data: {
        name: body.name,
        code: body.code
      }
    });
    
    return NextResponse.json(newOrganization, { status: 201 });
  } catch (error) {
    console.error("创建组织失败:", error);
    
    return NextResponse.json(
      { error: "创建组织失败", details: (error as Error).message },
      { status: 500 }
    );
  }
}