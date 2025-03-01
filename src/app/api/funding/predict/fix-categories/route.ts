import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

/**
 * 修复API端点，用于重置并正确设置项目的分类关联
 * 这个端点仅用于管理员使用
 */
export async function POST(req: NextRequest) {
  try {
    // 获取用户会话，确保是管理员
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }
    
    // 检查是否为管理员
    const user = await db.user.findUnique({
      where: { email: session.user.email! },
      select: { role: true }
    });
    
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }
    
    // 获取请求体中的参数
    const body = await req.json();
    const { defaultCategoryId } = body;
    
    if (!defaultCategoryId) {
      return NextResponse.json({ error: "缺少必要的参数: defaultCategoryId" }, { status: 400 });
    }
    
    // 确认分类存在
    const category = await db.projectCategory.findUnique({
      where: { id: defaultCategoryId }
    });
    
    if (!category) {
      return NextResponse.json({ error: `找不到指定的分类ID: ${defaultCategoryId}` }, { status: 404 });
    }
    
    // 获取所有没有分类的项目
    const projectsWithoutCategory = await db.project.findMany({
      where: {
        categoryId: null
      },
      select: {
        id: true,
        name: true
      }
    });
    
    // 更新这些项目
    const updatePromises = projectsWithoutCategory.map(project => 
      db.project.update({
        where: { id: project.id },
        data: { categoryId: defaultCategoryId }
      })
    );
    
    // 等待所有更新完成
    await Promise.all(updatePromises);
    
    return NextResponse.json({
      success: true,
      message: `已成功为 ${projectsWithoutCategory.length} 个项目设置分类`,
      defaultCategory: category.name,
      updatedProjects: projectsWithoutCategory.map(p => p.name)
    });
  } catch (error) {
    console.error("修复项目分类关联失败", error);
    return NextResponse.json(
      { error: "修复项目分类关联失败", details: error instanceof Error ? error.message : undefined },
      { status: 500 }
    );
  }
} 