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

    return NextResponse.json({
      organizations,
      departments,
      categories,
      projects,
      subProjects,
      fundTypes
    });
  } catch (error) {
    console.error("获取元数据失败", error);
    return NextResponse.json(
      { error: "获取元数据失败" },
      { status: 500 }
    );
  }
} 