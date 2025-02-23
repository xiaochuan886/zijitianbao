import { NextRequest } from 'next/server';
import { services } from '@/lib/services';
import { checkPermission } from '@/lib/auth/permission';
import { createPermissionError } from '@/lib/auth/errors';
import { parseSession } from '@/lib/auth/session';
import { ServiceError } from '@/lib/services/types';
import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { verifyToken } from '@/app/lib/auth/token'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// GET /api/organizations - 获取机构列表
export async function GET(request: Request) {
  try {
    // 验证用户权限
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ message: '未授权访问' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ message: '未授权访问' }, { status: 401 })
    }

    // 只允许管理员访问
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ message: '没有权限访问此资源' }, { status: 403 })
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''

    // 构建查询条件
    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { code: { contains: search } },
          ],
        }
      : {}

    // 获取总数
    const total = await prisma.organization.count({ where })

    // 获取分页数据
    const organizations = await prisma.organization.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: {
            departments: true,
            projects: true,
          },
        },
      },
    })

    // 格式化返回数据
    const data = organizations.map(org => ({
      id: org.id,
      name: org.name,
      code: org.code,
      departments: org._count.departments,
      projects: org._count.projects,
    }))

    return NextResponse.json({ data, total })
  } catch (error) {
    console.error('获取机构列表失败:', error)
    return NextResponse.json(
      { message: '获取机构列表失败' },
      { status: 500 }
    )
  }
}

// POST /api/organizations - 创建机构
export async function POST(request: Request) {
  try {
    // 验证用户权限
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    if (!token) {
      return NextResponse.json({ message: '未授权访问' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ message: '没有权限执行此操作' }, { status: 403 })
    }

    const body = await request.json()
    const { name, code, departments } = body

    // 检查机构编码是否已存在
    const existingOrg = await prisma.organization.findUnique({
      where: { code },
    })

    if (existingOrg) {
      return NextResponse.json(
        { message: '机构编码已存在' },
        { status: 400 }
      )
    }

    // 创建机构和部门
    const organization = await prisma.organization.create({
      data: {
        name,
        code,
        departments: {
          create: departments?.map((name: string) => ({ name })) || [],
        },
      },
    })

    return NextResponse.json(organization)
  } catch (error) {
    console.error('创建机构失败:', error)
    return NextResponse.json(
      { message: '创建机构失败' },
      { status: 500 }
    )
  }
} 