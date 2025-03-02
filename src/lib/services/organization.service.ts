import { prisma } from '../prisma'
import { PaginationParams, PaginatedResponse, QueryParams, ServiceError } from './types'
import { Organization, Department } from '@prisma/client'
import { Prisma } from "@prisma/client"

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
    try {
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
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error
      }
      throw new ServiceError(500, '创建机构失败', error)
    }
  }

  async update(id: string, data: UpdateOrganizationDto) {
    try {
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
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error
      }
      throw new ServiceError(500, '更新机构失败', error)
    }
  }

  async delete(id: string) {
    try {
      const org = await prisma.organization.findUnique({
        where: { id },
        include: {
          users: true,
          departments: true,
          detailedFundNeeds: true
        },
      })

      if (!org) {
        throw new ServiceError(404, '机构不存在')
      }

      if (org.users.length > 0) {
        throw new ServiceError(400, '机构下还有用户，无法删除')
      }

      // 先删除关联的detailedFundNeeds记录
      if (org.detailedFundNeeds.length > 0) {
        await prisma.detailedFundNeed.deleteMany({
          where: { organizationId: id }
        });
        console.log(`已删除 ${org.detailedFundNeeds.length} 条资金需求记录`);
      }

      // 删除部门
      if (org.departments.length > 0) {
        await prisma.department.deleteMany({
          where: { organizationId: id }
        });
        console.log(`已删除 ${org.departments.length} 个部门`);
      }

      // 最后删除组织
      await prisma.organization.delete({
        where: { id },
      })
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error
      }
      throw new ServiceError(500, '删除机构失败', error)
    }
  }

  async findById(id: string) {
    try {
      // 获取组织基本信息，包括部门和用户
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
          detailedFundNeeds: {
            include: {
              subProject: {
                include: {
                  project: {
                    select: {
                      id: true,
                      name: true,
                      status: true,
                    }
                  }
                }
              }
            }
          }
        },
      });

      if (!org) {
        throw new ServiceError(404, '机构不存在');
      }

      // 处理项目数据，去重
      const projectsMap = new Map();
      org.detailedFundNeeds.forEach(fundNeed => {
        if (fundNeed.subProject?.project) {
          const project = fundNeed.subProject.project;
          projectsMap.set(project.id, {
            id: project.id,
            name: project.name,
            status: project.status
          });
        }
      });
      
      // 构造返回结果
      return {
        ...org,
        projects: Array.from(projectsMap.values())
      };
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError(500, '获取机构详情失败', error);
    }
  }

  async findAll(pagination: { page: number; pageSize: number }, filters?: { search?: string }) {
    const skip = (pagination.page - 1) * pagination.pageSize;
    const where: Prisma.OrganizationWhereInput = {};

    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { code: { contains: filters.search } },
      ];
    }

    const total = await prisma.organization.count({ where });

    // 获取组织列表，包括部门和用户
    const organizations = await prisma.organization.findMany({
      where,
      skip,
      take: pagination.pageSize,
      include: {
        departments: {
          select: {
            id: true,
            name: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
          },
        },
        detailedFundNeeds: {
          include: {
            subProject: {
              include: {
                project: {
                  select: {
                    id: true,
                    name: true,
                    status: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 处理项目数据
    const items = organizations.map(org => {
      // 提取项目并去重
      const projectsMap = new Map();
      org.detailedFundNeeds.forEach(fundNeed => {
        if (fundNeed.subProject?.project) {
          const project = fundNeed.subProject.project;
          projectsMap.set(project.id, {
            id: project.id,
            name: project.name,
            status: project.status || "ACTIVE"
          });
        }
      });

      return {
        ...org,
        projects: Array.from(projectsMap.values())
      };
    });

    return {
      items,
      total,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil(total / pagination.pageSize),
    };
  }

  // 部门相关方法
  async addDepartment(organizationId: string, name: string): Promise<Department> {
    try {
      return await prisma.department.create({
        data: {
          name,
          organization: {
            connect: { id: organizationId },
          },
        },
      })
    } catch (error) {
      throw new ServiceError(500, '创建部门失败', error)
    }
  }

  async updateDepartment(id: string, name: string): Promise<Department> {
    try {
      return await prisma.department.update({
        where: { id },
        data: { name },
      })
    } catch (error) {
      throw new ServiceError(500, '更新部门失败', error)
    }
  }

  async deleteDepartment(id: string) {
    try {
      const dept = await prisma.department.findUnique({
        where: { id },
        include: {
          detailedFundNeeds: true,
        },
      });

      if (!dept) {
        throw new ServiceError(404, '部门不存在');
      }

      if (dept.detailedFundNeeds.length > 0) {
        throw new ServiceError(400, '部门下还有资金需求记录，无法删除');
      }

      await prisma.department.delete({
        where: { id },
      });
    } catch (error) {
      if (error instanceof ServiceError) {
        throw error;
      }
      throw new ServiceError(500, '删除部门失败', error);
    }
  }

  /**
   * 检查用户是否有权限访问指定的组织
   * @param userId 用户ID
   * @param organizationId 组织ID
   * @returns 布尔值，表示用户是否有权限访问
   */
  async checkUserAccess(userId: string, organizationId: string): Promise<boolean> {
    try {
      // 检查用户是否与该组织有关联
      const userOrg = await prisma.userOrganization.findFirst({
        where: {
          userId: userId,
          organizationId: organizationId,
        }
      });
      
      // 如果找到关联记录，则用户有权限访问
      return !!userOrg;
    } catch (error) {
      console.error('检查用户组织权限失败:', error);
      return false;
    }
  }
} 