import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import { Role } from "@/lib/enums"

/**
 * 提交审核结果
 * POST /api/audit/submit
 */
export async function POST(request: NextRequest) {
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

    // 获取请求数据
    const data = await request.json()
    const { 
      userRecordId, 
      financeRecordId, 
      amount, 
      remark, 
      year, 
      month, 
      detailedFundNeedId 
    } = data

    // 验证必填字段
    if (!userRecordId || !financeRecordId || amount === undefined || !year || !month || !detailedFundNeedId) {
      return NextResponse.json({ error: "缺少必填字段" }, { status: 400 })
    }

    // 查询用户填报记录和财务填报记录，确保它们存在
    const userRecord = await prisma.actualUserRecord.findUnique({
      where: { id: userRecordId },
    })

    const financeRecord = await prisma.actualFinRecord.findUnique({
      where: { id: financeRecordId },
    })

    if (!userRecord || !financeRecord) {
      return NextResponse.json({ error: "填报记录不存在" }, { status: 404 })
    }

    // 检查是否已经存在审核记录
    const existingAuditRecord = await prisma.auditRecord.findFirst({
      where: {
        detailedFundNeedId,
        year,
        month,
      },
    })

    let auditRecord

    if (existingAuditRecord) {
      // 更新现有审核记录
      auditRecord = await prisma.auditRecord.update({
        where: { id: existingAuditRecord.id },
        data: {
          amount: parseFloat(amount.toString()),
          remark,
          status: "SUBMITTED", // 设置为已提交状态
          submittedBy: session.user.id,
          submittedAt: new Date(),
          financeRecordId,
        },
      })

      // 创建审计日志
      await prisma.recordAudit.create({
        data: {
          auditRecordId: auditRecord.id,
          userId: session.user.id,
          action: "update",
          oldValue: JSON.stringify(existingAuditRecord),
          newValue: JSON.stringify(auditRecord),
          role: session.user.role,
          remarks: `更新审核记录`,
        },
      })
    } else {
      // 创建新的审核记录
      auditRecord = await prisma.auditRecord.create({
        data: {
          detailedFundNeedId,
          year,
          month,
          amount: parseFloat(amount.toString()),
          remark,
          status: "SUBMITTED", // 设置为已提交状态
          submittedBy: session.user.id,
          submittedAt: new Date(),
          financeRecordId,
        },
      })

      // 创建审计日志
      await prisma.recordAudit.create({
        data: {
          auditRecordId: auditRecord.id,
          userId: session.user.id,
          action: "create",
          newValue: JSON.stringify(auditRecord),
          role: session.user.role,
          remarks: `创建审核记录`,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: "审核结果已提交",
      data: auditRecord,
    })
  } catch (error) {
    console.error("提交审核结果失败:", error)
    return NextResponse.json(
      { error: "提交审核结果失败" },
      { status: 500 }
    )
  }
} 