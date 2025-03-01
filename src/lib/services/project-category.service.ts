import { prisma } from '../prisma'
import { PaginationParams, PaginatedResponse, QueryParams, ServiceError } from './types'
import { Prisma } from '@prisma/client'

export interface CreateProjectCategoryDto {
  name: string
  code?: string
  organizationId: string
}

export interface UpdateProjectCategoryDto {
  name?: string
  code?: string
  organizationId?: string
}

export class ProjectCategoryService {
  async create(data: CreateProjectCategoryDto) {
    try {
      // 验证必要字段
      if (!data.name) throw new ServiceError(400, '分类名称不能为空')
      if (!data.organizationId) throw new ServiceError(400, '所属机构不能为空')
      
      // 检查同一机构下是否已存在同名分类
      const existingCategory = await prisma.projectCategory.findFirst({
        where: {
          name: data.name,
          organizationId: data.organizationId
        }
      })
      
      if (existingCategory) {
        throw new ServiceError(400, '同一机构下已存在同名分类')
      }
      
      return await prisma.projectCategory.create({
        data: {
          name: data.name,
          code: data.code,
          organization: {
            connect: { id: data.organizationId }
          }
        },
        include: {
          organization: true
        }
      })
    } catch (error: any) {
      // 处理Prisma错误
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ServiceError(400, '分类编码已存在')
        }
        if (error.code === 'P2025') {
          throw new ServiceError(400, '所属机构不存在')
        }
      }
      
      // 如果已经是ServiceError，直接抛出
      if (error instanceof ServiceError) {
        throw error
      }
      
      // 其他错误
      throw new ServiceError(500, error.message || '创建项目分类失败')
    }
  }

  async update(id: string, data: UpdateProjectCategoryDto) {
    try {
      const category = await prisma.projectCategory.findUnique({
        where: { id }
      })
      
      if (!category) {
        throw new ServiceError(404, '项目分类不存在')
      }
      
      // 如果更改了名称和机构，检查是否会与现有分类冲突
      if (data.name && data.organizationId) {
        const existingCategory = await prisma.projectCategory.findFirst({
          where: {
            name: data.name,
            organizationId: data.organizationId,
            id: { not: id }
          }
        })
        
        if (existingCategory) {
          throw new ServiceError(400, '同一机构下已存在同名分类')
        }
      }
      
      return await prisma.projectCategory.update({
        where: { id },
        data: {
          name: data.name,
          code: data.code,
          organization: data.organizationId
            ? { connect: { id: data.organizationId } }
            : undefined
        },
        include: {
          organization: true
        }
      })
    } catch (error: any) {
      // 处理Prisma错误
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ServiceError(400, '分类编码已存在')
        }
        if (error.code === 'P2025') {
          throw new ServiceError(400, '所属机构不存在')
        }
      }
      
      // 如果已经是ServiceError，直接抛出
      if (error instanceof ServiceError) {
        throw error
      }
      
      // 其他错误
      throw new ServiceError(500, error.message || '更新项目分类失败')
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
      
      // 检查是否有关联的项目
      if (category.projects.length > 0) {
        throw new ServiceError(400, '该分类下存在项目，无法删除')
      }
      
      await prisma.projectCategory.delete({
        where: { id }
      })
    } catch (error: any) {
      // 如果已经是ServiceError，直接抛出
      if (error instanceof ServiceError) {
        throw error
      }
      
      // 其他错误
      throw new ServiceError(500, error.message || '删除项目分类失败')
    }
  }

  async findById(id: string) {
    const category = await prisma.projectCategory.findUnique({
      where: { id },
      include: {
        organization: true
      }
    })
    
    if (!category) {
      throw new ServiceError(404, '项目分类不存在')
    }
    
    return category
  }

  async findAll(
    { page, pageSize }: PaginationParams,
    { search, filters, sorting }: QueryParams
  ): Promise<PaginatedResponse<any>> {
    const where: any = {
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { code: { contains: search } },
              { organization: { name: { contains: search } } }
            ]
          }
        : {}),
      ...(filters?.organizationId
        ? { organizationId: filters.organizationId as string }
        : {})
    }
    
    const [total, items] = await Promise.all([
      prisma.projectCategory.count({ where }),
      prisma.projectCategory.findMany({
        where,
        include: {
          organization: true
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