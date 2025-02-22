import { prisma } from '../prisma'
import { PaginationParams, PaginatedResponse, QueryParams, ServiceError } from './types'

export interface CreateRecordDto {
  subProjectId: string
  year: number
  month: number
  predicted?: number
  actualUser?: number
  actualFinance?: number
  auditResult?: number
  status: string
  submittedBy: string
}

export interface UpdateRecordDto {
  predicted?: number
  actualUser?: number
  actualFinance?: number
  auditResult?: number
  status?: string
}

export class RecordService {
  async create(data: CreateRecordDto) {
    // 检查是否已存在记录
    const exists = await prisma.record.findUnique({
      where: {
        subProjectId_year_month: {
          subProjectId: data.subProjectId,
          year: data.year,
          month: data.month,
        },
      },
    })

    if (exists) {
      throw new ServiceError(400, '该月份已存在记录')
    }

    return await prisma.record.create({
      data: {
        ...data,
        submittedAt: new Date(),
      },
      include: {
        subProject: {
          include: {
            project: true,
            fundTypes: true,
          },
        },
      },
    })
  }

  async update(id: string, data: UpdateRecordDto, userId: string) {
    const record = await prisma.record.findUnique({
      where: { id },
    })

    if (!record) {
      throw new ServiceError(404, '记录不存在')
    }

    // 检查记录状态
    if (record.status === 'approved') {
      throw new ServiceError(400, '已审核的记录不能修改')
    }

    return await prisma.record.update({
      where: { id },
      data: {
        ...data,
        submittedBy: userId,
        submittedAt: new Date(),
      },
      include: {
        subProject: {
          include: {
            project: true,
            fundTypes: true,
          },
        },
      },
    })
  }

  async delete(id: string) {
    const record = await prisma.record.findUnique({
      where: { id },
    })

    if (!record) {
      throw new ServiceError(404, '记录不存在')
    }

    if (record.status === 'approved') {
      throw new ServiceError(400, '已审核的记录不能删除')
    }

    await prisma.record.delete({
      where: { id },
    })
  }

  async findById(id: string) {
    const record = await prisma.record.findUnique({
      where: { id },
      include: {
        subProject: {
          include: {
            project: {
              include: {
                organizations: true,
                departments: true,
              },
            },
            fundTypes: true,
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
    const where = {
      ...(filters?.subProjectId ? { subProjectId: filters.subProjectId } : {}),
      ...(filters?.year ? { year: filters.year } : {}),
      ...(filters?.month ? { month: filters.month } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.submittedBy ? { submittedBy: filters.submittedBy } : {}),
    }

    const [total, items] = await Promise.all([
      prisma.record.count({ where }),
      prisma.record.findMany({
        where,
        include: {
          subProject: {
            include: {
              project: {
                include: {
                  organizations: true,
                  departments: true,
                },
              },
              fundTypes: true,
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
  async batchCreate(records: CreateRecordDto[]) {
    return await prisma.$transaction(
      records.map((record) =>
        prisma.record.create({
          data: {
            ...record,
            submittedAt: new Date(),
          },
        })
      )
    )
  }

  async batchUpdate(records: { id: string; data: UpdateRecordDto }[], userId: string) {
    return await prisma.$transaction(
      records.map(({ id, data }) =>
        prisma.record.update({
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
    const record = await prisma.record.findUnique({
      where: { id },
    })

    if (!record) {
      throw new ServiceError(404, '记录不存在')
    }

    if (record.status === 'approved') {
      throw new ServiceError(400, '记录已审核')
    }

    return await prisma.record.update({
      where: { id },
      data: {
        status: action === 'approve' ? 'approved' : 'rejected',
        auditResult: action === 'approve' ? record.actualFinance : null,
      },
    })
  }

  async batchAudit(ids: string[], { action, comment }: { action: 'approve' | 'reject'; comment?: string }) {
    return await prisma.$transaction(
      ids.map((id) =>
        prisma.record.update({
          where: { id },
          data: {
            status: action === 'approve' ? 'approved' : 'rejected',
          },
        })
      )
    )
  }
} 