import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

interface ErrorResponse {
  code: number
  message: string
  timestamp: string
}

type ApiHandler = (req: NextRequest) => Promise<NextResponse> | NextResponse

export function withErrorHandler(handler: ApiHandler) {
  return async function(req: NextRequest) {
    try {
      return await handler(req)
    } catch (error: any) {
      console.error('API Error:', error)

      const errorResponse: ErrorResponse = {
        code: error.statusCode || 500,
        message: error.message || '服务器内部错误',
        timestamp: new Date().toISOString()
      }

      return new NextResponse(
        JSON.stringify(errorResponse),
        {
          status: errorResponse.code,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }
  }
}

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'ApiError'
  }

  static badRequest(message: string) {
    return new ApiError(message, 400)
  }

  static unauthorized(message: string = '未授权访问') {
    return new ApiError(message, 401)
  }

  static forbidden(message: string = '权限不足') {
    return new ApiError(message, 403)
  }

  static notFound(message: string = '资源不存在') {
    return new ApiError(message, 404)
  }

  static internal(message: string = '服务器内部错误') {
    return new ApiError(message, 500)
  }
}