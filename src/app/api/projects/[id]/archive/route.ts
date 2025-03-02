import { NextRequest, NextResponse } from 'next/server'
import { ProjectService } from '@/lib/services/project.service'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { ProjectStatus } from '@/lib/enums'

const projectService = new ProjectService()

interface RouteContext {
  params: { id: string }
}

// PUT /api/projects/[id]/archive - 归档或激活项目
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    // 检查授权
    const session = await getServerSession(authOptions)
    if (!session || !session.user) {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 401 }
      )
    }

    const projectId = context.params.id
    
    // 获取当前项目状态
    const project = await projectService.findById(projectId)
    
    // 检查用户是否有权限修改此项目
    const hasAccess = session.user.role === 'ADMIN' || 
      (project.organizationId === session.user.organizationId);
      
    if (!hasAccess) {
      return NextResponse.json(
        { message: '权限不足' },
        { status: 403 }
      )
    }
    
    // 切换状态
    const newStatus = project.status === ProjectStatus.ACTIVE ? ProjectStatus.ARCHIVED : ProjectStatus.ACTIVE
    
    // 更新项目状态
    const result = await projectService.update(projectId, { status: newStatus })
    
    return NextResponse.json({
      success: true,
      message: `项目已${newStatus === ProjectStatus.ACTIVE ? '激活' : '归档'}`,
      data: result
    })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { message: error.message || '更新项目状态失败' },
      { status: error.statusCode || 500 }
    )
  }
} 