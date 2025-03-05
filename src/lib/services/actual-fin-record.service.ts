import { prisma } from '../prisma'
import { PaginationParams, PaginatedResponse, QueryParams, ServiceError } from './types'
import { RecordStatus } from '../enums'

export interface CreateActualFinRecordDto {
  detailedFundNeedId: string
  year: number
  month: number
  amount?: number
  status?: string
  remark?: string
  submittedBy: string
}

export interface UpdateActualFinRecordDto {
  amount?: number
  status?: string
  remark?: string
}

export class ActualFinRecordService {
  async create(data: CreateActualFinRecordDto) {
    // 检查是否已存在记录
    const exists = await prisma.actualFinRecord.findFirst({
      where: {
        detailedFundNeedId: data.detailedFundNeedId,
        year: data.year,
        month: data.month,
      },
    })

    if (exists) {
      throw new ServiceError(400, '该月份已存在记录')
    }

    return await prisma.actualFinRecord.create({
      data: {
        ...data,
        submittedAt: new Date(),
      },
      include: {
        detailedFundNeed: {
          include: {
            subProject: {
              include: {
                project: true,
              },
            },
            fundType: true,
            department: true,
          },
        },
      },
    })
  }

  async update(id: string, data: UpdateActualFinRecordDto, userId: string) {
    const record = await prisma.actualFinRecord.findUnique({
      where: { id },
    })

    if (!record) {
      throw new ServiceError(404, '记录不存在')
    }

    // 检查记录状态
    if (record.status === "APPROVED") {
      throw new ServiceError(400, '已审核的记录不能修改')
    }

    return await prisma.actualFinRecord.update({
      where: { id },
      data: {
        ...data,
        submittedBy: userId,
        submittedAt: new Date(),
      },
      include: {
        detailedFundNeed: {
          include: {
            subProject: {
              include: {
                project: true,
              },
            },
            fundType: true,
          },
        },
      },
    })
  }

  async delete(id: string) {
    const record = await prisma.actualFinRecord.findUnique({
      where: { id },
    })

    if (!record) {
      throw new ServiceError(404, '记录不存在')
    }

    if (record.status === "APPROVED") {
      throw new ServiceError(400, '已审核的记录不能删除')
    }

    await prisma.actualFinRecord.delete({
      where: { id },
    })
  }

  async findById(id: string) {
    const record = await prisma.actualFinRecord.findUnique({
      where: { id },
      include: {
        detailedFundNeed: {
          include: {
            subProject: {
              include: {
                project: {
                  include: {
                    category: true,
                  },
                },
              },
            },
            department: true,
            organization: true,
            fundType: true,
          },
        },
      },
    })

    if (!record) {
      throw new ServiceError(404, '记录不存在')
    }

    return record
  }

  async findAll(
    { page, pageSize }: PaginationParams,
    { filters, sorting }: QueryParams
  ): Promise<PaginatedResponse<any>> {
    const where: any = {
      ...(filters?.year ? { year: parseInt(filters.year as string) } : {}),
      ...(filters?.month ? { month: parseInt(filters.month as string) } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.submittedBy ? { submittedBy: filters.submittedBy } : {}),
    };

    // 嵌套查询条件
    if (filters?.fundTypeId || filters?.departmentId || filters?.organizationId) {
      where.detailedFundNeed = {
        ...(filters?.fundTypeId ? { fundTypeId: filters.fundTypeId } : {}),
        ...(filters?.departmentId ? { departmentId: filters.departmentId } : {}),
        ...(filters?.organizationId ? { organizationId: filters.organizationId } : {}),
      };
    }

    // 特殊处理 subProjectId
    if (filters?.subProjectId) {
      if (!where.detailedFundNeed) {
        where.detailedFundNeed = {};
      }
      where.detailedFundNeed.subProjectId = filters.subProjectId;
    }

    // 处理项目ID和分类ID
    if (filters?.projectId || filters?.categoryId) {
      if (!where.detailedFundNeed) {
        where.detailedFundNeed = {};
      }
      where.detailedFundNeed.subProject = {};
      
      if (filters?.projectId) {
        where.detailedFundNeed.subProject.projectId = filters.projectId;
      }
      
      if (filters?.categoryId) {
        where.detailedFundNeed.subProject.project = {
          categoryId: filters.categoryId
        };
      }
    }

    const [total, items] = await Promise.all([
      prisma.actualFinRecord.count({ where }),
      prisma.actualFinRecord.findMany({
        where,
        include: {
          detailedFundNeed: {
            include: {
              subProject: {
                include: {
                  project: {
                    include: {
                      category: true,
                    },
                  },
                },
              },
              department: true,
              organization: true,
              fundType: true,
            },
          },
        },
        orderBy: sorting
          ? { [sorting.field]: sorting.order }
          : [
              { year: 'desc' },
              { month: 'desc' },
              { createdAt: 'desc' },
            ],
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

  // 批量操作
  async batchCreate(records: CreateActualFinRecordDto[]) {
    return await prisma.$transaction(
      records.map((record) =>
        prisma.actualFinRecord.create({
          data: {
            ...record,
            submittedAt: new Date(),
          },
        })
      )
    )
  }

  async batchUpdate(records: { id: string; data: UpdateActualFinRecordDto }[], userId: string) {
    return await prisma.$transaction(
      records.map(({ id, data }) =>
        prisma.actualFinRecord.update({
          where: { id },
          data: {
            ...data,
            submittedBy: userId,
            submittedAt: new Date(),
          },
        })
      )
    )
  }

  // 审核相关
  async audit(id: string, { action, comment }: { action: 'approve' | 'reject'; comment?: string }) {
    const record = await prisma.actualFinRecord.findUnique({
      where: { id },
    })

    if (!record) {
      throw new ServiceError(404, '记录不存在')
    }

    if (record.status === "APPROVED") {
      throw new ServiceError(400, '记录已审核')
    }

    return await prisma.actualFinRecord.update({
      where: { id },
      data: {
        status: action === 'approve' ? "APPROVED" : "REJECTED",
        remark: comment ? (record.remark ? `${record.remark} | 审核意见: ${comment}` : `审核意见: ${comment}`) : record.remark,
      },
    })
  }

  async batchAudit(ids: string[], { action, comment }: { action: 'approve' | 'reject'; comment?: string }) {
    return await prisma.$transaction(
      ids.map((id) =>
        prisma.actualFinRecord.update({
          where: { id },
          data: {
            status: action === 'approve' ? "APPROVED" : "REJECTED",
            remark: comment ? `审核意见: ${comment}` : undefined,
          },
        })
      )
    )
  }
} 