import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户权限
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "未授权访问" },
        { status: 401 }
      );
    }

    // 只有管理员和审计人员可以执行审核操作
    if (session.user.role !== "ADMIN" && session.user.role !== "AUDITOR") {
      return NextResponse.json(
        { success: false, message: "没有权限执行此操作" },
        { status: 403 }
      );
    }

    const organizationId = params.id;
    if (!organizationId) {
      return NextResponse.json(
        { success: false, message: "机构ID不能为空" },
        { status: 400 }
      );
    }

    // 解析请求体
    const body = await req.json();
    const { records, remark, year, month } = body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { success: false, message: "审核记录不能为空" },
        { status: 400 }
      );
    }

    // 验证年月
    if (!year || !month) {
      return NextResponse.json(
        { success: false, message: "年份和月份不能为空" },
        { status: 400 }
      );
    }

    // 获取机构信息
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, message: "机构不存在" },
        { status: 404 }
      );
    }

    // 开始事务处理
    const results = await prisma.$transaction(async (tx) => {
      const auditResults = [];

      for (const record of records) {
        const { financeRecordId, detailedFundNeedId, amount } = record;

        if (!financeRecordId || !detailedFundNeedId) {
          auditResults.push({
            success: false,
            message: "财务记录ID或详细资金需求ID不能为空",
            record,
          });
          continue;
        }

        // 检查财务记录是否存在
        const financeRecord = await tx.actualFinRecord.findUnique({
          where: { id: financeRecordId },
        });

        if (!financeRecord) {
          auditResults.push({
            success: false,
            message: "财务记录不存在",
            record,
          });
          continue;
        }

        // 检查是否已经有审核记录
        const existingAuditRecord = await tx.auditRecord.findFirst({
          where: {
            financeRecordId,
            year: parseInt(year),
            month: parseInt(month),
          },
        });

        let auditRecord;

        if (existingAuditRecord) {
          // 更新现有审核记录
          auditRecord = await tx.auditRecord.update({
            where: { id: existingAuditRecord.id },
            data: {
              amount: parseFloat(amount),
              status: "APPROVED",
              remark: remark || "批量审核通过",
              submittedBy: session.user.id,
              submittedAt: new Date(),
            },
          });
        } else {
          // 创建新的审核记录
          auditRecord = await tx.auditRecord.create({
            data: {
              financeRecordId,
              detailedFundNeedId,
              year: parseInt(year),
              month: parseInt(month),
              amount: parseFloat(amount),
              status: "APPROVED",
              remark: remark || "批量审核通过",
              submittedBy: session.user.id,
              submittedAt: new Date(),
            },
          });
        }

        auditResults.push({
          success: true,
          message: "审核成功",
          auditRecordId: auditRecord.id,
          record,
        });
      }

      return auditResults;
    });

    // 统计成功和失败的数量
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      message: `成功审核 ${successCount} 条记录，失败 ${failureCount} 条`,
      data: {
        results,
        stats: {
          total: results.length,
          success: successCount,
          failure: failureCount,
        },
      },
    });
  } catch (error) {
    console.error("批量审核记录失败:", error);
    return NextResponse.json(
      { success: false, message: "批量审核记录失败" },
      { status: 500 }
    );
  }
} 