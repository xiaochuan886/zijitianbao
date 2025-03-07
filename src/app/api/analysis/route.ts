import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { RecordStatus } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    // 获取资金需求预测数据（PredictRecord）
    const predictRecords = await prisma.predictRecord.findMany({
      where: {
        status: RecordStatus.SUBMITTED,
      },
      include: {
        detailedFundNeed: {
          include: {
            organization: true,
            department: true,
            subProject: {
              include: {
                project: {
                  include: {
                    category: true,
                  },
                },
              },
            },
            fundType: true,
          },
        },
      },
    })

    // 获取实际支付数据（AuditRecord）
    const auditRecords = await prisma.auditRecord.findMany({
      where: {
        status: RecordStatus.SUBMITTED,
      },
      include: {
        detailedFundNeed: {
          include: {
            organization: true,
            department: true,
            subProject: {
              include: {
                project: {
                  include: {
                    category: true,
                  },
                },
              },
            },
            fundType: true,
          },
        },
      },
    })

    // 构建分析数据
    const analysisData = []
    
    // 创建一个Map来跟踪已处理的记录，避免重复
    const processedRecords = new Map()

    // 处理资金需求预测数据
    for (const record of predictRecords) {
      const {
        detailedFundNeed,
        year,
        month,
        amount,
        submittedAt,
      } = record

      // 记录唯一标识
      const recordKey = `${detailedFundNeed.id}-${year}-${month}`

      // 获取对应的审计记录（同一detailedFundNeedId、年、月）
      const matchingAuditRecord = auditRecords.find(
        (audit) =>
          audit.detailedFundNeedId === detailedFundNeed.id &&
          audit.year === year &&
          audit.month === month
      )

      // 计算执行率
      const actualAmount = matchingAuditRecord?.amount || 0
      const executionRate = amount && amount > 0 ? actualAmount / amount : 0

      // 同比数据计算（去年同期）
      const lastYearPredictRecord = predictRecords.find(
        (r) =>
          r.detailedFundNeedId === detailedFundNeed.id &&
          r.year === year - 1 &&
          r.month === month
      )
      const lastYearAmount = lastYearPredictRecord?.amount || 0
      const yoyChange = lastYearAmount > 0 ? (amount || 0) / lastYearAmount - 1 : 0

      // 环比数据计算（上个月）
      let lastMonth = month - 1
      let lastMonthYear = year
      if (lastMonth === 0) {
        lastMonth = 12
        lastMonthYear = year - 1
      }
      
      const lastMonthPredictRecord = predictRecords.find(
        (r) =>
          r.detailedFundNeedId === detailedFundNeed.id &&
          r.year === lastMonthYear &&
          r.month === lastMonth
      )
      const lastMonthAmount = lastMonthPredictRecord?.amount || 0
      const momChange = lastMonthAmount > 0 ? (amount || 0) / lastMonthAmount - 1 : 0

      // 构建分析数据项
      analysisData.push({
        id: record.id,
        orgId: detailedFundNeed.organization.id,
        orgName: detailedFundNeed.organization.name,
        orgCode: detailedFundNeed.organization.code,
        departmentId: detailedFundNeed.department.id,
        departmentName: detailedFundNeed.department.name,
        departmentCode: '', // 数据库中可能没有此字段
        projectCategoryId: detailedFundNeed.subProject.project.category?.id || '',
        projectCategoryName: detailedFundNeed.subProject.project.category?.name || '',
        projectId: detailedFundNeed.subProject.project.id,
        projectName: detailedFundNeed.subProject.project.name,
        projectCode: detailedFundNeed.subProject.project.code || '',
        subProjectId: detailedFundNeed.subProject.id,
        subProjectName: detailedFundNeed.subProject.name,
        subProjectCode: '', // 数据库中可能没有此字段
        fundTypeId: detailedFundNeed.fundType.id,
        fundTypeName: detailedFundNeed.fundType.name,
        year,
        month,
        submittedDate: submittedAt 
          ? new Date(submittedAt).toISOString().split('T')[0]
          : '',
        predictAmount: amount || 0,
        actualAmount: actualAmount || 0,
        executionRate,
        yoyChange,
        momChange,
      })
      
      // 标记为已处理
      processedRecords.set(recordKey, true)
    }
    
    // 处理没有对应预测记录的审计记录
    for (const record of auditRecords) {
      const {
        detailedFundNeed,
        year,
        month,
        amount,
        submittedAt,
      } = record
      
      // 记录唯一标识
      const recordKey = `${detailedFundNeed.id}-${year}-${month}`
      
      // 如果该记录已经在处理预测记录时处理过，则跳过
      if (processedRecords.has(recordKey)) {
        continue
      }
      
      // 计算同比数据（去年同期）
      const lastYearAuditRecord = auditRecords.find(
        (r) =>
          r.detailedFundNeedId === detailedFundNeed.id &&
          r.year === year - 1 &&
          r.month === month
      )
      const lastYearAmount = lastYearAuditRecord?.amount || 0
      const yoyChange = lastYearAmount > 0 ? (amount || 0) / lastYearAmount - 1 : 0
      
      // 计算环比数据（上个月）
      let lastMonth = month - 1
      let lastMonthYear = year
      if (lastMonth === 0) {
        lastMonth = 12
        lastMonthYear = year - 1
      }
      
      const lastMonthAuditRecord = auditRecords.find(
        (r) =>
          r.detailedFundNeedId === detailedFundNeed.id &&
          r.year === lastMonthYear &&
          r.month === lastMonth
      )
      const lastMonthAmount = lastMonthAuditRecord?.amount || 0
      const momChange = lastMonthAmount > 0 ? (amount || 0) / lastMonthAmount - 1 : 0
      
      // 构建分析数据项
      analysisData.push({
        id: record.id,
        orgId: detailedFundNeed.organization.id,
        orgName: detailedFundNeed.organization.name,
        orgCode: detailedFundNeed.organization.code,
        departmentId: detailedFundNeed.department.id,
        departmentName: detailedFundNeed.department.name,
        departmentCode: '', // 数据库中可能没有此字段
        projectCategoryId: detailedFundNeed.subProject.project.category?.id || '',
        projectCategoryName: detailedFundNeed.subProject.project.category?.name || '',
        projectId: detailedFundNeed.subProject.project.id,
        projectName: detailedFundNeed.subProject.project.name,
        projectCode: detailedFundNeed.subProject.project.code || '',
        subProjectId: detailedFundNeed.subProject.id,
        subProjectName: detailedFundNeed.subProject.name,
        subProjectCode: '', // 数据库中可能没有此字段
        fundTypeId: detailedFundNeed.fundType.id,
        fundTypeName: detailedFundNeed.fundType.name,
        year,
        month,
        submittedDate: submittedAt 
          ? new Date(submittedAt).toISOString().split('T')[0]
          : '',
        predictAmount: 0, // 没有对应的预测记录
        actualAmount: amount || 0,
        executionRate: 0, // 没有预测值，执行率为0
        yoyChange,
        momChange,
      })
      
      // 标记为已处理
      processedRecords.set(recordKey, true)
    }

    return NextResponse.json({ data: analysisData })
  } catch (error) {
    console.error('分析数据获取失败:', error)
    return NextResponse.json(
      { error: '数据获取失败' },
      { status: 500 }
    )
  }
} 