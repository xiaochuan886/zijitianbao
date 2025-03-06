import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
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

    // 获取当前年月
    const now = new Date();
    console.log("当前日期:", now.toISOString());
    
    // 计算上个月的年月
    // JavaScript月份是0-11的索引，0代表1月，11代表12月
    const currentMonth = now.getMonth(); // 当前月份索引
    
    // 正确计算上个月的索引和年份
    const prevMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1; // 上个月的索引
    const prevYear = currentMonth === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const prevMonth = prevMonthIndex + 1; // 转换为1-12月份表示
    
    console.log(`当前月份索引: ${currentMonth}，代表: ${currentMonth + 1}月`);
    console.log(`上个月索引: ${prevMonthIndex}，代表: ${prevMonth}月`);
    console.log(`计算上个月: ${prevYear}年${prevMonth}月`);

    // 获取所有机构
    const organizations = await prisma.organization.findMany({
      orderBy: { name: "asc" },
    });

    console.log(`获取到 ${organizations.length} 个机构`);

    // 获取每个机构的审核数据
    const organizationsWithAuditData = await Promise.all(
      organizations.map(async (org) => {
        console.log(`处理机构: ${org.name} (${org.id})`);
        
        // 1. 获取有效记录数（DetailedFundNeed表中对应机构且isActive为true的记录）
        const activeRecordsCount = await prisma.detailedFundNeed.count({
          where: {
            organizationId: org.id,
            isActive: true,
            subProject: {
              project: {
                status: "ACTIVE",
              },
            },
          },
        });

        console.log(`机构 ${org.name} 的活跃记录数: ${activeRecordsCount}`);

        // 2. 获取填报人填报记录数（上个月）
        const userRecordsCount = await prisma.actualUserRecord.count({
          where: {
            detailedFundNeed: {
              organizationId: org.id,
            },
            year: prevYear,
            month: prevMonth,
            status: {
              in: ["SUBMITTED", "APPROVED"],
            },
          },
        });

        console.log(`机构 ${org.name} 的填报人记录数 (${prevYear}年${prevMonth}月): ${userRecordsCount}`);

        // 3. 获取财务填报记录数（上个月）
        const financeRecordsCount = await prisma.actualFinRecord.count({
          where: {
            detailedFundNeed: {
              organizationId: org.id,
            },
            year: prevYear,
            month: prevMonth,
            status: {
              in: ["SUBMITTED", "APPROVED"],
            },
          },
        });

        console.log(`机构 ${org.name} 的财务记录数 (${prevYear}年${prevMonth}月): ${financeRecordsCount}`);

        // 4. 获取已审核记录数（上个月）
        const auditedRecordsCount = await prisma.auditRecord.count({
          where: {
            detailedFundNeed: {
              organizationId: org.id,
            },
            year: prevYear,
            month: prevMonth,
            status: "APPROVED",
          },
        });

        console.log(`机构 ${org.name} 的已审核记录数 (${prevYear}年${prevMonth}月): ${auditedRecordsCount}`);

        // 5. 判断是否可以审核（填报人记录数和财务记录数相等且大于0，且不等于已审核记录数）
        const canAudit = userRecordsCount > 0 && 
                         userRecordsCount === financeRecordsCount && 
                         auditedRecordsCount < userRecordsCount;

        console.log(`机构 ${org.name} 是否可以审核: ${canAudit}`);

        return {
          ...org,
          activeRecordsCount,
          userRecordsCount,
          financeRecordsCount,
          auditedRecordsCount,
          canAudit,
          pendingAuditCount: canAudit ? userRecordsCount - auditedRecordsCount : 0
        };
      })
    );

    const response = {
      success: true,
      data: organizationsWithAuditData,
      currentPeriod: {
        year: prevYear,
        month: prevMonth
      }
    };

    console.log("返回的响应:", {
      success: response.success,
      organizationCount: response.data.length,
      currentPeriod: response.currentPeriod
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("获取审核机构列表失败:", error);
    return NextResponse.json(
      { success: false, message: "获取审核机构列表失败" },
      { status: 500 }
    );
  }
} 