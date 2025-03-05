import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { RecordStatus } from "@prisma/client";

// 验证创建记录请求数据
const createRecordsSchema = z.object({
  recordType: z.enum(["user", "finance"]),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  organizationId: z.string().optional(),
  departmentId: z.string().optional(),
  projectId: z.string().optional(),
  projectCategoryId: z.string().optional(),
  subProjectId: z.string().optional(),
  fundTypeId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 获取用户会话
    const session = await getServerSession(authOptions);
    
    // 检查用户是否已登录
    if (!session || !session.user) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // 解析请求体
    const body = await request.json();
    
    // 验证请求数据
    const result = createRecordsSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ 
        error: "请求数据格式错误", 
        details: result.error.format() 
      }, { status: 400 });
    }
    
    const { 
      recordType,
      year, 
      month, 
      organizationId, 
      departmentId, 
      projectId, 
      projectCategoryId,
      subProjectId,
      fundTypeId
    } = result.data;
    
    console.log(`开始创建实际支出填报记录: 类型=${recordType}, 年=${year}, 月=${month}`);
    
    // 构建查询条件
    const detailedFundNeedsWhere: any = {};
    
    if (organizationId) {
      detailedFundNeedsWhere.organizationId = organizationId;
    }
    
    if (departmentId) {
      detailedFundNeedsWhere.departmentId = departmentId;
    }
    
    if (fundTypeId) {
      detailedFundNeedsWhere.fundTypeId = fundTypeId;
    }
    
    // 子项目条件
    const subProjectCondition: any = {};
    
    if (subProjectId) {
      subProjectCondition.id = subProjectId;
    } else if (projectId) {
      subProjectCondition.projectId = projectId;
    } else if (projectCategoryId) {
      subProjectCondition.project = {
        categoryId: projectCategoryId
      };
    }
    
    // 查询所有符合条件的资金需求明细
    const detailedFundNeeds = await prisma.detailedFundNeed.findMany({
      where: detailedFundNeedsWhere,
      include: {
        subProject: {
          include: {
            project: {
              include: {
                category: true
              }
            }
          }
        },
        department: true,
        organization: true,
        fundType: true
      }
    });
    
    console.log(`找到 ${detailedFundNeeds.length} 条资金需求明细`);
    
    // 过滤掉没有关联子项目的资金需求明细，并应用子项目筛选条件
    const validDetailedFundNeeds = detailedFundNeeds.filter(need => {
      if (!need.subProject) return false;
      
      // 应用子项目筛选条件
      if (subProjectId && need.subProject.id !== subProjectId) return false;
      if (projectId && need.subProject.projectId !== projectId) return false;
      if (projectCategoryId && need.subProject.project.categoryId !== projectCategoryId) return false;
      
      return true;
    });
    
    console.log(`有效的资金需求明细数量: ${validDetailedFundNeeds.length}`);
    
    if (validDetailedFundNeeds.length === 0) {
      return NextResponse.json({ 
        error: "未找到符合条件的资金需求明细",
        message: "请检查筛选条件或确保资金需求明细已正确设置"
      }, { status: 404 });
    }
    
    // 根据记录类型选择表
    const recordModel = recordType === "user" ? 
      prisma.actualUserRecord : 
      prisma.actualFinRecord;
    
    // 查询已存在的记录，避免重复创建
    const existingRecords = await (recordModel as any).findMany({
      where: {
        year,
        month,
        OR: validDetailedFundNeeds.map(need => ({
          detailedFundNeedId: need.id
        }))
      }
    });
    
    console.log(`已存在 ${existingRecords.length} 条记录`);
    
    // 创建记录映射，用于快速查找
    const existingRecordMap = new Map();
    existingRecords.forEach((record: any) => {
      existingRecordMap.set(record.detailedFundNeedId, record);
    });
    
    // 准备要创建的记录
    const recordsToCreate = [];
    
    for (const need of validDetailedFundNeeds) {
      // 如果记录已存在，跳过
      if (existingRecordMap.has(need.id)) {
        continue;
      }
      
      // 创建新记录
      recordsToCreate.push({
        detailedFundNeedId: need.id,
        year,
        month,
        amount: null,
        status: RecordStatus.DRAFT, // 使用 Prisma 的 RecordStatus 枚举
        submittedBy: userId,
        submittedAt: new Date()
      });
    }
    
    console.log(`需要创建 ${recordsToCreate.length} 条新记录`);
    
    // 批量创建记录
    if (recordsToCreate.length > 0) {
      await (recordModel as any).createMany({
        data: recordsToCreate
      });
    }
    
    return NextResponse.json({
      success: true,
      message: `成功创建 ${recordsToCreate.length} 条实际支出填报记录`,
      total: validDetailedFundNeeds.length,
      created: recordsToCreate.length,
      existing: existingRecords.length
    });
  } catch (error) {
    console.error("创建实际支出填报记录失败:", error);
    return NextResponse.json({ 
      error: "创建实际支出填报记录失败", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 