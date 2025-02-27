import { prisma } from '../prisma'
import { ServiceError } from './types'
import { hash } from 'bcryptjs'
import { Role } from '@/lib/enums'

// 用户查询参数接口
export interface UserQueryParams {
  page?: number
  pageSize?: number
  search?: string
  organizationId?: string
  role?: Role
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// 用户创建接口
export interface CreateUserParams {
  name: string
  email: string
  password: string
  role: Role
  organizationId?: string
  organizationIds?: string[]
}

// 用户更新接口
export interface UpdateUserParams {
  name?: string
  email?: string
  role?: Role
  organizationId?: string
  organizationIds?: string[]
  active?: boolean
}

export class UserService {
  /**
   * 获取用户列表
   */
  async getUsers({
    page = 1,
    pageSize = 10,
    search = '',
    organizationId,
    role,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  }: UserQueryParams) {
    // 构建查询条件
    const where: any = {}
    
    // 搜索条件
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    // 组织过滤
    if (organizationId) {
      where.organizationId = organizationId
    }
    
    // 角色过滤
    if (role) {
      where.role = role
    }

    // 执行查询
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          organizationId: true,
          organization: {
            select: {
              id: true,
              name: true
            }
          },
          organizations: {
            select: {
              organization: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          active: true,
          createdAt: true,
          updatedAt: true
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: {
          [sortBy]: sortOrder
        }
      }),
      prisma.user.count({ where })
    ])

    // 格式化用户数据，将organizations转换为扁平数组
    const formattedUsers = users.map(user => {
      // 确保类型安全
      const userOrgs = user.organizations ? 
        user.organizations.map(uo => uo.organization) : [];
      
      return {
        ...user,
        organizations: userOrgs
      };
    });

    return {
      users: formattedUsers,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  }

  /**
   * 获取用户详情
   */
  async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true
          }
        },
        organizations: {
          select: {
            organization: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        active: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      throw new ServiceError(404, '用户不存在')
    }

    // 格式化用户数据
    const formattedUser = {
      ...user,
      organizations: user.organizations.map(uo => uo.organization)
    };

    return { user: formattedUser }
  }

  /**
   * 创建用户
   */
  async createUser({ name, email, password, role, organizationId, organizationIds }: CreateUserParams) {
    // 检查邮箱是否已存在
    const exists = await prisma.user.findUnique({
      where: { email }
    })

    if (exists) {
      throw new ServiceError(400, '邮箱已被注册')
    }

    // 如果指定了组织ID，检查组织是否存在
    if (organizationId) {
      const orgExists = await prisma.organization.findUnique({
        where: { id: organizationId }
      })

      if (!orgExists) {
        throw new ServiceError(400, '指定的组织不存在')
      }
    }

    // 加密密码
    const hashedPassword = await hash(password, 10)

    // 创建用户 - 移除active字段，使用默认值
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        organizationId
        // active字段会使用schema中的默认值true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        organizationId: true,
        organization: {
          select: {
            id: true,
            name: true,
          }
        },
        active: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // 处理多机构关联
    if (organizationIds && organizationIds.length > 0) {
      // 过滤掉空值
      const validOrgIds = organizationIds.filter(id => id !== null && id !== undefined && id !== '');
      
      if (validOrgIds.length > 0) {
        // 创建用户-机构关联，移除skipDuplicates参数
        await prisma.userOrganization.createMany({
          data: validOrgIds.map(orgId => ({
            userId: user.id,
            organizationId: orgId
          }))
        });
      }
    }

    return { user }
  }

  /**
   * 更新用户
   */
  async updateUser(id: string, data: UpdateUserParams) {
    // 检查用户是否存在
    const exists = await prisma.user.findUnique({
      where: { id }
    })

    if (!exists) {
      throw new ServiceError(404, '用户不存在')
    }

    // 提取organizationIds，不包含在update数据中
    const { organizationIds, ...updateData } = data

    // 如果更新组织，检查组织是否存在
    if (updateData.organizationId) {
      const orgExists = await prisma.organization.findUnique({
        where: { id: updateData.organizationId }
      })

      if (!orgExists) {
        throw new ServiceError(400, '指定的主要组织不存在')
      }
    }

    // 检查所有organizationIds是否有效
    if (organizationIds && organizationIds.length > 0) {
      const orgCount = await prisma.organization.count({
        where: {
          id: { in: organizationIds }
        }
      })

      if (orgCount !== organizationIds.length) {
        throw new ServiceError(400, '一个或多个指定的组织不存在')
      }
    }

    // 使用事务确保更新和关联操作的原子性
    const user = await prisma.$transaction(async (tx) => {
      // 更新用户基本信息
      const updatedUser = await tx.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          organizationId: true,
          organization: {
            select: {
              id: true,
              name: true,
            }
          },
          organizations: {
            select: {
              organization: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          },
          active: true,
          createdAt: true,
          updatedAt: true
        }
      })

      // 如果提供了organizationIds，更新用户-机构关联
      if (organizationIds) {
        // 先删除所有现有关联
        await tx.userOrganization.deleteMany({
          where: { userId: id }
        });

        // 然后创建新的关联
        if (organizationIds.length > 0) {
          // 过滤掉空值
          const validOrgIds = organizationIds.filter(id => id !== null && id !== undefined && id !== '');
          
          if (validOrgIds.length > 0) {
            // 移除skipDuplicates参数
            await tx.userOrganization.createMany({
              data: validOrgIds.map(orgId => ({
                userId: id,
                organizationId: orgId
              }))
            });
          }
        }
      }

      return updatedUser
    })

    // 格式化返回数据，将关联组织转换为扁平数组
    const formattedUser = {
      ...user,
      organizations: user.organizations ? user.organizations.map(uo => uo.organization) : []
    }

    return formattedUser
  }

  /**
   * 删除用户
   */
  async deleteUser(id: string) {
    // 检查用户是否存在
    const exists = await prisma.user.findUnique({
      where: { id }
    })

    if (!exists) {
      throw new ServiceError(404, '用户不存在')
    }

    // 检查是否有关联数据，如记录等
    const hasRecords = await prisma.record.findFirst({
      where: { submittedBy: id }
    })

    if (hasRecords) {
      throw new ServiceError(400, '该用户已提交记录，无法删除')
    }

    // 删除用户
    await prisma.user.delete({
      where: { id }
    })

    return { success: true }
  }

  /**
   * 重置用户密码
   */
  async resetPassword(id: string, newPassword: string) {
    // 检查用户是否存在
    const exists = await prisma.user.findUnique({
      where: { id }
    })

    if (!exists) {
      throw new ServiceError(404, '用户不存在')
    }

    // 加密新密码
    const hashedPassword = await hash(newPassword, 10)

    // 更新密码
    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    })

    return { success: true }
  }
} 