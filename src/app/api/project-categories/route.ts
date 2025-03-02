import { NextRequest, NextResponse } from 'next/server'
import { ProjectCategoryService } from '@/lib/services/project-category.service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { Role } from '@/lib/enums'
import { prisma } from '@/lib/prisma'

const projectCategoryService = new ProjectCategoryService()

// GET /api/project-categories - 获取项目分类列表
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
    
    // 查询项目分类列表
    const categories = await prisma.projectCategory.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return NextResponse.json(categories)
  } catch (error) {
    console.error('获取项目分类列表失败:', error)
    return NextResponse.json(
      { message: '获取项目分类列表失败' },
      { status: 500 }
    )
  }
}

// POST /api/project-categories - 创建项目分类
export async function POST(req: NextRequest) {
  try {
    // 检查授权
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 401 }
      )
    }

    // 检查权限
    if (session.user.role !== Role.ADMIN) {
      return NextResponse.json(
        { message: '没有权限执行此操作' },
        { status: 403 }
      )
    }

    const data = await req.json()
    const result = await projectCategoryService.create(data)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { message: error.message || '创建项目分类失败' },
      { status: error.statusCode || 500 }
    )
  }
} 