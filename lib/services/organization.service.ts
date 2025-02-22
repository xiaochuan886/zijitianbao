import { prisma } from '../prisma'
import { PaginationParams, PaginatedResponse, QueryParams, ServiceError } from './types'
import { Organization, Department } from '@prisma/client'

export interface CreateOrganizationDto {
  name: string
  code: string
  departments: {
    name: string
  }[]
}

export interface UpdateOrganizationDto {
  name?: string
  code?: string
  departments?: {
    id?: string
    name: string
  }[]
}

export class OrganizationService {
  async create(data: CreateOrganizationDto) {
    const exists = await prisma.organization.findUnique({
      where: { code: data.code },
    })

    if (exists) {
      throw new ServiceError(400, '机构编码已存在')
    }

    return await prisma.organization.create({
      data: {
        name: data.name,
        code: data.code,
        departments: {
          create: data.departments,
        },
      },
      include: {
        departments: true,
      },
    })
  }

  async update(id: string, data: UpdateOrganizationDto) {
    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        departments: true,
      },
    })

    if (!org) {
      throw new ServiceError(404, '机构不存在')
    }

    if (data.code && data.code !== org.code) {
      const exists = await prisma.organization.findUnique({
        where: { code: data.code },
      })
      if (exists) {
        throw new ServiceError(400, '机构编码已存在')
      }
    }

    return await prisma.organization.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        departments: data.departments
          ? {
              upsert: data.departments.map((dept) => ({
                where: { id: dept.id || 'new' },
                create: { name: dept.name },
                update: { name: dept.name },
              })),
            }
          : undefined,
      },
      include: {
        departments: true,
      },
    })
  }

  async delete(id: string) {
    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        users: true,
        projects: true,
      },
    })

    if (!org) {
      throw new ServiceError(404, '机构不存在')
    }

    if (org.users.length > 0) {
      throw new ServiceError(400, '机构下还有用户，无法删除')
    }

    if (org.projects.length > 0) {
      throw new ServiceError(400, '机构下还有项目，无法删除')
    }

    await prisma.organization.delete({
      where: { id },
    })
  }

  async findById(id: string) {
    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        departments: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    })

    if (!org) {
      throw new ServiceError(404, '机构不存在')
    }

    return org
  }

  async findAll(
    { page, pageSize }: PaginationParams,
    { search, sorting }: QueryParams
  ): Promise<PaginatedResponse<Organization>> {
    const where = search
      ? {
          OR: [
            { name: { contains: search } },
            { code: { contains: search } },
          ],
        }
      : {}

    const [total, items] = await Promise.all([
      prisma.organization.count({ where }),
      prisma.organization.findMany({
        where,
        include: {
          departments: true,
          _count: {
            select: {
              users: true,
              projects: true,
            },
          },
        },
        orderBy: sorting
          ? { [sorting.field]: sorting.order }
          : { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  }

  // 部门相关方法
  async addDepartment(organizationId: string, name: string): Promise<Department> {
    return await prisma.department.create({
      data: {
        name,
        organization: {
          connect: { id: organizationId },
        },
      },
    })
  }

  async updateDepartment(id: string, name: string): Promise<Department> {
    return await prisma.department.update({
      where: { id },
      data: { name },
    })
  }

  async deleteDepartment(id: string) {
    const dept = await prisma.department.findUnique({
      where: { id },
      include: {
        projects: true,
      },
    })

    if (!dept) {
      throw new ServiceError(404, '部门不存在')
    }

    if (dept.projects.length > 0) {
      throw new ServiceError(400, '部门下还有项目，无法删除')
    }

    await prisma.department.delete({
      where: { id },
    })
  }
} 