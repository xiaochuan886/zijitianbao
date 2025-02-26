import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-middlewares'
import { services } from '@/lib/services'

export const GET = withErrorHandler(async (req: NextRequest) => {
  // 检查认证token
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { message: '未授权访问' },
      { status: 401 }
    )
  }

  try {
    // 获取查询参数
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    // 获取资金需求类型列表
    const result = await services.fundType.findAll(
      { page, pageSize },
      { 
        search, 
        sorting: {
          field: sortBy,
          order: sortOrder
        }
      }
    )

    return NextResponse.json({
      code: 200,
      message: '获取成功',
      data: result
    })
  } catch (error: any) {
    console.error('获取资金需求类型列表失败:', error)
    return NextResponse.json(
      { message: error.message || '获取资金需求类型列表失败' },
      { status: error.statusCode || 500 }
    )
  }
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  // 检查认证token
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { message: '未授权访问' },
      { status: 401 }
    )
  }

  try {
    // 获取请求数据
    const data = await req.json()
    
    // 创建资金需求类型
    const result = await services.fundType.create(data)
    
    return NextResponse.json({
      code: 200,
      message: '创建成功',
      data: result
    })
  } catch (error: any) {
    console.error('创建资金需求类型失败:', error)
    return NextResponse.json(
      { message: error.message || '创建资金需求类型失败' },
      { status: error.statusCode || 500 }
    )
  }
})