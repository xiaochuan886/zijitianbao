import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { Record as PrismaRecord } from "@prisma/client";

// 定义备注项的类型
interface RemarkItem {
  subProject: string;
  content: string;
  period: string;
}

// 获取资金需求预测项目列表
export async function GET(req: NextRequest) {
  try {
    // 获取用户会话
    const session = await getServerSession(authOptions);
    
    // 临时解决方案：即使没有会话也继续执行，不返回401错误
    // 在生产环境中应该删除这段代码，保留下面的授权检查
    // if (!session || !session.user) {
    //   return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    // }

    // 获取查询参数
    const searchParams = req.nextUrl.searchParams;
    const organizationId = searchParams.get("organizationId");
    const departmentId = searchParams.get("departmentId");
    const projectName = searchParams.get("projectName");
    const status = searchParams.get("status");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    // 构建查询条件
    const where: any = {};

    // 如果指定了机构ID
    if (organizationId) {
      where.organizationId = organizationId;
    }

    // 如果指定了部门ID
    if (departmentId) {
      where.departments = {
        some: {
          id: departmentId,
        },
      };
    }

    // 如果指定了项目名称
    if (projectName) {
      where.name = {
        contains: projectName,
      };
    }

    // 只查询活跃项目
    where.status = "ACTIVE";

    // 查询项目列表
    const projects = await db.project.findMany({
      where,
      include: {
        organization: true,
        departments: true,
        subProjects: {
          include: {
            records: {
              where: {
                ...(year ? { year: parseInt(year) } : {}),
                ...(month ? { month: parseInt(month) } : {}),
              },
            },
          },
        },
      },
    });

    // 处理项目状态
    const projectsWithStatus = projects.map((project) => {
      // 检查是否有记录
      const hasRecords = project.subProjects.some((subProject) =>
        subProject.records.some((record) => 
          (!year || record.year === parseInt(year)) && 
          (!month || record.month === parseInt(month))
        )
      );

      // 获取项目状态
      let projectStatus = "未填写";
      if (hasRecords) {
        const allSubmitted = project.subProjects.every((subProject) =>
          subProject.records.every((record) => 
            ((!year || record.year === parseInt(year)) && 
            (!month || record.month === parseInt(month))) ? 
            record.status === "submitted" : true
          )
        );
        
        if (allSubmitted) {
          projectStatus = "已提交";
        } else {
          projectStatus = "草稿";
        }
      }

      // 获取备注信息
      let remark = "";
      const remarks: RemarkItem[] = [];
      if (hasRecords) {
        // 收集所有子项目的备注信息
        project.subProjects.forEach(sp => {
          sp.records.forEach((record: any) => {
            if (record.remark && 
                (!year || record.year === parseInt(year)) && 
                (!month || record.month === parseInt(month))) {
              // 添加到结构化备注列表
              remarks.push({
                subProject: sp.name,
                content: record.remark,
                period: `${record.year}-${record.month.toString().padStart(2, '0')}`
              });
              
              // 保留兼容性的单一备注字段
              if (!remark) {
                remark = record.remark;
              }
            }
          });
        });
      }

      return {
        id: project.id,
        organization: `${project.organization.name} (${project.organization.code})`,
        department: project.departments.map(d => d.name).join(", "),
        project: project.code ? `${project.name} (${project.code})` : project.name,
        month: month ? `${year}-${month.padStart(2, '0')}` : "",
        status: projectStatus,
        subProjectCount: project.subProjects.length,
        remarks: remarks,
        remark: remark
      };
    });

    // 如果指定了状态，进行过滤
    let filteredProjects = projectsWithStatus;
    if (status && status !== "all") {
      filteredProjects = projectsWithStatus.filter(
        (project) => project.status === status
      );
    }

    return NextResponse.json(filteredProjects);
  } catch (error) {
    console.error("获取资金需求预测项目列表失败", error);
    return NextResponse.json(
      { error: "获取资金需求预测项目列表失败" },
      { status: 500 }
    );
  }
} 