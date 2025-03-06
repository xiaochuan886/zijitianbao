import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // 检查用户是否已登录
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "未授权访问" },
        { status: 401 }
      );
    }

    // 检查用户角色
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "AUDITOR"
    ) {
      return NextResponse.json(
        { success: false, message: "没有权限执行此操作" },
        { status: 403 }
      );
    }

    const organizationId = params.id;
    
    // 检查组织是否存在
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, message: "组织不存在" },
        { status: 404 }
      );
    }

    // 获取请求体
    const body = await req.json();
    const { records } = body;

    if (!records || !Array.isArray(records)) {
      return NextResponse.json(
        { success: false, message: "无效的请求数据" },
        { status: 400 }
      );
    }

    // 批量更新审核结果
    const updatePromises = records.map(async (record) => {
      const { id, auditResult, amount } = record;
      
      if (!id) {
        return null;
      }

      try {
        // 查找财务记录
        const financeRecord = await prisma.actualFinRecord.findFirst({
          where: { userRecordId: id },
        });

        if (!financeRecord) {
          console.log(`未找到关联的财务记录: ${id}`);
          return null;
        }

        // 查找是否已有审核记录
        let auditRecord = await prisma.auditRecord.findFirst({
          where: { financeRecordId: financeRecord.id },
        });

        // 优先使用前端传递的金额，如果没有则使用财务记录金额
        const finalAmount = amount !== undefined && amount !== null ? 
                          amount : 
                          financeRecord.amount;

        console.log(`记录ID: ${id}, 处理金额: ${finalAmount}, 审核结果: ${auditResult}`);

        if (auditRecord) {
          // 更新现有审核记录
          return prisma.auditRecord.update({
            where: { id: auditRecord.id },
            data: {
              remark: auditResult || null,
              status: auditResult ? "APPROVED" : "DRAFT",
              submittedBy: auditResult ? session.user.id : null,
              submittedAt: auditResult ? new Date() : null,
              amount: finalAmount, // 使用确定的金额
            },
          });
        } else {
          // 创建新的审核记录
          return prisma.auditRecord.create({
            data: {
              detailedFundNeedId: financeRecord.detailedFundNeedId,
              year: financeRecord.year,
              month: financeRecord.month,
              amount: finalAmount, // 使用确定的金额
              status: auditResult ? "APPROVED" : "DRAFT",
              remark: auditResult || null,
              submittedBy: auditResult ? session.user.id : null,
              submittedAt: auditResult ? new Date() : null,
              financeRecordId: financeRecord.id,
            },
          });
        }
      } catch (err) {
        console.error(`处理记录 ${id} 时出错:`, err);
        return null;
      }
    });

    // 执行所有更新操作
    const results = await Promise.all(updatePromises.filter(Boolean));

    console.log(`更新了 ${results.length} 条审核记录`);

    return NextResponse.json({
      success: true,
      message: "审核结果已保存",
    });
  } catch (error) {
    console.error("保存审核结果失败:", error);
    return NextResponse.json(
      { success: false, message: "保存审核结果失败" },
      { status: 500 }
    );
  }
} 