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
    console.log('FundTypeService.findAll 被调用，参数:', { page, pageSize, search, sorting });
    
    // 确保sorting参数存在且有效
    const orderBy: Prisma.FundTypeOrderByWithRelationInput = sorting && sorting.field
      ? { [sorting.field]: (sorting.order || 'desc') as Prisma.SortOrder }
      : { createdAt: 'desc' as Prisma.SortOrder };
    
    console.log('使用的排序条件:', orderBy);
    
    const where: Prisma.FundTypeWhereInput = {
      ...(search
        ? {
            name: { contains: search }
          }
        : {})
    }
    
    console.log('使用的查询条件:', where);

    try {
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
          orderBy,
          skip: (page - 1) * pageSize,
          take: pageSize
        })
      ]);
      
      console.log(`查询到 ${items.length} 条资金需求类型记录，总计 ${total} 条`);
      
      const result = {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      };
      
      console.log('返回的分页数据:', result);
      return result;
    } catch (error) {
      console.error('查询资金需求类型失败:', error);
      throw error;
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