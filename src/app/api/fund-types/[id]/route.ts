import { NextRequest, NextResponse } from 'next/server'
import { services } from '@/lib/services'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { ApiError } from '@/lib/errors'

interface Params {
  params: {
    id: string
  }
}

/**
 * @api {get} /api/fund-types/:id 获取资金需求类型详情
 */
export async function GET(req: NextRequest, { params }: Params) {
  // 使用getServerSession替代parseSession进行权限检查
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ message: '未授权访问' }, { status: 401 });
  }

  try {
    const fundType = await services.fundType.findById(params.id)
    return NextResponse.json(fundType);
  } catch (error: any) {
    if (error.statusCode === 404) {
      return NextResponse.json(
        { message: error.message },
        { status: 404 }
      )
    }
    
    console.error('获取资金需求类型详情失败:', error)
    return NextResponse.json(
      { message: '获取资金需求类型详情失败' },
      { status: 500 }
    )
  }
}

/**
 * @api {put} /api/fund-types/:id 更新资金需求类型
 */
export async function PUT(req: NextRequest, { params }: Params) {
  // 使用getServerSession替代parseSession进行权限检查
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ message: '未授权访问' }, { status: 401 });
  }
  
  // 只有管理员可以更新资金需求类型
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: '权限不足，只有管理员可以更新资金需求类型' }, { status: 403 });
  }
  
  try {
    // 解析请求体
    const data = await req.json()
    
    // 验证数据
    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      return NextResponse.json(
        { message: '资金需求类型名称不能为空' },
        { status: 400 }
      )
    }
    
    // 更新资金需求类型
    const fundType = await services.fundType.update(params.id, {
      name: data.name.trim()
    })
    
    return NextResponse.json(fundType);
  } catch (error: any) {
    if (error.statusCode === 404) {
      return NextResponse.json(
        { message: error.message },
        { status: 404 }
      )
    } else if (error.statusCode === 400) {
      return NextResponse.json(
        { message: error.message },
        { status: 400 }
      )
    }
    
    console.error('更新资金需求类型失败:', error)
    return NextResponse.json(
      { message: '更新资金需求类型失败' },
      { status: 500 }
    )
  }
}

/**
 * @api {delete} /api/fund-types/:id 删除资金需求类型
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  // 使用getServerSession替代parseSession进行权限检查
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ message: '未授权访问' }, { status: 401 });
  }
  
  // 只有管理员可以删除资金需求类型
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: '权限不足，只有管理员可以删除资金需求类型' }, { status: 403 });
  }
  
  try {
    await services.fundType.delete(params.id)
    return NextResponse.json({
      message: '删除成功'
    })
  } catch (error: any) {
    console.error('删除资金需求类型失败:', error)
    if (error instanceof ApiError) {
      throw error
    }
    throw ApiError.internal('删除资金需求类型失败')
  }
} 