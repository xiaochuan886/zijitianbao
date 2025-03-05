import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// 查询参数验证
const querySchema = z.object({
  recordType: z.enum(["user", "finance"]),
  year: z.coerce.number().optional(),
  month: z.coerce.number().optional(),
  subProjectId: z.string().optional(),
  projectId: z.string().optional(),
  categoryId: z.string().optional(),
  departmentId: z.string().optional(),
  organizationId: z.string().optional(),
  fundTypeId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // 获取会话信息
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    const validatedParams = querySchema.safeParse(Object.fromEntries(searchParams.entries()));

    if (!validatedParams.success) {
      return NextResponse.json({ error: "无效的查询参数", details: validatedParams.error.format() }, { status: 400 });
    }

    const params = validatedParams.data;

    // 确保提供了年份和月份
    if (!params.year || !params.month) {
      return NextResponse.json({ error: "必须提供年份和月份参数" }, { status: 400 });
    }

    // 获取状态统计数据
    return await getStatusStats(params);
  } catch (error) {
    console.error("获取状态统计数据失败", error);
    return NextResponse.json({ error: "获取状态统计数据失败" }, { status: 500 });
  }
}

// 获取状态统计数据的函数
async function getStatusStats(params: any) {
  console.log("获取实际支出状态统计数据");
  
  // 1. 构建DetailedFundNeed的查询条件（用于未填写记录）
  const detailedFundNeedCondition: any = {
    // 只查询有效的资金需求
    isActive: true
  };

  // 2. 构建记录的查询条件（用于数据库记录）
  const recordCondition: any = {
    year: params.year,
    month: params.month
  };
  
  // 3. 为两种查询添加共同的过滤条件
  // 如果有多个嵌套条件，先创建detailedFundNeed属性
  if (params.subProjectId || params.departmentId || params.fundTypeId || 
      params.organizationId || params.projectId || params.categoryId) {
    recordCondition.detailedFundNeed = {};
  }
  
  // 添加过滤条件
  if (params.subProjectId) {
    detailedFundNeedCondition.subProjectId = params.subProjectId;
    recordCondition.detailedFundNeed.subProjectId = params.subProjectId;
  }

  if (params.departmentId) {
    detailedFundNeedCondition.departmentId = params.departmentId;
    recordCondition.detailedFundNeed.departmentId = params.departmentId;
  }

  if (params.organizationId) {
    detailedFundNeedCondition.organizationId = params.organizationId;
    recordCondition.detailedFundNeed.organizationId = params.organizationId;
  }

  if (params.fundTypeId) {
    detailedFundNeedCondition.fundTypeId = params.fundTypeId;
    recordCondition.detailedFundNeed.fundTypeId = params.fundTypeId;
  }
  
  // 项目和类别条件需要创建嵌套结构
  if (params.projectId || params.categoryId) {
    if (!detailedFundNeedCondition.subProject) {
      detailedFundNeedCondition.subProject = {};
    }
    
    if (!recordCondition.detailedFundNeed.subProject) {
      recordCondition.detailedFundNeed.subProject = {};
    }
    
    if (params.projectId) {
      detailedFundNeedCondition.subProject.projectId = params.projectId;
      recordCondition.detailedFundNeed.subProject.projectId = params.projectId;
    }
    
    if (params.categoryId) {
      detailedFundNeedCondition.subProject.project = {
        categoryId: params.categoryId
      };
      
      recordCondition.detailedFundNeed.subProject.project = {
        categoryId: params.categoryId
      };
    }
  }

  // 根据记录类型选择表
  const recordModel = params.recordType === "user" ? 
    prisma.actualUserRecord : 
    prisma.actualFinRecord;

  // 查询数据库中的记录
  const dbRecords = await (recordModel as any).findMany({
    where: recordCondition,
    select: {
      id: true,
      status: true,
      detailedFundNeedId: true
    }
  });

  console.log(`数据库中查询到 ${dbRecords.length} 条记录`);
  
  // 统计数据库记录的状态分布
  const statusDistribution = dbRecords.reduce((acc: Record<string, number>, record: any) => {
    const status = record.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  console.log(`数据库记录状态分布: ${JSON.stringify(statusDistribution)}`);

  // 查询所有符合条件的DetailedFundNeed
  const detailedFundNeedsCount = await prisma.detailedFundNeed.count({
    where: detailedFundNeedCondition
  });

  console.log(`查询到 ${detailedFundNeedsCount} 个DetailedFundNeed记录`);

  // 创建已有记录的ID集合，用于快速查找
  const existingFundNeedIds = new Set(dbRecords.map((r: any) => r.detailedFundNeedId));
  console.log(`已有记录的DetailedFundNeed数量: ${existingFundNeedIds.size}`);

  // 计算未填写的记录数量
  const unfilledCount = detailedFundNeedsCount - existingFundNeedIds.size;
  console.log(`未填写状态的DetailedFundNeed数量: ${unfilledCount}`);

  // 将未填写记录数量添加到状态分布中
  if (unfilledCount > 0) {
    statusDistribution["UNFILLED"] = unfilledCount;
  }

  // 返回结果
  return NextResponse.json({
    statusCounts: statusDistribution,
    total: dbRecords.length + unfilledCount
  });
} 