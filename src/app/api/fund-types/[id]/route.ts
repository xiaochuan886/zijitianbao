import { NextRequest } from 'next/server'
import { services } from '@/lib/services'
import { checkPermission } from '@/lib/auth/permission'
import { parseSession } from '@/lib/auth/session'

interface Params {
  params: {
    id: string
  }
}

/**
 * @api {get} /api/fund-types/:id 获取资金需求类型详情
 */
export async function GET(req: NextRequest, { params }: Params) {
  // 检查权限
  const authHeader = req.headers.get('authorization')
  const session = parseSession(authHeader)
  if (!session || !session.user) {
    return Response.json({ message: '未授权' }, { status: 401 })
  }

  try {
    const fundType = await services.fundType.findById(params.id)
    return Response.json(fundType)
  } catch (error: any) {
    if (error.statusCode === 404) {
      return Response.json(
        { message: error.message },
        { status: 404 }
      )
    }
    
    console.error('获取资金需求类型详情失败:', error)
    return Response.json(
      { message: '获取资金需求类型详情失败' },
      { status: 500 }
    )
  }
}

/**
 * @api {put} /api/fund-types/:id 更新资金需求类型
 */
export async function PUT(req: NextRequest, { params }: Params) {
  // 检查权限
  const authHeader = req.headers.get('authorization')
  const session = parseSession(authHeader)
  if (!session || !session.user) {
    return Response.json({ message: '未授权' }, { status: 401 })
  }

  // 检查权限
  const hasPermission = await checkPermission(session, {
    resource: 'fundType',
    action: 'update',
    scope: 'all'
  })

  if (!hasPermission) {
    return Response.json({ message: '权限不足' }, { status: 403 })
  }
  
  try {
    // 解析请求体
    const data = await req.json()
    
    // 验证数据
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      return Response.json(
        { message: '资金需求类型名称不能为空' },
        { status: 400 }
      )
    }
    
    // 更新资金需求类型
    const fundType = await services.fundType.update(params.id, {
      name: data.name.trim()
    })
    
    return Response.json(fundType)
  } catch (error: any) {
    if (error.statusCode === 404) {
      return Response.json(
        { message: error.message },
        { status: 404 }
      )
    } else if (error.statusCode === 400) {
      return Response.json(
        { message: error.message },
        { status: 400 }
      )
    }
    
    console.error('更新资金需求类型失败:', error)
    return Response.json(
      { message: '更新资金需求类型失败' },
      { status: 500 }
    )
  }
}

/**
 * @api {delete} /api/fund-types/:id 删除资金需求类型
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  // 检查权限
  const authHeader = req.headers.get('authorization')
  const session = parseSession(authHeader)
  if (!session || !session.user) {
    return Response.json({ message: '未授权' }, { status: 401 })
  }

  // 检查权限
  const hasPermission = await checkPermission(session, {
    resource: 'fundType',
    action: 'delete',
    scope: 'all'
  })

  if (!hasPermission) {
    return Response.json({ message: '权限不足' }, { status: 403 })
  }
  
  try {
    await services.fundType.delete(params.id)
    return new Response(null, { status: 204 })
  } catch (error: any) {
    if (error.statusCode === 404) {
      return Response.json(
        { message: error.message },
        { status: 404 }
      )
    } else if (error.statusCode === 400) {
      return Response.json(
        { message: error.message },
        { status: 400 }
      )
    }
    
    console.error('删除资金需求类型失败:', error)
    return Response.json(
      { message: '删除资金需求类型失败' },
      { status: 500 }
    )
  }
} 