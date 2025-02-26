import { NextRequest } from 'next/server'
import { services } from '@/lib/services'
import { checkPermission } from '@/lib/auth/permission'
import { parseSession } from '@/lib/auth/session'

/**
 * @api {get} /api/fund-types 获取资金需求类型列表
 */
export async function GET(req: NextRequest) {
  // 检查权限
  const authHeader = req.headers.get('authorization')
  const session = parseSession(authHeader)
  if (!session || !session.user) {
    return Response.json({ message: '未授权' }, { status: 401 })
  }

  const url = new URL(req.url)
  
  // 解析查询参数
  const page = parseInt(url.searchParams.get('page') || '1')
  const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
  const search = url.searchParams.get('search') || ''
  const sortBy = url.searchParams.get('sortBy') || 'createdAt'
  const sortOrder = url.searchParams.get('sortOrder') || 'desc'
  
  // 使用服务获取数据
  const result = await services.fundType.findAll(
    { page, pageSize },
    { 
      search, 
      sorting: {
        field: sortBy,
        order: sortOrder as 'asc' | 'desc'
      }
    }
  )
  
  return Response.json(result)
}

/**
 * @api {post} /api/fund-types 创建资金需求类型
 */
export async function POST(req: NextRequest) {
  // 检查权限
  const authHeader = req.headers.get('authorization')
  const session = parseSession(authHeader)
  if (!session || !session.user) {
    return Response.json({ message: '未授权' }, { status: 401 })
  }

  // 检查权限
  const hasPermission = await checkPermission(session, {
    resource: 'fundType',
    action: 'create',
    scope: 'all'
  })

  if (!hasPermission) {
    return Response.json({ message: '权限不足' }, { status: 403 })
  }
  
  // 解析请求体
  const data = await req.json()
  
  // 验证数据
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    return Response.json(
      { message: '资金需求类型名称不能为空' },
      { status: 400 }
    )
  }
  
  try {
    // 创建资金需求类型
    const fundType = await services.fundType.create({
      name: data.name.trim()
    })
    
    return Response.json(fundType, { status: 201 })
  } catch (error: any) {
    if (error.statusCode === 400) {
      return Response.json(
        { message: error.message },
        { status: 400 }
      )
    }
    
    console.error('创建资金需求类型失败:', error)
    return Response.json(
      { message: '创建资金需求类型失败' },
      { status: 500 }
    )
  }
}