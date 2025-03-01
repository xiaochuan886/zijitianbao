import { NextRequest, NextResponse } from 'next/server'
import { ProjectCategoryService } from '@/lib/services/project-category.service'
import { parseSession } from '@/lib/auth/session'
import { Role } from '@/lib/enums'

const projectCategoryService = new ProjectCategoryService()

interface RouteContext {
  params: { id: string }
}

// GET /api/project-categories/[id] - 获取项目分类详情
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    // 检查授权
    const session = await parseSession(req.headers.get('authorization'))
    if (!session) {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 401 }
      )
    }

    const result = await projectCategoryService.findById(context.params.id)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { message: error.message || '获取项目分类详情失败' },
      { status: error.statusCode || 500 }
    )
  }
}

// PUT /api/project-categories/[id] - 更新项目分类
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    // 检查授权
    const session = await parseSession(req.headers.get('authorization'))
    if (!session) {
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
    const result = await projectCategoryService.update(context.params.id, data)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { message: error.message || '更新项目分类失败' },
      { status: error.statusCode || 500 }
    )
  }
}

// DELETE /api/project-categories/[id] - 删除项目分类
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    // 检查授权
    const session = await parseSession(req.headers.get('authorization'))
    if (!session) {
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

    await projectCategoryService.delete(context.params.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { message: error.message || '删除项目分类失败' },
      { status: error.statusCode || 500 }
    )
  }
} 