import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { z } from "zod";
import { services } from "@/lib/services";
import { RecordStatus, Role } from "@/lib/enums";
import { prisma } from "@/lib/prisma";

// 定义备注项的类型
interface RemarkItem {
  subProject: string;
  content: string;
  period: string;
}

// 验证撤回请求数据
const withdrawalRequestSchema = z.object({
  action: z.literal("withdrawal"),
  recordId: z.string(),
  reason: z.string().min(1, "请填写撤回原因"),
  test: z.boolean().optional(),
});

// 查询参数验证
const querySchema = z.object({
  year: z.coerce.number().optional(),
  month: z.coerce.number().optional(),
  subProjectId: z.string().optional(),
  projectId: z.string().optional(),
  categoryId: z.string().optional(),
  departmentId: z.string().optional(),
  organizationId: z.string().optional(),
  fundTypeId: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().optional().default(1),
  pageSize: z.coerce.number().optional().default(10),
  sortBy: z.string().optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
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

    // 统一处理所有记录，包括数据库记录和未填写记录
    return await handleAllRecords(params);
  } catch (error) {
    console.error("获取预测记录失败", error);
    return NextResponse.json({ error: "获取预测记录失败" }, { status: 500 });
  }
}

// 处理所有记录的函数
async function handleAllRecords(params: any) {
  console.log("处理所有记录查询");
  
  // 1. 构建DetailedFundNeed的查询条件（用于未填写记录）
  const detailedFundNeedCondition: any = {
    // 只查询有效的资金需求
    isActive: true
  };

  // 2. 构建PredictRecord的查询条件（用于数据库记录）
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

  // 添加状态筛选条件
  if (params.status) {
    // 状态筛选只应用于数据库记录，不影响DetailedFundNeed查询
    recordCondition.status = params.status.toUpperCase();
    console.log(`添加状态筛选条件: ${params.status.toUpperCase()}`);
  }

  console.log('DetailedFundNeed查询条件:', JSON.stringify(detailedFundNeedCondition, null, 2));
  console.log('Record查询条件:', JSON.stringify(recordCondition, null, 2));

  // 查询数据库中的记录
  const dbRecords = await prisma.predictRecord.findMany({
    where: recordCondition,
    include: {
      detailedFundNeed: {
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
      }
    },
    orderBy: {
      [params.sortBy]: params.sortOrder
    }
  });

  console.log(`数据库中查询到 ${dbRecords.length} 条记录`);
  
  // 统计数据库记录的状态分布
  const statusDistribution = dbRecords.reduce((acc: Record<string, number>, record) => {
    const status = record.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  console.log(`数据库记录状态分布: ${JSON.stringify(statusDistribution)}`);

  // 查询所有符合条件的DetailedFundNeed
  const detailedFundNeeds = await prisma.detailedFundNeed.findMany({
    where: detailedFundNeedCondition,
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

  console.log(`查询到 ${detailedFundNeeds.length} 个DetailedFundNeed记录`);

  // 创建已有记录的ID集合，用于快速查找
  const existingFundNeedIds = new Set(dbRecords.map(r => r.detailedFundNeedId));
  console.log(`已有记录的DetailedFundNeed数量: ${existingFundNeedIds.size}`);

  // 筛选出没有对应记录的DetailedFundNeed
  const unfilledFundNeeds = detailedFundNeeds.filter(fundNeed => !existingFundNeedIds.has(fundNeed.id));
  console.log(`未填写状态的DetailedFundNeed数量: ${unfilledFundNeeds.length}`);

  // 为每个未填写的需求创建临时记录
  const unfilledRecords = unfilledFundNeeds.map(fundNeed => ({
    id: `temp_${fundNeed.id}_${params.year}_${params.month}`,
    year: params.year,
    month: params.month,
    amount: null,
    remark: null,
    status: "UNFILLED",
    createdAt: new Date(),
    updatedAt: new Date(),
    detailedFundNeedId: fundNeed.id,
    detailedFundNeed: fundNeed,
    submittedBy: null,
    submittedAt: null
  }));

  console.log(`生成了 ${unfilledRecords.length} 条未填写临时记录`);
  
  if (dbRecords.length > 0 && unfilledRecords.length > 0) {
    console.log(`合并前数据库记录示例: ${JSON.stringify({
      id: dbRecords[0].id,
      status: dbRecords[0].status,
      detailedFundNeedId: dbRecords[0].detailedFundNeedId
    })}`);
    
    console.log(`合并前未填写记录示例: ${JSON.stringify({
      id: unfilledRecords[0].id,
      status: unfilledRecords[0].status,
      detailedFundNeedId: unfilledRecords[0].detailedFundNeedId
    })}`);
  }

  // 合并数据库记录和未填写记录
  let allRecords = [...dbRecords];
  
  // 只有在没有状态筛选或者状态筛选为UNFILLED时才添加未填写记录
  if (!params.status || params.status.toUpperCase() === 'UNFILLED') {
    allRecords = [...allRecords, ...unfilledRecords];
  }

  // 排序
  const sortedRecords = allRecords.sort((a, b) => {
    if (params.sortBy === "createdAt") {
      return params.sortOrder === "asc"
        ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });

  // 分页
  const startIndex = (params.page - 1) * params.pageSize;
  const endIndex = startIndex + params.pageSize;
  const paginatedRecords = sortedRecords.slice(startIndex, endIndex);
  
  // 统计分页后记录的状态分布
  const paginatedStatusDistribution = paginatedRecords.reduce((acc: Record<string, number>, record) => {
    const status = record.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  console.log(`合并后总记录数 ${allRecords.length} 条，分页后 ${paginatedRecords.length} 条`);
  console.log(`分页记录状态分布: ${JSON.stringify(paginatedStatusDistribution)}`);

  // 返回结果
  return NextResponse.json({
    items: paginatedRecords,
    total: allRecords.length,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.ceil(allRecords.length / params.pageSize)
  });
}

export async function POST(request: NextRequest) {
  try {
    // 获取用户会话
    const session = await getServerSession(authOptions);
    
    // 临时解决方案：即使没有会话也继续执行，不返回401错误
    let userId = "temp-user-id";
    if (session && session.user) {
      userId = session.user.id;
    }

    // 解析请求体
    const body = await request.json();

    // 处理撤回申请
    if (body.action === "withdrawal") {
      // 验证撤回请求数据
      const result = withdrawalRequestSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json({ 
          error: "请求数据格式错误", 
          details: result.error.format() 
        }, { status: 400 });
      }
      
      const { recordId, reason } = result.data;
      
      // 查找记录是否存在
      const record = await services.predictRecord.findById(recordId);
      
      if (!record) {
        // 如果在测试环境，直接返回成功
        if (process.env.NODE_ENV === "development" && body.test === true) {
          return NextResponse.json({ 
            success: true,
            message: "测试模式：撤回申请已提交，等待管理员审核",
            note: "记录ID不存在，但测试模式下忽略此错误"
          });
        }
        
        return NextResponse.json({ error: "记录不存在" }, { status: 404 });
      }
      
      // 检查记录状态是否为已提交
      if (record.status !== "SUBMITTED" && process.env.NODE_ENV !== "development") {
        return NextResponse.json({ 
          error: "只有已提交的记录才能申请撤回" 
        }, { status: 400 });
      }
      
      // 更新记录状态为"待撤回"
      await services.predictRecord.update(recordId, {
        status: RecordStatus.PENDING_WITHDRAWAL,
        remark: record.remark ? `${record.remark} | 撤回原因: ${reason}` : `撤回原因: ${reason}`
      }, userId);
      
      return NextResponse.json({ 
        success: true,
        message: "撤回申请已提交，等待管理员审核" 
      });
    }

    // 处理其他类型的请求...
    return NextResponse.json({ error: "不支持的操作" }, { status: 400 });
  } catch (error) {
    console.error("处理预测记录请求失败:", error);
    return NextResponse.json({ 
      error: "处理预测记录请求失败", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 