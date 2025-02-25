import { NextRequest } from 'next/server';
import { OrganizationService } from '@/lib/services/organization.service';
import { checkPermission } from '@/lib/auth/permission';
import { parseSession } from '@/lib/auth/session';
import { NextResponse } from "next/server"
import { PrismaClient, Prisma } from "@prisma/client"

const organizationService = new OrganizationService();
const prisma = new PrismaClient()

// GET /api/organizations - 获取机构列表
export async function GET(request: Request) {
  try {
    // 1. 获取查询参数
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get("page") || "1")
    const pageSize = parseInt(url.searchParams.get("pageSize") || "10")
    const search = url.searchParams.get("search") || ""

    // 2. 权限检查
    const session = await parseSession(request.headers.get("authorization"))
    if (!session) {
      return NextResponse.json(
        { message: "未授权访问" },
        { status: 401 }
      )
    }

    // 3. 构建查询条件
    const where: Prisma.OrganizationWhereInput = {
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { code: { contains: search } },
            ],
          }
        : {}),
      // 如果不是管理员，只能看到自己所在机构的数据
      ...(session.user.role !== "ADMIN" && session.user.organizationId
        ? { id: session.user.organizationId }
        : {}),
    }

    // 4. 查询数据
    const [total, items] = await Promise.all([
      prisma.organization.count({ where }),
      prisma.organization.findMany({
        where,
        include: {
          departments: {
            select: {
              id: true,
              name: true,
            },
          },
          users: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
          projects: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
          createdAt: "desc",
        },
      }),
    ])

    // 5. 返回结果
    return NextResponse.json({
      code: 200,
      message: "获取成功",
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (error) {
    console.error("GET /api/organizations error:", error)
    return NextResponse.json(
      { message: "服务器内部错误" },
      { status: 500 }
    )
  }
}

// POST /api/organizations - 创建机构
export async function POST(request: Request) {
  try {
    // 1. 获取请求数据
    const data = await request.json()

    // 2. 权限检查
    const session = await parseSession(request.headers.get("authorization"))
    if (!session) {
      return NextResponse.json(
        { message: "未授权访问" },
        { status: 401 }
      )
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { message: "无权限执行此操作" },
        { status: 403 }
      )
    }

    // 3. 检查机构编码是否已存在
    const exists = await prisma.organization.findUnique({
      where: { code: data.code },
    })

    if (exists) {
      return NextResponse.json(
        { message: "机构编码已存在" },
        { status: 400 }
      )
    }

    // 4. 创建机构
    const organization = await prisma.organization.create({
      data: {
        name: data.name,
        code: data.code,
      },
      include: {
        departments: true,
      },
    })

    // 5. 返回结果
    return NextResponse.json({
      code: 200,
      message: "创建成功",
      data: organization,
    })
  } catch (error) {
    console.error("POST /api/organizations error:", error)
    return NextResponse.json(
      { message: "服务器内部错误" },
      { status: 500 }
    )
  }
} 