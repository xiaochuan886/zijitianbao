import { NextRequest } from 'next/server'
import { ProjectService } from '@/lib/services/project.service'
import { withErrorHandler } from '@/lib/api-middlewares'
import { ProjectStatus } from '@prisma/client'

const projectService = new ProjectService()

// GET /api/projects - 获取项目列表
export const GET = withErrorHandler(async (req: NextRequest) => {
  const searchParams = req.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '10')
  const search = searchParams.get('search') || ''
  const organizationId = searchParams.get('organizationId') || undefined
  const status = searchParams.get('status') as ProjectStatus | undefined
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

  const result = await projectService.getProjects({
    page,
    pageSize,
    search,
    organizationId,
    status,
    sortBy,
    sortOrder
  })

  return Response.json(result)
})

// POST /api/projects - 创建项目
export const POST = withErrorHandler(async (req: NextRequest) => {
  const data = await req.json()
  const result = await projectService.createProject(data)
  return Response.json(result)
})