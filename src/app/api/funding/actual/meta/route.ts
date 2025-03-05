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
    const projectCategories = await prisma.projectCategory.findMany({
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
    
    // 记录项目分类信息，用于调试
    console.log(`获取到 ${projects.length} 个项目，其中 ${projects.filter(p => p.categoryId).length} 个有分类ID`);
    if (projects.length > 0 && projects.some(p => p.categoryId)) {
      const categoryIds = Array.from(new Set(projects.map(p => p.categoryId).filter(Boolean)));
      console.log(`项目中存在的分类ID: ${categoryIds.join(', ')}`);
    }
    
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
      projectCategories,
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