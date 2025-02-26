import { NextRequest } from 'next/server'
import { withErrorHandler } from '@/lib/api-middlewares'
import { services } from '@/lib/services'
import { ApiError } from '@/lib/api-middlewares'

interface Params {
  params: {
    id: string
  }
}

export const GET = withErrorHandler(async (req: NextRequest, { params }: Params) => {
  // 检查认证token
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized()
  }

  try {
    const fundTypeService = new services.FundTypeService()
    const fundType = await fundTypeService.findById(params.id)

    return Response.json({
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
})