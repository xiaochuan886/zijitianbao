import { NextRequest, NextResponse } from 'next/server'
import { ProjectService } from '@/lib/services/project.service'
import { ApiError } from '@/lib/api-middlewares'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'

const projectService = new ProjectService()

interface RouteContext {
  params: { id: string }
}

// GET /api/projects/[id] - 获取项目详情
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    // 使用getServerSession替代parseSession进行权限检查
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ message: '未授权访问' }, { status: 401 });
    }

    const result = await projectService.findById(context.params.id)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { message: error.message || '获取项目详情失败' },
      { status: error.statusCode || 500 }
    )
  }
}

// PUT /api/projects/[id] - 更新项目
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    // 使用getServerSession替代parseSession进行权限检查
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ message: '未授权访问' }, { status: 401 });
    }

    const data = await req.json()
    const result = await projectService.update(context.params.id, data)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { message: error.message || '更新项目失败' },
      { status: error.statusCode || 500 }
    )
  }
}

// DELETE /api/projects/[id] - 删除项目
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    // 使用getServerSession替代parseSession进行权限检查
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ message: '未授权访问' }, { status: 401 });
    }

    await projectService.delete(context.params.id)
    return NextResponse.json({ message: '删除成功' })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { message: error.message || '删除项目失败' },
      { status: error.statusCode || 500 }
    )
  }
}