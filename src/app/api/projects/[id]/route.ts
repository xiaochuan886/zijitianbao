import { NextRequest, NextResponse } from 'next/server'
import { ProjectService } from '@/lib/services/project.service'
import { ApiError } from '@/lib/api-middlewares'

const projectService = new ProjectService()

interface RouteContext {
  params: { id: string }
}

// GET /api/projects/[id] - 获取项目详情
export async function GET(req: NextRequest, context: RouteContext) {
  try {
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
    await projectService.delete(context.params.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { message: error.message || '删除项目失败' },
      { status: error.statusCode || 500 }
    )
  }
}