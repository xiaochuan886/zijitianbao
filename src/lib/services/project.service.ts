import { prisma } from '../prisma'
import { PaginationParams, PaginatedResponse, QueryParams, ServiceError } from './types'
import { Prisma } from '@prisma/client'

// 定义ProjectStatus枚举，与schema.prisma中的定义保持一致
enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED'
}

export interface CreateProjectDto {
  name: string
  code: string
  status: ProjectStatus
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
  code?: string
  status?: ProjectStatus
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
    console.log('ProjectService.create 接收到的数据:', data);
    
    try {
      // 验证必要字段
      if (!data.name) throw new ServiceError(400, '项目名称不能为空');
      if (!data.code) throw new ServiceError(400, '项目编码不能为空');
      if (!data.startYear) throw new ServiceError(400, '开始年份不能为空');
      if (!data.organizationIds || data.organizationIds.length === 0) {
        throw new ServiceError(400, '至少选择一个机构');
      }
      if (!data.departmentIds || data.departmentIds.length === 0) {
        throw new ServiceError(400, '至少选择一个部门');
      }
      if (!data.subProjects || data.subProjects.length === 0) {
        throw new ServiceError(400, '至少添加一个子项目');
      }
      
      // 检查每个子项目
      for (const sub of data.subProjects) {
        if (!sub.name) throw new ServiceError(400, '子项目名称不能为空');
        if (!sub.fundTypeIds || sub.fundTypeIds.length === 0) {
          throw new ServiceError(400, '子项目至少选择一个资金需求类型');
        }
      }
      
      // 根据Prisma模型定义，项目必须有一个主要所属机构
      const organizationId = data.organizationIds[0];
      
      const result = await prisma.project.create({
        data: {
          name: data.name,
          code: data.code,
          status: data.status,
          startYear: data.startYear,
          organizationId: organizationId, // 主要所属机构
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
      });
      
      console.log('项目创建成功:', result);
      return result;
    } catch (error: any) {
      console.error('项目创建失败:', error);
      
      // 处理Prisma错误
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ServiceError(400, '项目编码已存在');
        }
        if (error.code === 'P2025') {
          throw new ServiceError(400, '关联的机构、部门或资金需求类型不存在');
        }
      }
      
      // 如果已经是ServiceError，直接抛出
      if (error instanceof ServiceError) {
        throw error;
      }
      
      // 其他错误
      throw new ServiceError(500, error.message || '创建项目失败');
    }
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
        code: data.code,
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
    // 构建查询条件
    const where: Prisma.ProjectWhereInput = {
      ...(search
        ? {
            OR: [
              { name: { contains: search } },
              { code: { contains: search } },
            ],
          }
        : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.organizationId
        ? { organizationId: filters.organizationId as string }
        : {}),
      ...(filters?.categoryId
        ? { categoryId: filters.categoryId as string }
        : {}),
    }

    const [total, items] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        include: {
          organization: true,
          category: true,
          subProjects: {
            include: {
              detailedFundNeeds: {
                include: {
                  fundType: true,
                  department: true
                }
              }
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
    // 首先检查子项目是否存在
    const subProject = await prisma.subProject.findUnique({
      where: { id },
    })

    if (!subProject) {
      throw new ServiceError(404, '子项目不存在')
    }

    try {
      // 尝试删除子项目
      await prisma.subProject.delete({
        where: { id },
      })
    } catch (error: any) {
      // 如果删除失败，可能是因为存在外键约束
      console.error('删除子项目失败:', error)
      throw new ServiceError(400, '子项目下可能存在资金记录，无法删除')
    }
  }
} 