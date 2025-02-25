import { prisma } from '../prisma'
import { PaginationParams, PaginatedResponse, QueryParams, ServiceError } from './types'
import { Prisma } from '@prisma/client'

export interface CreateFundTypeDto {
  name: string
}

export interface UpdateFundTypeDto {
  name: string
}

export class FundTypeService {
  /**
   * 创建资金需求类型
   */
  async create(data: CreateFundTypeDto) {
    try {
      return await prisma.fundType.create({
        data: {
          name: data.name
        }
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // 处理唯一约束冲突
        if (error.code === 'P2002') {
          throw new ServiceError(400, '资金需求类型名称已存在')
        }
      }
      throw error
    }
  }

  /**
   * 更新资金需求类型
   */
  async update(id: string, data: UpdateFundTypeDto) {
    const fundType = await prisma.fundType.findUnique({
      where: { id }
    })

    if (!fundType) {
      throw new ServiceError(404, '资金需求类型不存在')
    }

    try {
      return await prisma.fundType.update({
        where: { id },
        data: {
          name: data.name
        }
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // 处理唯一约束冲突
        if (error.code === 'P2002') {
          throw new ServiceError(400, '资金需求类型名称已存在')
        }
      }
      throw error
    }
  }

  /**
   * 删除资金需求类型
   */
  async delete(id: string) {
    // 先检查是否有关联的子项目
    const fundType = await prisma.fundType.findUnique({
      where: { id },
      include: {
        subProjects: true
      }
    })

    if (!fundType) {
      throw new ServiceError(404, '资金需求类型不存在')
    }

    // 检查是否有关联的子项目
    if (fundType.subProjects.length > 0) {
      throw new ServiceError(400, '该资金需求类型已关联项目，无法删除')
    }

    await prisma.fundType.delete({
      where: { id }
    })
  }

  /**
   * 查找单个资金需求类型
   */
  async findById(id: string) {
    const fundType = await prisma.fundType.findUnique({
      where: { id },
      include: {
        subProjects: {
          include: {
            project: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })

    if (!fundType) {
      throw new ServiceError(404, '资金需求类型不存在')
    }

    return fundType
  }

  /**
   * 查找所有资金需求类型
   */
  async findAll(
    { page, pageSize }: PaginationParams,
    { search, sorting }: QueryParams
  ): Promise<PaginatedResponse<any>> {
    const where: Prisma.FundTypeWhereInput = {
      ...(search
        ? {
            name: { contains: search }
          }
        : {})
    }

    const [total, items] = await Promise.all([
      prisma.fundType.count({ where }),
      prisma.fundType.findMany({
        where,
        include: {
          _count: {
            select: {
              subProjects: true
            }
          }
        },
        orderBy: sorting
          ? { [sorting.field]: sorting.order }
          : { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ])

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    }
  }

  /**
   * 获取所有资金需求类型（不分页）
   */
  async getAll() {
    return await prisma.fundType.findMany({
      orderBy: { name: 'asc' }
    })
  }
} 