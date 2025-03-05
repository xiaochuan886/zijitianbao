import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { ActualUserRecord, ActualFinRecord } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startYear = parseInt(searchParams.get("startYear") || new Date().getFullYear().toString());
    const startMonth = parseInt(searchParams.get("startMonth") || (new Date().getMonth() + 1).toString());
    const endYear = parseInt(searchParams.get("endYear") || startYear.toString());
    const endMonth = parseInt(searchParams.get("endMonth") || startMonth.toString());
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const organizationId = searchParams.get("organizationId");
    const departmentId = searchParams.get("departmentId");
    const categoryId = searchParams.get("categoryId");
    const projectId = searchParams.get("projectId");
    const subProjectId = searchParams.get("subProjectId");
    const fundTypeId = searchParams.get("fundTypeId");
    const status = searchParams.get("status");
    const recordType = searchParams.get("recordType") || "user"; // 默认为用户填报记录

    // 输出接收到的参数
    console.log("API接收到的参数:", {
      startYear,
      startMonth,
      endYear,
      endMonth,
      page,
      pageSize,
      organizationId,
      departmentId,
      categoryId,
      projectId,
      subProjectId,
      fundTypeId,
      status,
      recordType
    });

    // 构建查询条件
    const where: any = {};
    
    // 构建日期范围条件
    // 简化日期范围查询逻辑，避免复杂的嵌套条件
    if (startYear === endYear) {
      // 同一年内的月份范围
      where.year = startYear;
      where.month = {
        gte: startMonth,
        lte: endMonth
      };
    } else {
      // 跨年的日期范围
      where.OR = [
        // 开始年份的月份
        {
          year: startYear,
          month: { gte: startMonth }
        },
        // 结束年份的月份
        {
          year: endYear,
          month: { lte: endMonth }
        }
      ];
      
      // 如果开始年份和结束年份相差超过1年，添加中间年份的所有月份
      if (endYear - startYear > 1) {
        const middleYears = [];
        for (let year = startYear + 1; year < endYear; year++) {
          middleYears.push({ year });
        }
        if (middleYears.length > 0) {
          where.OR.push(...middleYears);
        }
      }
    }
    
    // 添加筛选条件
    const detailedFundNeedConditions: any = {};
    let hasDetailedConditions = false;

    if (organizationId && organizationId !== "all") {
      detailedFundNeedConditions.organizationId = organizationId;
      hasDetailedConditions = true;
    }

    if (departmentId && departmentId !== "all") {
      detailedFundNeedConditions.departmentId = departmentId;
      hasDetailedConditions = true;
    }

    if (categoryId && categoryId !== "all") {
      detailedFundNeedConditions.subProject = {
        ...detailedFundNeedConditions.subProject,
        project: {
          ...detailedFundNeedConditions.subProject?.project,
          categoryId,
        },
      };
      hasDetailedConditions = true;
    }

    if (projectId && projectId !== "all") {
      detailedFundNeedConditions.subProject = {
        ...detailedFundNeedConditions.subProject,
        projectId,
      };
      hasDetailedConditions = true;
    }

    if (subProjectId && subProjectId !== "all") {
      detailedFundNeedConditions.subProjectId = subProjectId;
      hasDetailedConditions = true;
    }

    if (fundTypeId && fundTypeId !== "all") {
      detailedFundNeedConditions.fundTypeId = fundTypeId;
      hasDetailedConditions = true;
    }

    if (hasDetailedConditions) {
      where.detailedFundNeed = detailedFundNeedConditions;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    // 查询总数和记录
    console.log("执行查询，条件:", JSON.stringify(where, null, 2));
    
    let total = 0;
    let records: any[] = [];
    
    // 根据记录类型选择不同的模型
    if (recordType === "fin") {
      total = await prisma.actualFinRecord.count({
        where,
      });
      
      records = await prisma.actualFinRecord.findMany({
        where,
        include: {
          detailedFundNeed: {
            include: {
              organization: true,
              department: true,
              fundType: true,
              subProject: {
                include: {
                  project: {
                    include: {
                      category: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [
          {
            year: "desc",
          },
          {
            month: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
    } else {
      total = await prisma.actualUserRecord.count({
        where,
      });
      
      records = await prisma.actualUserRecord.findMany({
        where,
        include: {
          detailedFundNeed: {
            include: {
              organization: true,
              department: true,
              fundType: true,
              subProject: {
                include: {
                  project: {
                    include: {
                      category: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [
          {
            year: "desc",
          },
          {
            month: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
    }

    console.log("查询结果:", {
      total,
      recordsCount: records.length,
      firstRecord: records.length > 0 ? {
        id: records[0].id,
        year: records[0].year,
        month: records[0].month
      } : null
    });

    // 获取所有机构
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        code: "asc"
      }
    });

    // 获取所有部门
    const departments = await prisma.department.findMany({
      where: {
        isDeleted: false
      },
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: "asc"
      }
    });

    // 获取所有项目分类
    const categories = await prisma.projectCategory.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: "asc"
      }
    });
    
    // 获取所有项目
    const projects = await prisma.project.findMany({
      where: {
        status: {
          in: ['active', 'ACTIVE', 'Active']
        }
      },
      select: {
        id: true,
        name: true,
        categoryId: true
      },
      orderBy: {
        name: "asc"
      }
    });
    
    // 获取所有子项目
    const subProjects = await prisma.subProject.findMany({
      select: {
        id: true,
        name: true,
        projectId: true
      },
      orderBy: {
        name: "asc"
      }
    });
    
    // 获取所有资金类型
    const fundTypes = await prisma.fundType.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: "asc"
      }
    });

    // 转换记录格式
    const formattedRecords = records.map((record: any) => ({
      id: record.id,
      organization: record.detailedFundNeed.organization.name,
      department: record.detailedFundNeed.department.name,
      category: record.detailedFundNeed.subProject.project.category?.name || "未分类",
      project: record.detailedFundNeed.subProject.project.name,
      subProject: record.detailedFundNeed.subProject.name,
      fundType: record.detailedFundNeed.fundType.name,
      year: record.year,
      month: record.month,
      amount: record.amount,
      status: record.status,
      submittedAt: record.submittedAt?.toISOString() || record.createdAt.toISOString(),
      remark: record.remark || "",
      canWithdraw: record.status === "SUBMITTED",
    }));

    return NextResponse.json({
      records: formattedRecords,
      organizations,
      departments,
      categories,
      projects,
      subProjects,
      fundTypes,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Error fetching actual history records:", error);
    return NextResponse.json(
      { error: "Failed to fetch actual history records" },
      { status: 500 }
    );
  }
} 