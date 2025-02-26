import { NextRequest, NextResponse } from 'next/server'
import { ProjectService } from '@/lib/services/project.service'
import { ProjectStatus } from '@prisma/client'
import { parseSession } from '@/lib/auth/session'

const projectService = new ProjectService()

// GET /api/projects - 获取项目列表
export async function GET(req: NextRequest) {
  try {
    // 检查授权
    const session = await parseSession(req.headers.get('authorization'))
    if (!session) {
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
    // 检查授权
    const session = await parseSession(req.headers.get('authorization'))
    if (!session) {
      return NextResponse.json(
        { message: '未授权访问' },
        { status: 401 }
      )
    }

    const data = await req.json()
    console.log('接收到的项目数据:', data)
    
    try {
      const result = await projectService.create(data)
      console.log('项目创建成功:', result)
      return NextResponse.json(result)
    } catch (serviceError: any) {
      console.error('项目服务错误:', serviceError)
      return NextResponse.json(
        { message: serviceError.message || '创建项目失败' },
        { status: serviceError.statusCode || 500 }
      )
    }
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { message: error.message || '创建项目失败' },
      { status: error.statusCode || 500 }
    )
  }
}