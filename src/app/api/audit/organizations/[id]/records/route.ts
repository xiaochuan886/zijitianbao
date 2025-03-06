import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(
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

    // 只有管理员和审计人员可以访问
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

    // 获取当前年月和计算上个月
    const now = new Date();
    console.log("当前日期:", now.toISOString());
    
    // 计算上个月的年月
    // JavaScript月份是0-11的索引，0代表1月，11代表12月
    const nowMonthIndex = now.getMonth(); // 当前月份索引
    
    // 正确计算上个月的索引和年份
    const prevMonthIndex = nowMonthIndex === 0 ? 11 : nowMonthIndex - 1; // 上个月的索引
    const prevYear = nowMonthIndex === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const prevMonth = prevMonthIndex + 1; // 转换为1-12月份表示
    
    console.log(`当前月份索引: ${nowMonthIndex}，代表: ${nowMonthIndex + 1}月`);
    console.log(`上个月索引: ${prevMonthIndex}，代表: ${prevMonth}月`);
    console.log(`计算上个月: ${prevYear}年${prevMonth}月`);
    
    // 优先使用URL参数，如果没有则使用上个月的年月
    const targetYear = parseInt(req.nextUrl.searchParams.get("year") || prevYear.toString());
    const targetMonth = parseInt(req.nextUrl.searchParams.get("month") || prevMonth.toString());

    console.log(`最终使用的年月: ${targetYear}年${targetMonth}月`);

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

    // 获取该机构下所有已提交但未审核的记录
    // 1. 首先获取所有填报人记录
    const userRecords = await prisma.actualUserRecord.findMany({
      where: {
        detailedFundNeed: {
          organizationId,
        },
        year: targetYear,
        month: targetMonth,
        status: {
          in: ["SUBMITTED", "APPROVED"],
        },
      },
      include: {
        detailedFundNeed: {
          include: {
            department: true,
            subProject: {
              include: {
                project: true,
              },
            },
            fundType: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    console.log(`获取到填报人记录: ${userRecords.length}条`);

    // 收集所有填报人记录的详细需求ID
    const detailedFundNeedIds = Array.from(new Set(userRecords.map(record => record.detailedFundNeedId)));

    // 2. 获取财务记录，改为使用detailedFundNeedId查询
    const financeRecords = await prisma.actualFinRecord.findMany({
      where: {
        detailedFundNeedId: {
          in: detailedFundNeedIds
        },
        year: targetYear,
        month: targetMonth,
        status: {
          in: ["SUBMITTED", "APPROVED"],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`获取到财务记录: ${financeRecords.length}条`);

    // 创建填报人记录和财务记录的映射关系
    // 不再仅依赖userRecordId，而是使用detailedFundNeedId、year和month来匹配
    const financeRecordsMap = new Map();
    
    // 对于每条财务记录，创建一个唯一键
    financeRecords.forEach(record => {
      const key = `${record.detailedFundNeedId}_${record.year}_${record.month}`;
      financeRecordsMap.set(key, record);
    });

    // 3. 获取已有的审核记录
    const auditRecords = await prisma.auditRecord.findMany({
      where: {
        detailedFundNeed: {
          organizationId,
        },
        year: targetYear,
        month: targetMonth,
      },
    });

    console.log(`获取到审核记录: ${auditRecords.length}条`);

    // 创建审核记录的映射，使用financeRecordId作为键
    const auditRecordsMap = new Map();
    auditRecords.forEach(record => {
      if (record.financeRecordId) {
        auditRecordsMap.set(record.financeRecordId, record);
      }
    });

    // 4. 合并数据，构建完整的审核记录列表
    const recordsForAudit = userRecords.map(userRecord => {
      // 创建匹配键
      const key = `${userRecord.detailedFundNeedId}_${userRecord.year}_${userRecord.month}`;
      // 查找对应的财务记录
      const financeRecord = financeRecordsMap.get(key);
      // 如果有财务记录，查找对应的审核记录
      const auditRecord = financeRecord ? auditRecordsMap.get(financeRecord.id) : null;

      return {
        id: userRecord.id,
        detailedFundNeedId: userRecord.detailedFundNeedId,
        year: userRecord.year,
        month: userRecord.month,
        departmentName: userRecord.detailedFundNeed.department.name,
        projectName: userRecord.detailedFundNeed.subProject.project.name,
        subProjectName: userRecord.detailedFundNeed.subProject.name,
        fundTypeName: userRecord.detailedFundNeed.fundType.name,
        userAmount: userRecord.amount,
        userStatus: userRecord.status,
        userSubmittedBy: userRecord.user?.name || "未知",
        userSubmittedAt: userRecord.submittedAt,
        financeRecordId: financeRecord?.id,
        financeAmount: financeRecord?.amount,
        financeStatus: financeRecord?.status,
        financeSubmittedBy: financeRecord?.user?.name || "未知",
        financeSubmittedAt: financeRecord?.submittedAt,
        auditRecordId: auditRecord?.id,
        auditAmount: auditRecord?.amount,
        auditStatus: auditRecord?.status,
        auditRemark: auditRecord?.remark,
        needsAudit: financeRecord && (!auditRecord || auditRecord.status !== "APPROVED"),
        canEdit: financeRecord && (!auditRecord || auditRecord.status !== "APPROVED"),
      };
    });

    // 过滤出需要审核的记录
    const pendingRecords = recordsForAudit.filter(record => record.needsAudit);
    
    // 计算真正已审核的记录数（实际存在审核记录的记录数）
    const actuallyAuditedCount = recordsForAudit.filter(record => 
      record.auditRecordId && record.auditStatus === "APPROVED"
    ).length;
    
    // 计算不可审核的记录数（没有对应财务记录的记录）
    const notAuditableCount = recordsForAudit.filter(record => 
      !record.financeRecordId
    ).length;
    
    // 计算不一致记录数（用户填报金额与财务金额不一致的记录）
    const inconsistentCount = recordsForAudit.filter(record => 
      record.financeRecordId && record.userAmount !== record.financeAmount
    ).length;

    const response = {
      success: true,
      data: {
        organization,
        // 返回所有记录，而不仅仅是待审核的记录，客户端可以自行筛选
        records: recordsForAudit,
        currentPeriod: {
          year: targetYear,
          month: targetMonth,
        },
        stats: {
          total: recordsForAudit.length,
          pending: pendingRecords.length,
          audited: actuallyAuditedCount,
          notAuditable: notAuditableCount,
          inconsistent: inconsistentCount
        },
      }
    };

    console.log("返回的响应统计:", {
      organization: organization.name,
      recordsCount: recordsForAudit.length, // 更新为总记录数
      pendingCount: pendingRecords.length,
      currentPeriod: response.data.currentPeriod,
      stats: response.data.stats
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("获取机构审核记录失败:", error);
    return NextResponse.json(
      { success: false, message: "获取机构审核记录失败" },
      { status: 500 }
    );
  }
} 