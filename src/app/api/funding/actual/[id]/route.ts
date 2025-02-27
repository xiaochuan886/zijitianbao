import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 获取用户会话
    const session = await getServerSession(authOptions);
    
    // 检查是否提供了项目ID
    if (!params.id) {
      return NextResponse.json({ error: "缺少项目ID" }, { status: 400 });
    }

    // 获取查询参数
    const searchParams = req.nextUrl.searchParams;
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");
    
    // 计算可填报月份 - 从当前月往前推3个月
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11

    // 默认查询月份为当前月份-1
    const year = yearParam ? parseInt(yearParam) : currentMonth === 0 ? currentYear - 1 : currentYear;
    const month = monthParam ? parseInt(monthParam) : currentMonth === 0 ? 12 : currentMonth;

    // 查询项目信息
    const project = await db.project.findUnique({
      where: {
        id: params.id,
      },
      select: {
        id: true,
        name: true,
        code: true,
        organization: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        departments: {
          select: {
            id: true,
            name: true,
          },
        },
        subProjects: {
          select: {
            id: true,
            name: true,
            fundTypes: {
              select: {
                id: true,
                name: true,
              },
            },
            records: {
              where: {
                year: year,
                month: { in: [month, month - 1, month - 2, month - 3].filter(m => m > 0) }
              },
              orderBy: {
                month: 'desc'
              }
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "项目不存在" }, { status: 404 });
    }

    // 获取所有相关记录的ID
    const recordIds = project.subProjects
      .flatMap(subProject => subProject.records)
      .map((record: any) => record.id);

    // 如果没有记录，需要为指定月份创建新记录
    if (recordIds.length === 0) {
      // 为每个子项目和资金类型创建一条记录
      const records = await Promise.all(
        project.subProjects.map(async (subProject) => {
          // 创建记录
          const record = await db.record.create({
            data: {
              subProjectId: subProject.id,
              year: year,
              month: month,
              status: "draft",
              submittedBy: session?.user?.id || "unknown",
            },
          });
          
          return {
            ...record,
            subProjectId: subProject.id,
          };
        })
      );

      // 重新查询项目信息，包含新创建的记录
      const updatedProject = await db.project.findUnique({
        where: {
          id: params.id,
        },
        select: {
          id: true,
          name: true,
          code: true,
          organization: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          departments: {
            select: {
              id: true,
              name: true,
            },
          },
          subProjects: {
            select: {
              id: true,
              name: true,
              fundTypes: {
                select: {
                  id: true,
                  name: true,
                },
              },
              records: {
                where: {
                  year: year,
                  month: { in: [month, month - 1, month - 2, month - 3].filter(m => m > 0) }
                },
                orderBy: {
                  month: 'desc'
                }
              },
            },
          },
        },
      });

      // 返回项目信息
      return NextResponse.json(updatedProject);
    }

    // 返回项目信息
    return NextResponse.json(project);
  } catch (error) {
    console.error("获取项目详情失败", error);
    return NextResponse.json(
      {
        error: "获取项目详情失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
} 