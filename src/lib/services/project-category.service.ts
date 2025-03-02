import { prisma } from '../prisma'
import { PaginationParams, PaginatedResponse, QueryParams, ServiceError } from './types'
import { Prisma } from '@prisma/client'

export interface CreateProjectCategoryDto {
  name: string
  code?: string
}

export interface UpdateProjectCategoryDto {
  name?: string
  code?: string
}

export class ProjectCategoryService {
  async create(data: CreateProjectCategoryDto) {
    try {
      // 验证必要字段
      if (!data.name) {
        throw new ServiceError(400, '项目分类名称是必填项')
      }

      const category = await prisma.projectCategory.create({
        data: {
          name: data.name,
          code: data.code
        }
      })
      
      return category
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ServiceError(400, '项目分类名称已存在')
        }
      }
      throw error
    }
  }

  async update(id: string, data: UpdateProjectCategoryDto) {
    try {
      // 检查项目分类是否存在
      const existingCategory = await prisma.projectCategory.findUnique({
        where: { id }
      })

      if (!existingCategory) {
        throw new ServiceError(404, '项目分类不存在')
      }

      const category = await prisma.projectCategory.update({
        where: { id },
        data: {
          name: data.name,
          code: data.code
        }
      })
      
      return category
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ServiceError(400, '项目分类名称已存在')
        }
      }
      throw error
    }
  }

  async delete(id: string) {
    try {
      const category = await prisma.projectCategory.findUnique({
        where: { id },
        include: {
          projects: true
        }
      })

      if (!category) {
        throw new ServiceError(404, '项目分类不存在')
      }

      if (category.projects.length > 0) {
        throw new ServiceError(400, '该分类下存在项目，无法删除')
      }

      await prisma.projectCategory.delete({
        where: { id }
      })

      return { success: true }
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error
      }
      throw new ServiceError(500, '删除项目分类失败')
    }
  }

  async findById(id: string) {
    const category = await prisma.projectCategory.findUnique({
      where: { id },
      include: {
        projects: true
      }
    })

    if (!category) {
      throw new ServiceError(404, '项目分类不存在')
    }
    
    return category
  }

  async findAll(
    { page, pageSize }: PaginationParams,
    { search, sorting }: QueryParams
  ): Promise<PaginatedResponse<any>> {
    const where: any = search
      ? {
          OR: [
            { name: { contains: search } },
            { code: { contains: search } }
          ]
        }
      : {}
    
    const [total, items] = await Promise.all([
      prisma.projectCategory.count({ where }),
      prisma.projectCategory.findMany({
        where,
        include: {
          projects: true
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
} 