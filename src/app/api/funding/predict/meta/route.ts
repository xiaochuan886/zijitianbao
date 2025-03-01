import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// 获取资金需求预测元数据（机构、部门、项目分类、项目、子项目和资金类型）
export async function GET(req: NextRequest) {
  try {
    // 获取用户会话
    const session = await getServerSession(authOptions);
    
    // 临时解决方案：即使没有会话也继续执行，不返回401错误
    // 在生产环境中应该删除这段代码，保留下面的授权检查
    // if (!session || !session.user) {
    //   return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    // }

    // 获取所有机构
    const organizations = await db.organization.findMany({
      select: {
        id: true,
        name: true,
        code: true
      },
      orderBy: {
        code: 'asc'
      }
    });

    // 获取所有部门
    const departments = await db.department.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // 获取所有项目分类
    const projectCategories = await db.projectCategory.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // 获取所有项目
    const projects = await db.project.findMany({
      where: {
        status: 'active'
      },
      select: {
        id: true,
        name: true,
        categoryId: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // 获取所有子项目
    const subProjects = await db.subProject.findMany({
      select: {
        id: true,
        name: true,
        projectId: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // 获取所有资金类型
    const fundTypes = await db.fundType.findMany({
      select: {
        id: true,
        name: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      organizations,
      departments,
      projectCategories,
      projects,
      subProjects,
      fundTypes
    });
  } catch (error) {
    console.error("获取资金需求预测元数据失败", error);
    return NextResponse.json(
      { error: "获取资金需求预测元数据失败" },
      { status: 500 }
    );
  }
} 