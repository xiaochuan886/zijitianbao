import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * 测试API端点，用于检查项目分类与项目的关联
 * 这个端点仅用于开发和调试
 */
export async function GET(req: NextRequest) {
  try {
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

    // 获取所有项目及其分类关联
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

    // 分析项目分类数据
    const categoryStats = projectCategories.map(category => {
      const projectsInCategory = projects.filter(p => p.categoryId === category.id);
      return {
        category: {
          id: category.id,
          name: category.name
        },
        projectCount: projectsInCategory.length,
        projects: projectsInCategory.map(p => ({ id: p.id, name: p.name }))
      };
    });

    // 查找没有分类的项目
    const projectsWithoutCategory = projects.filter(p => !p.categoryId);

    return NextResponse.json({
      totalCategories: projectCategories.length,
      totalProjects: projects.length,
      projectsWithCategory: projects.length - projectsWithoutCategory.length,
      projectsWithoutCategory: projectsWithoutCategory.length,
      categoryStats,
      projectsWithoutCategoryDetails: projectsWithoutCategory.map(p => ({ id: p.id, name: p.name }))
    });
  } catch (error) {
    console.error("获取项目分类测试数据失败", error);
    return NextResponse.json(
      { error: "获取项目分类测试数据失败" },
      { status: 500 }
    );
  }
} 