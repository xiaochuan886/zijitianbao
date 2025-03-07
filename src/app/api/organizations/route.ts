import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import { Role } from "@/lib/enums";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";
import { prisma } from '@/lib/prisma'

const prismaClient = new PrismaClient();

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
    // 获取查询参数
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    
    // 构建查询条件
    const where = search ? {
      name: {
        contains: search
      }
    } : {}
    
    // 查询组织列表
    const organizations = await prisma.organization.findMany({
      where,
      include: {
        departments: {
          where: {
            isDeleted: false
          },
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    // 返回数据
    return NextResponse.json(organizations)
  } catch (error) {
    console.error('获取组织列表失败:', error)
    return NextResponse.json(
      { message: '获取组织列表失败' },
      { status: 500 }
    )
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
    const existingOrg = await prismaClient.organization.findUnique({
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
    const newOrganization = await prismaClient.organization.create({
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