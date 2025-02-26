import { prisma } from '../prisma'
import { ServiceError } from './types'

interface FundType {
  id: string
  name: string
  code: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

interface CreateFundTypeData {
  name: string
  code: string
  description?: string
}

interface UpdateFundTypeData {
  name?: string
  description?: string
}

interface QueryOptions {
  page: number
  pageSize: number
}

interface SortOptions {
  field: string
  order: 'asc' | 'desc'
}

interface FindAllOptions {
  search?: string
  sorting?: SortOptions
}

export const fundType = {
  async findAll(
    { page, pageSize }: QueryOptions,
    { search, sorting }: FindAllOptions = {}
  ) {
    const skip = (page - 1) * pageSize
    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { code: { contains: search } },
            { description: { contains: search } },
          ],
        }
      : {}

    const [total, items] = await Promise.all([
      prisma.fundType.count({ where }),
      prisma.fundType.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: sorting
          ? { [sorting.field]: sorting.order }
          : { createdAt: 'desc' },
      }),
    ])

    const totalPages = Math.ceil(total / pageSize)

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
    }
  },

  async findById(id: string): Promise<FundType> {
    const fundType = await prisma.fundType.findUnique({
      where: { id },
    })

    if (!fundType) {
      throw new ServiceError('资金需求类型不存在', 404)
    }

    return fundType
  },

  async create(data: CreateFundTypeData): Promise<FundType> {
    // 检查编码是否已存在
    const existing = await prisma.fundType.findUnique({
      where: { code: data.code },
    })

    if (existing) {
      throw new ServiceError('资金需求类型编码已存在', 400)
    }

    return prisma.fundType.create({
      data,
    })
  },

  async update(id: string, data: UpdateFundTypeData): Promise<FundType> {
    try {
      return await prisma.fundType.update({
        where: { id },
        data,
      })
    } catch (error) {
      if (error.code === 'P2025') {
        throw new ServiceError('资金需求类型不存在', 404)
      }
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await prisma.fundType.delete({
        where: { id },
      })
    } catch (error) {
      if (error.code === 'P2025') {
        throw new ServiceError('资金需求类型不存在', 404)
      }
      throw error
    }
  },
}