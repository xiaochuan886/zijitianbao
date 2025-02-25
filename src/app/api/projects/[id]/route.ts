import { NextRequest } from 'next/server'
import { ProjectService } from '@/lib/services/project.service'
import { withErrorHandler } from '@/lib/api-middlewares'

const projectService = new ProjectService()

// GET /api/projects/[id] - 获取项目详情
export const GET = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const result = await projectService.getProjectById(params.id)
  return Response.json(result)
})

// PUT /api/projects/[id] - 更新项目
export const PUT = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const data = await req.json()
  const result = await projectService.updateProject(params.id, data)
  return Response.json(result)
})

// DELETE /api/projects/[id] - 删除项目
export const DELETE = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: { id: string } }
) => {
  const result = await projectService.deleteProject(params.id)
  return Response.json(result)
})