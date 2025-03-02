import { NextRequest, NextResponse } from 'next/server'
import { ProjectCategoryService } from '@/lib/services/project-category.service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { Role } from '@/lib/enums'

const projectCategoryService = new ProjectCategoryService()

// GET /api/project-categories - 获取项目分类列表
export async function GET(req: NextRequest) {
  try {
    // 检查授权
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 401 }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const organizationId = searchParams.get('organizationId') || undefined
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    const result = await projectCategoryService.findAll(
      { page, pageSize },
      { 
        search, 
        filters: {
          organizationId
        },
        sorting: {
          field: sortBy,
          order: sortOrder
        }
      }
    )

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { message: error.message || '获取项目分类列表失败' },
      { status: error.statusCode || 500 }
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