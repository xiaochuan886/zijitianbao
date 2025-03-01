import { prisma } from '../prisma'
import { PaginationParams, PaginatedResponse, QueryParams, ServiceError } from './types'
import { RecordStatus } from '../enums'

export interface CreatePredictRecordDto {
  subProjectId: string
  fundTypeId: string
  year: number
  month: number
  amount?: number
  status?: RecordStatus
  remark?: string
  submittedBy: string
}

export interface UpdatePredictRecordDto {
  amount?: number
  status?: RecordStatus
  remark?: string
}

export class PredictRecordService {
  async create(data: CreatePredictRecordDto) {
    // 检查是否已存在记录
    const exists = await (prisma as any).predictRecord.findFirst({
      where: {
        subProjectId: data.subProjectId,
        fundTypeId: data.fundTypeId,
        year: data.year,
        month: data.month,
      },
    })

    if (exists) {
      throw new ServiceError(400, '该月份已存在记录')
    }

    return await (prisma as any).predictRecord.create({
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
        fundType: true,
      },
    })
  }

  async update(id: string, data: UpdatePredictRecordDto, userId: string) {
    const record = await (prisma as any).predictRecord.findUnique({
      where: { id },
    })

    if (!record) {
      throw new ServiceError(404, '记录不存在')
    }

    // 检查记录状态
    if (record.status === "APPROVED") {
      throw new ServiceError(400, '已审核的记录不能修改')
    }

    return await (prisma as any).predictRecord.update({
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
        fundType: true,
      },
    })
  }

  async delete(id: string) {
    const record = await (prisma as any).predictRecord.findUnique({
      where: { id },
    })

    if (!record) {
      throw new ServiceError(404, '记录不存在')
    }

    if (record.status === "APPROVED") {
      throw new ServiceError(400, '已审核的记录不能删除')
    }

    await (prisma as any).predictRecord.delete({
      where: { id },
    })
  }

  async findById(id: string) {
    const record = await (prisma as any).predictRecord.findUnique({
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
        fundType: true,
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
      ...(filters?.fundTypeId ? { fundTypeId: filters.fundTypeId } : {}),
      ...(filters?.year ? { year: parseInt(filters.year as string) } : {}),
      ...(filters?.month ? { month: parseInt(filters.month as string) } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.submittedBy ? { submittedBy: filters.submittedBy } : {}),
    };

    // 特殊处理 subProjectId，它可能是一个对象 { in: [...] }
    if (filters?.subProjectId) {
      where.subProjectId = filters.subProjectId;
    }

    const [total, items] = await Promise.all([
      (prisma as any).predictRecord.count({ where }),
      (prisma as any).predictRecord.findMany({
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
          fundType: true,
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
  async batchCreate(records: CreatePredictRecordDto[]) {
    return await prisma.$transaction(
      records.map((record) =>
        (prisma as any).predictRecord.create({
          data: {
            ...record,
            submittedAt: new Date(),
          },
        })
      )
    )
  }

  async batchUpdate(records: { id: string; data: UpdatePredictRecordDto }[], userId: string) {
    return await prisma.$transaction(
      records.map(({ id, data }) =>
        (prisma as any).predictRecord.update({
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
    const record = await (prisma as any).predictRecord.findUnique({
      where: { id },
    })

    if (!record) {
      throw new ServiceError(404, '记录不存在')
    }

    if (record.status === "APPROVED") {
      throw new ServiceError(400, '记录已审核')
    }

    return await (prisma as any).predictRecord.update({
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
        (prisma as any).predictRecord.update({
          where: { id },
          data: {
            status: action === 'approve' ? "APPROVED" : "REJECTED",
          },
        })
      )
    )
  }
} 