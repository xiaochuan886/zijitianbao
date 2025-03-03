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
    const year = searchParams.get("year");
    const months = searchParams.get("months");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const organizationId = searchParams.get("organizationId");
    const departmentId = searchParams.get("departmentId");
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    if (!year || !months) {
      return NextResponse.json(
        { error: "Year and months are required" },
        { status: 400 }
      );
    }

    // 构建查询条件
    const where: any = {
      year: parseInt(year),
      month: {
        lte: parseInt(months),
      },
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
          month: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 查询所有机构和部门
    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        code: "asc",
      },
    });

    const departments = await prisma.department.findMany({
      where: {
        isDeleted: false,
        ...(organizationId && organizationId !== "all"
          ? { organizationId }
          : {}),
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // 转换记录格式
    const formattedRecords = records.map((record) => ({
      id: record.id,
      organization: record.detailedFundNeed.organization.name,
      department: record.detailedFundNeed.department.name,
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