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
    
    // 状态筛选
    let recordWhere: any = {
      year,
      month
    };
    
    if (status && status !== "all") {
      recordWhere.status = status;
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
          where: recordWhere,
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
    
    // 转换为前端需要的格式
    const projects = subProjects.map(subProject => {
      // 获取记录，如果没有记录，则创建一个空记录对象
      const record = subProject.records[0] || {
        id: '',
        year,
        month,
        actualUser: null,
        actualFinance: null,
        status: 'draft',
        remark: '',
        updatedAt: new Date()
      };
      
      return {
        id: subProject.id,
        name: `${subProject.project.name} - ${subProject.name}`,
        year: record.year,
        month: record.month,
        organization: subProject.project.organization,
        department: subProject.project.departments[0], // 只取第一个部门
        status: record.status,
        actualUser: record.actualUser,
        actualFinance: record.actualFinance,
        remark: record.remark,
        updatedAt: record.updatedAt,
        recordId: record.id
      };
    });
    
    // 根据是否为用户报表过滤显示金额
    const filteredProjects = isUserReport 
      ? projects 
      : projects;
    
    return NextResponse.json({
      projects: filteredProjects,
      total: filteredProjects.length,
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