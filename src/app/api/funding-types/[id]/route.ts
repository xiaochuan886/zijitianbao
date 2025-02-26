import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler } from '@/lib/api-middlewares'
import { services } from '@/lib/services'
import { ApiError } from '@/lib/api-middlewares'

interface Params {
  params: {
    id: string
  }
}

// 这里我们需要创建一个单独的处理函数，然后将其包装在withErrorHandler中
async function getFundTypeHandler(req: NextRequest, { params }: Params) {
  // 检查认证token
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized()
  }

  try {
    const fundType = await services.fundType.findById(params.id)

    return NextResponse.json({
      code: 200,
      message: '获取成功',
      data: fundType
    })
  } catch (error: any) {
    console.error('获取资金需求类型详情失败:', error)
    if (error instanceof ApiError) {
      throw error
    }
    throw ApiError.internal('获取资金需求类型详情失败')
  }
}

// 导出GET处理函数
export const GET = async (req: NextRequest, context: Params) => {
  return withErrorHandler((request) => getFundTypeHandler(request, context))(req)
}