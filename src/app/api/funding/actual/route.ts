import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

/**
 * 获取实际支付项目列表
 * 支持按年份、月份、组织、部门、项目名称和状态筛选
 */
export async function GET(req: NextRequest) {
  try {
    // 获取用户会话
    const session = await getServerSession(authOptions);
    
    // 获取查询参数
    const searchParams = req.nextUrl.searchParams;
    const yearParam = searchParams.get("year");
    const monthParam = searchParams.get("month");
    const organizationId = searchParams.get("organizationId");
    const departmentId = searchParams.get("departmentId");
    const projectName = searchParams.get("projectName");
    const status = searchParams.get("status");
    const isUserReport = searchParams.get("isUserReport") === "true";
    
    // 默认查询当前月份
    const now = new Date();
    const year = yearParam ? parseInt(yearParam) : now.getFullYear();
    const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1; // getMonth() 返回 0-11

    console.log(`查询参数: year=${year}, month=${month}, isUserReport=${isUserReport}, organizationId=${organizationId}, departmentId=${departmentId}, projectName=${projectName}, status=${status}`);

    // 构建子项目查询条件
    const subProjectWhere: any = {};
    
    // 项目名称筛选
    if (projectName) {
      subProjectWhere.OR = [
        { name: { contains: projectName } },
        { project: { name: { contains: projectName } } },
        { project: { code: { contains: projectName } } }
      ];
    }
    
    // 组织筛选
    if (organizationId && organizationId !== "all") {
      subProjectWhere.project = {
        ...subProjectWhere.project,
        organizationId
      };
    }
    
    // 部门筛选
    if (departmentId && departmentId !== "all") {
      subProjectWhere.project = {
        ...subProjectWhere.project,
        departments: {
          some: {
            id: departmentId
          }
        }
      };
    }
    
    // 查询子项目及其记录
    const subProjects = await db.subProject.findMany({
      where: subProjectWhere,
      select: {
        id: true,
        name: true,
        project: {
          select: {
            id: true,
            name: true,
            code: true,
            organization: {
              select: {
                id: true,
                name: true
              }
            },
            departments: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        records: {
          where: {
            year,
            month,
            ...(status && status !== "all" ? { status } : {})
          },
          select: {
            id: true,
            year: true,
            month: true,
            actualUser: true,
            actualFinance: true,
            status: true,
            remark: true,
            updatedAt: true
          }
        }
      },
      orderBy: [
        { project: { organization: { name: 'asc' } } },
        { project: { name: 'asc' } },
        { name: 'asc' }
      ]
    });
    
    console.log(`查询到 ${subProjects.length} 个子项目`);
    
    // 创建不存在的记录
    const projectsWithRecords = await Promise.all(subProjects.map(async (subProject) => {
      // 如果子项目没有对应的记录，创建一条新记录
      if (subProject.records.length === 0) {
        console.log(`为子项目 ${subProject.id} (${subProject.name}) 创建新记录, 年份=${year}, 月份=${month}`);
        
        try {
          const newRecord = await db.record.create({
            data: {
              subProjectId: subProject.id,
              year,
              month,
              status: "draft",
              actualUser: null,
              actualFinance: null,
              submittedBy: session?.user?.id || "unknown",
            },
          });
          
          // 将新创建的记录添加到子项目的记录中
          subProject.records = [newRecord];
        } catch (error) {
          console.error(`创建记录失败: ${error instanceof Error ? error.message : String(error)}`);
          // 如果创建失败，添加一个空记录
          subProject.records = [{
            id: '',
            year,
            month,
            actualUser: null,
            actualFinance: null,
            status: 'draft',
            remark: '',
            updatedAt: new Date()
          }];
        }
      }
      
      return subProject;
    }));
    
    // 转换为前端需要的格式
    const projects = projectsWithRecords.map(subProject => {
      // 获取记录，现在每个子项目都应该有至少一条记录
      const record = subProject.records[0];
      
      const department = subProject.project.departments[0] || null;
      
      const result = {
        id: subProject.id,
        name: `${subProject.project.name} - ${subProject.name}`,
        year: record.year,
        month: record.month,
        organization: subProject.project.organization,
        department,
        status: record.status || "draft",
        actualUser: isUserReport ? record.actualUser : null,
        actualFinance: !isUserReport ? record.actualFinance : null,
        remark: record.remark || "",
        updatedAt: record.updatedAt,
        recordId: record.id
      };
      
      return result;
    });
    
    console.log(`处理后返回 ${projects.length} 个项目`);
    
    return NextResponse.json({
      projects,
      total: projects.length,
      year,
      month
    });
  } catch (error) {
    console.error("获取实际支付项目列表失败", error);
    return NextResponse.json(
      {
        error: "获取实际支付项目列表失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
} 