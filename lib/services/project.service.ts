import { prisma } from '../prisma'
import { PaginationParams, PaginatedResponse, QueryParams, ServiceError } from './types'
import { Prisma } from '@prisma/client'

export interface CreateProjectDto {
  name: string
  status: string
  startYear: number
  organizationIds: string[]
  departmentIds: string[]
  subProjects: {
    name: string
    fundTypeIds: string[]
  }[]
}

export interface UpdateProjectDto {
  name?: string
  status?: string
  startYear?: number
  organizationIds?: string[]
  departmentIds?: string[]
  subProjects?: {
    id?: string
    name: string
    fundTypeIds: string[]
  }[]
}

export class ProjectService {
  async create(data: CreateProjectDto) {
    return await prisma.project.create({
      data: {
        name: data.name,
        status: data.status,
        startYear: data.startYear,
        organizations: {
          connect: data.organizationIds.map((id) => ({ id })),
        },
        departments: {
          connect: data.departmentIds.map((id) => ({ id })),
        },
        subProjects: {
          create: data.subProjects.map((sub) => ({
            name: sub.name,
            fundTypes: {
              connect: sub.fundTypeIds.map((id) => ({ id })),
            },
          })),
        },
      },
      include: {
        organizations: true,
        departments: true,
        subProjects: {
          include: {
            fundTypes: true,
          },
        },
      },
    })
  }

  async update(id: string, data: UpdateProjectDto) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        subProjects: true,
      },
    })

    if (!project) {
      throw new ServiceError(404, '项目不存在')
    }

    return await prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        status: data.status,
        startYear: data.startYear,
        organizations: data.organizationIds
          ? {
              set: data.organizationIds.map((id) => ({ id })),
            }
          : undefined,
        departments: data.departmentIds
          ? {
              set: data.departmentIds.map((id) => ({ id })),
            }
          : undefined,
        subProjects: data.subProjects
          ? {
              upsert: data.subProjects.map((sub) => ({
                where: { id: sub.id || 'new' },
                create: {
                  name: sub.name,
                  fundTypes: {
                    connect: sub.fundTypeIds.map((id) => ({ id })),
                  },
                },
                update: {
                  name: sub.name,
                  fundTypes: {
                    set: sub.fundTypeIds.map((id) => ({ id })),
                  },
                },
              })),
            }
          : undefined,
      },
      include: {
        organizations: true,
        departments: true,
        subProjects: {
          include: {
            fundTypes: true,
          },
        },
      },
    })
  }

  async delete(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        subProjects: {
          include: {
            records: true,
          },
        },
      },
    })

    if (!project) {
      throw new ServiceError(404, '项目不存在')
    }

    // 检查是否有资金记录
    const hasRecords = project.subProjects.some((sub) => sub.records.length > 0)
    if (hasRecords) {
      throw new ServiceError(400, '项目下存在资金记录，无法删除')
    }

    await prisma.project.delete({
      where: { id },
    })
  }

  async findById(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        organizations: true,
        departments: true,
        subProjects: {
          include: {
            fundTypes: true,
            records: {
              orderBy: [
                { year: 'desc' },
                { month: 'desc' },
              ],
            },
          },
        },
      },
    })

    if (!project) {
      throw new ServiceError(404, '项目不存在')
    }

    return project
  }

  async findAll(
    { page, pageSize }: PaginationParams,
    { search, filters, sorting }: QueryParams
  ): Promise<PaginatedResponse<any>> {
    const where: Prisma.ProjectWhereInput = {
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { organizations: { some: { name: { contains: search } } } },
              { departments: { some: { name: { contains: search } } } },
            ],
          }
        : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.organizationId
        ? { organizations: { some: { id: filters.organizationId as string } } }
        : {}),
      ...(filters?.departmentId
        ? { departments: { some: { id: filters.departmentId as string } } }
        : {}),
    }

    const [total, items] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        include: {
          organizations: true,
          departments: true,
          subProjects: {
            include: {
              fundTypes: true,
              _count: {
                select: {
                  records: true,
                },
              },
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

  // 子项目相关方法
  async addSubProject(projectId: string, data: {
    name: string
    fundTypeIds: string[]
  }) {
    return await prisma.subProject.create({
      data: {
        name: data.name,
        project: {
          connect: { id: projectId },
        },
        fundTypes: {
          connect: data.fundTypeIds.map((id) => ({ id })),
        },
      },
      include: {
        fundTypes: true,
      },
    })
  }

  async updateSubProject(id: string, data: {
    name: string
    fundTypeIds: string[]
  }) {
    return await prisma.subProject.update({
      where: { id },
      data: {
        name: data.name,
        fundTypes: {
          set: data.fundTypeIds.map((id) => ({ id })),
        },
      },
      include: {
        fundTypes: true,
      },
    })
  }

  async deleteSubProject(id: string) {
    const subProject = await prisma.subProject.findUnique({
      where: { id },
      include: {
        records: true,
      },
    })

    if (!subProject) {
      throw new ServiceError(404, '子项目不存在')
    }

    if (subProject.records.length > 0) {
      throw new ServiceError(400, '子项目下存在资金记录，无法删除')
    }

    await prisma.subProject.delete({
      where: { id },
    })
  }
} 