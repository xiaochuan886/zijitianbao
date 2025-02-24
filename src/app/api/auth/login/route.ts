import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { compare } from "bcryptjs"
import { sign } from "jsonwebtoken"
import { z } from "zod"

// 使用单例模式创建 Prisma 客户端
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

// 请求体验证schema
const loginSchema = z.object({
  username: z.string().email("请输入有效的邮箱地址"),
  password: z.string().min(6, "密码至少6个字符"),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    // 验证请求体
    const result = loginSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { message: "请求参数错误", errors: result.error.errors },
        { status: 400 }
      )
    }

    const { username, password } = result.data

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email: username },
    })

    if (!user) {
      return NextResponse.json(
        { message: "用户名或密码错误" },
        { status: 401 }
      )
    }

    // 验证密码
    const isValidPassword = await compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { message: "用户名或密码错误" },
        { status: 401 }
      )
    }

    // 生成JWT token
    const token = sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    )

    // 返回用户信息和token
    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId || "",
      },
    })
  } catch (error) {
    console.error("登录错误:", error)
    return NextResponse.json(
      { message: "服务器内部错误" },
      { status: 500 }
    )
  }
} 