import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

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

    // 构建查询条件
    const where: any = {
      OR: [
        {
          // 开始年份和结束年份相同
          AND: [
            { year: startYear },
            { month: { gte: startMonth } },
            { month: { lte: endMonth } },
          ],
        },
        {
          // 开始年份和结束年份不同
          OR: [
            {
              // 开始年份的月份
              AND: [
                { year: startYear },
                { month: { gte: startMonth } },
              ],
            },
            {
              // 结束年份的月份
              AND: [
                { year: endYear },
                { month: { lte: endMonth } },
              ],
            },
            {
              // 中间年份的所有月份
              AND: [
                { year: { gt: startYear } },
                { year: { lt: endYear } },
              ],
            },
          ],
        },
      ],
    };

    // 添加筛选条件
    if (organizationId && organizationId !== "all") {
      where.detailedFundNeed = {
        ...where.detailedFundNeed,
        organizationId,
      };
    }

    if (departmentId && departmentId !== "all") {
      where.detailedFundNeed = {
        ...where.detailedFundNeed,
        departmentId,
      };
    }

    if (categoryId && categoryId !== "all") {
      where.detailedFundNeed = {
        ...where.detailedFundNeed,
        subProject: {
          project: {
            categoryId,
          },
        },
      };
    }

    if (projectId) {
      where.detailedFundNeed = {
        ...where.detailedFundNeed,
        subProject: {
          projectId,
        },
      };
    }

    if (status && status !== "all") {
      where.status = status;
    }

    // 查询总数
    const total = await prisma.predictRecord.count({
      where,
    });

    // 查询数据
    const records = await prisma.predictRecord.findMany({
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
    const formattedRecords = records.map((record) => ({
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
      submittedAt: record.submittedAt?.toISOString() || new Date().toISOString(),
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
    console.error("Error fetching history records:", error);
    return NextResponse.json(
      { error: "Failed to fetch history records" },
      { status: 500 }
    );
  }
} 