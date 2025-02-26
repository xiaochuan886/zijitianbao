import { NextRequest, NextResponse } from 'next/server'
import { ProjectService } from '@/lib/services/project.service'
import { ProjectStatus } from '@prisma/client'

const projectService = new ProjectService()

// GET /api/projects - 获取项目列表
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const organizationId = searchParams.get('organizationId') || undefined
    const status = searchParams.get('status') as ProjectStatus | undefined
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    const result = await projectService.findAll(
      { page, pageSize },
      { 
        search, 
        filters: {
          organizationId,
          status
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
      { message: error.message || '获取项目列表失败' },
      { status: error.statusCode || 500 }
    )
  }
}

// POST /api/projects - 创建项目
export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const result = await projectService.create(data)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { message: error.message || '创建项目失败' },
      { status: error.statusCode || 500 }
    )
  }
}