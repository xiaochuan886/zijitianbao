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
  status?: ProjectStatus
  startYear: number
  categoryId?: string // 项目分类ID
  subProjects: {
    name: string
    detailedFundNeeds: {
      departmentId: string
      fundTypeId: string
      organizationId: string // 添加organizationId字段
    }[]
  }[]
}

export interface UpdateProjectDto {
  name?: string
  code?: string
  status?: ProjectStatus
  startYear?: number
  categoryId?: string
  subProjects?: {
    id?: string
    name: string
    detailedFundNeeds: {
      departmentId: string
      fundTypeId: string
      organizationId: string // 添加organizationId字段
    }[]
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
      if (!data.subProjects || data.subProjects.length === 0) {
        throw new ServiceError(400, '至少添加一个子项目');
      }
      
      // 检查每个子项目
      for (const sub of data.subProjects) {
        if (!sub.name) throw new ServiceError(400, '子项目名称不能为空');
        if (!sub.detailedFundNeeds || sub.detailedFundNeeds.length === 0) {
          throw new ServiceError(400, '子项目至少选择一个资金需求类型');
        }
        // 验证每个detailedFundNeed都有organizationId
        for (const dfn of sub.detailedFundNeeds) {
          if (!dfn.organizationId) {
            throw new ServiceError(400, '必须为每个资金需求指定一个机构');
          }
        }
      }
      
      // 创建项目和子项目
      const result = await prisma.project.create({
        data: {
          name: data.name,
          code: data.code,
          status: data.status as string || 'ACTIVE',
          startYear: data.startYear,
          categoryId: data.categoryId || null,
          subProjects: {
            create: data.subProjects.map((sub) => ({
              name: sub.name,
            })),
          },
        },
        include: {
          category: true,
          subProjects: true,
        },
      });
      
      // 创建DetailedFundNeed关联
      for (const sub of data.subProjects) {
        const subProject = result.subProjects.find(s => s.name === sub.name);
        if (subProject) {
          for (const dfn of sub.detailedFundNeeds) {
            await prisma.detailedFundNeed.create({
              data: {
                subProjectId: subProject.id,
                departmentId: dfn.departmentId,
                fundTypeId: dfn.fundTypeId,
                organizationId: dfn.organizationId,
              }
            });
          }
        }
      }
      
      // 获取完整的项目信息（包括新创建的关联）
      const completeProject = await this.findById(result.id);
      
      console.log('项目创建成功:', completeProject);
      return completeProject;
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

    // 更新项目基本信息
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        status: data.status,
        startYear: data.startYear,
        categoryId: data.categoryId,
      },
      include: {
        category: true,
        subProjects: true,
      },
    });

    // 如果有更新子项目
    if (data.subProjects && data.subProjects.length > 0) {
      // 处理每个子项目
      for (const sub of data.subProjects) {
        if (sub.id) {
          // 更新现有子项目
          await prisma.subProject.update({
            where: { id: sub.id },
            data: { name: sub.name },
          });
          
          // 先删除现有关联
          await prisma.detailedFundNeed.deleteMany({
            where: { subProjectId: sub.id },
          });
          
          // 创建新的关联
          for (const dfn of sub.detailedFundNeeds) {
            await prisma.detailedFundNeed.create({
              data: {
                subProjectId: sub.id,
                departmentId: dfn.departmentId,
                fundTypeId: dfn.fundTypeId,
                organizationId: dfn.organizationId,
              }
            });
          }
        } else {
          // 创建新子项目
          const newSub = await prisma.subProject.create({
            data: {
              name: sub.name,
              projectId: id,
            },
          });
          
          // 创建关联
          for (const dfn of sub.detailedFundNeeds) {
            await prisma.detailedFundNeed.create({
              data: {
                subProjectId: newSub.id,
                departmentId: dfn.departmentId,
                fundTypeId: dfn.fundTypeId,
                organizationId: dfn.organizationId,
              }
            });
          }
        }
      }
    }
    
    // 返回完整更新后的项目
    return await this.findById(id);
  }

  async delete(id: string) {
    // 检查项目是否存在
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        subProjects: {
          include: {
            detailedFundNeeds: {
              include: {
                predictRecords: true,
                actualUserRecords: true,
                actualFinRecords: true,
                auditRecords: true,
              }
            }
          }
        }
      },
    });

    if (!project) {
      throw new ServiceError(404, '项目不存在');
    }

    // 检查是否有资金记录
    const hasRecords = project.subProjects.some(sub => 
      sub.detailedFundNeeds.some(dfn => 
        dfn.predictRecords.length > 0 || 
        dfn.actualUserRecords.length > 0 || 
        dfn.actualFinRecords.length > 0 || 
        dfn.auditRecords.length > 0
      )
    );
    
    if (hasRecords) {
      throw new ServiceError(400, '项目下存在资金记录，无法删除');
    }

    // 删除所有关联的DetailedFundNeed
    for (const sub of project.subProjects) {
      await prisma.detailedFundNeed.deleteMany({
        where: { subProjectId: sub.id }
      });
    }

    // 删除所有子项目
    await prisma.subProject.deleteMany({
      where: { projectId: id }
    });

    // 删除项目
    await prisma.project.delete({
      where: { id }
    });
  }

  async findById(id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        category: true,
        subProjects: {
          include: {
            detailedFundNeeds: {
              include: {
                department: true,
                fundType: true,
              }
            }
          }
        }
      },
    });

    if (!project) {
      throw new ServiceError(404, '项目不存在');
    }

    return project;
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
      ...(filters?.categoryId ? { categoryId: filters.categoryId } : {}),
    };

    // 获取总记录数
    const total = await prisma.project.count({ where });

    // 构建排序
    const orderBy: any = {};
    if (sorting?.field) {
      orderBy[sorting.field] = sorting.order || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    // 查询数据并分页
    const items = await prisma.project.findMany({
      where,
      orderBy,
      skip: page ? (page - 1) * pageSize : 0,
      take: pageSize,
      include: {
        category: true,
        subProjects: {
          include: {
            detailedFundNeeds: {
              include: {
                department: true,
                fundType: true,
              }
            }
          }
        }
      },
    });

    // 返回分页结果
    return {
      items,
      total,
      page: page || 1,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
} 