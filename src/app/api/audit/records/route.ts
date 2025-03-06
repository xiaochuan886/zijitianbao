import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import { Role } from "@/lib/enums"

// 定义可审核记录的类型
interface AuditableRecord {
  id: string;
  detailedFundNeedId: string;
  year: number;
  month: number;
  userAmount: number | null;
  financeAmount: number | null;
  projectName: string;
  subProjectName: string;
  fundTypeName: string;
  departmentName: string;
  organizationName: string;
  hasDifference: boolean;
  userRecordId: string;
  financeRecordId: string;
  userStatus: string;
  financeStatus: string;
}

/**
 * 获取可审核的记录
 * GET /api/audit/records?year=2024&month=5
 */
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 })
    }

    // 检查用户是否有审核权限
    const isAuditor = session.user.role === Role.AUDITOR || session.user.role === Role.ADMIN
    if (!isAuditor) {
      return NextResponse.json({ error: "没有审核权限" }, { status: 403 })
    }

    // 获取查询参数
    const searchParams = request.nextUrl.searchParams
    const year = parseInt(searchParams.get("year") || "0")
    const month = parseInt(searchParams.get("month") || "0")

    if (!year || !month) {
      return NextResponse.json({ error: "缺少年份或月份参数" }, { status: 400 })
    }

    // 查询已提交状态的用户填报记录
    const userRecords = await prisma.actualUserRecord.findMany({
      where: {
        year,
        month,
        status: "SUBMITTED", // 只查询已提交的记录
      },
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

    // 查询已提交状态的财务填报记录
    const financeRecords = await prisma.actualFinRecord.findMany({
      where: {
        year,
        month,
        status: "SUBMITTED", // 只查询已提交的记录
      },
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

    // 查询已存在的审核记录
    const existingAuditRecords = await prisma.auditRecord.findMany({
      where: {
        year,
        month,
      },
      select: {
        detailedFundNeedId: true,
      },
    })

    // 将已审核的记录ID存入Set中，便于快速查找
    const auditedDetailedFundNeedIds = new Set(
      existingAuditRecords.map(record => record.detailedFundNeedId)
    )

    // 创建用户填报记录的Map，以detailedFundNeedId为键
    const userRecordsMap = new Map(
      userRecords.map(record => [record.detailedFundNeedId, record])
    )

    // 创建财务填报记录的Map，以detailedFundNeedId为键
    const financeRecordsMap = new Map(
      financeRecords.map(record => [record.detailedFundNeedId, record])
    )

    // 找出同时存在于用户填报和财务填报中的记录
    const auditableRecords: AuditableRecord[] = []

    // 使用 Array.from 处理 Map 迭代器
    Array.from(userRecordsMap.entries()).forEach(([detailedFundNeedId, userRecord]) => {
      // 如果该记录已经审核过，则跳过
      if (auditedDetailedFundNeedIds.has(detailedFundNeedId)) {
        return
      }

      // 查找对应的财务填报记录
      const financeRecord = financeRecordsMap.get(detailedFundNeedId)
      
      // 如果同时存在用户填报和财务填报记录，则添加到可审核记录列表
      if (financeRecord) {
        // 检查金额是否有差异
        const hasDifference = userRecord.amount !== financeRecord.amount

        auditableRecords.push({
          id: `${userRecord.id}_${financeRecord.id}`,
          detailedFundNeedId,
          year,
          month,
          userAmount: userRecord.amount,
          financeAmount: financeRecord.amount,
          projectName: userRecord.detailedFundNeed.subProject.project.name,
          subProjectName: userRecord.detailedFundNeed.subProject.name,
          fundTypeName: userRecord.detailedFundNeed.fundType.name,
          departmentName: userRecord.detailedFundNeed.department.name,
          organizationName: userRecord.detailedFundNeed.organization.name,
          hasDifference,
          userRecordId: userRecord.id,
          financeRecordId: financeRecord.id,
          userStatus: userRecord.status,
          financeStatus: financeRecord.status,
        })
      }
    })

    return NextResponse.json({
      items: auditableRecords,
      total: auditableRecords.length,
    })
  } catch (error) {
    console.error("获取审核记录失败:", error)
    return NextResponse.json(
      { error: "获取审核记录失败" },
      { status: 500 }
    )
  }
} 