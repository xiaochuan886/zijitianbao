import { NextRequest, NextResponse } from 'next/server'
import { services } from '@/lib/services'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'

/**
 * @api {get} /api/fund-types 获取资金需求类型列表
 */
export async function GET(req: NextRequest) {
  // 使用getServerSession替代parseSession进行权限检查
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ message: '未授权访问' }, { status: 401 });
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
  
  return NextResponse.json(result);
}

/**
 * @api {post} /api/fund-types 创建资金需求类型
 */
export async function POST(req: NextRequest) {
  // 使用getServerSession替代parseSession进行权限检查
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user) {
    return NextResponse.json({ message: '未授权访问' }, { status: 401 });
  }
  
  // 只有管理员可以创建资金需求类型
  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ message: '权限不足，只有管理员可以创建资金需求类型' }, { status: 403 });
  }

  try {
    const data = await req.json()
    const result = await services.fundType.create(data)
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '创建资金需求类型失败' },
      { status: error.statusCode || 500 }
    );
  }
}