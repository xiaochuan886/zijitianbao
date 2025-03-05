import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { RecordStatus } from "@/lib/enums"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

export async function POST(req: Request) {
  try {
    // 验证用户会话
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 })
    }

    // 解析请求数据
    const { recordIds, year, month } = await req.json()

    // 验证必要参数
    if (!Array.isArray(recordIds) || recordIds.length === 0) {
      return NextResponse.json({ error: "请选择要提交的记录" }, { status: 400 })
    }

    if (!year || !month) {
      return NextResponse.json({ error: "年月参数无效" }, { status: 400 })
    }

    // 获取要提交的记录
    const records = await prisma.actualUserRecord.findMany({
      where: {
        id: { in: recordIds },
        userId: session.user.id,
        year: year,
        month: month
      }
    })

    // 验证记录状态
    const invalidRecords = records.filter(record => 
      record.status !== RecordStatus.DRAFT && 
      record.status !== RecordStatus.REJECTED
    )

    if (invalidRecords.length > 0) {
      return NextResponse.json({
        error: "存在无法提交的记录，请确保所选记录都是草稿或已拒绝状态"
      }, { status: 400 })
    }

    // 批量更新记录状态为已提交
    const updateResult = await prisma.actualUserRecord.updateMany({
      where: {
        id: { in: recordIds },
        userId: session.user.id,
        year: year,
        month: month,
        OR: [
          { status: RecordStatus.DRAFT },
          { status: RecordStatus.REJECTED }
        ]
      },
      data: {
        status: RecordStatus.SUBMITTED,
        submittedAt: new Date()
      }
    })

    return NextResponse.json({
      message: "提交成功",
      count: updateResult.count
    })
  } catch (error) {
    console.error("批量提交失败:", error)
    return NextResponse.json(
      { error: "提交失败，请稍后重试" },
      { status: 500 }
    )
  }
}