import { NextRequest, NextResponse } from "next/server"

export async function requireTwoFactor(
  req: NextRequest,
  handler: () => Promise<NextResponse>
) {
  const twoFactorToken = req.headers.get("x-two-factor-token")
  
  if (!twoFactorToken) {
    return new NextResponse(
      JSON.stringify({ 
        error: "需要二次认证",
        requireTwoFactor: true 
      }),
      { 
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  }

  // 验证二次认证token
  try {
    // TODO: 实现token验证逻辑
    // const isValid = await verifyTwoFactorToken(twoFactorToken)
    const isValid = true // 临时返回true，等待实际验证逻辑实现
    
    if (!isValid) {
      return new NextResponse(
        JSON.stringify({ 
          error: "二次认证失败",
          requireTwoFactor: true 
        }),
        { 
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    }

    return await handler()
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ 
        error: "二次认证验证失败",
        requireTwoFactor: true 
      }),
      { 
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
  }
} 