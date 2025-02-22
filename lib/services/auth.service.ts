import { prisma } from '../prisma'
import { ServiceError } from './types'
import { hash, compare } from 'bcrypt'

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: {
    id: string
    name: string
    email: string
    role: string
    organizationId: string | null
  }
}

export class AuthService {
  async login({ email, password }: LoginRequest): Promise<LoginResponse> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
        organizationId: true,
      },
    })

    if (!user) {
      throw new ServiceError(401, '用户不存在')
    }

    const isValid = await compare(password, user.password)
    if (!isValid) {
      throw new ServiceError(401, '密码错误')
    }

    const { password: _, ...userWithoutPassword } = user
    return { user: userWithoutPassword }
  }

  async register(data: {
    name: string
    email: string
    password: string
    organizationId?: string
  }) {
    const exists = await prisma.user.findUnique({
      where: { email: data.email },
    })

    if (exists) {
      throw new ServiceError(400, '邮箱已被注册')
    }

    const hashedPassword = await hash(data.password, 10)

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationId: true,
      },
    })

    return { user }
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    })

    if (!user) {
      throw new ServiceError(404, '用户不存在')
    }

    const isValid = await compare(oldPassword, user.password)
    if (!isValid) {
      throw new ServiceError(401, '原密码错误')
    }

    const hashedPassword = await hash(newPassword, 10)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })
  }
} 