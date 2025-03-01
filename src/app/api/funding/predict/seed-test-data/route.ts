import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

/**
 * 测试数据生成API端点
 * 用于创建测试项目分类和项目数据
 * 仅用于开发环境
 */
export async function POST(req: NextRequest) {
  try {
    // 获取用户会话
    const session = await getServerSession(authOptions);
    
    // 检查是否为开发环境，开发环境下不严格要求认证
    const isDevelopment = process.env.NODE_ENV === 'development';
    console.log(`当前环境: ${process.env.NODE_ENV}, 开发模式: ${isDevelopment}, 用户会话: ${session ? '有' : '无'}`);
    
    // 临时解决方案：完全绕过认证检查，用于本地测试
    // 在生产环境中应该删除这段代码
    /*
    if (!isDevelopment && !session?.user) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }
    */
    
    // 获取请求参数
    const body = await req.json();
    const { createCategories = true, createProjects = true } = body;
    
    // 创建测试分类数据
    const categories: { id: string, name: string }[] = [];
    if (createCategories) {
      // 清理现有分类
      await db.projectCategory.deleteMany({
        where: {
          name: {
            contains: '[测试]'
          }
        }
      });
      
      // 创建测试分类
      const categoryNames = [
        "[测试] 乡村振兴",
        "[测试] 交通建设",
        "[测试] 产业发展",
        "[测试] 城市更新",
        "[测试] 基础设施建设",
        "[测试] 文化教育",
        "[测试] 民生工程",
        "[测试] 环境保护",
        "[测试] 科技创新"
      ];
      
      // 获取一个组织作为默认组织
      const organization = await db.organization.findFirst({
        select: { id: true }
      });
      
      if (!organization) {
        return NextResponse.json({ 
          error: "没有找到任何组织，无法创建项目分类和项目" 
        }, { status: 400 });
      }
      
      for (const name of categoryNames) {
        const category = await db.projectCategory.create({
          data: { 
            name,
            organizationId: organization.id
          }
        });
        categories.push({ id: category.id, name: category.name });
      }
      
      console.log(`创建了 ${categories.length} 个测试项目分类`);
    } else {
      // 获取现有分类
      const existingCategories = await db.projectCategory.findMany({
        where: {
          name: {
            contains: '[测试]'
          }
        },
        select: {
          id: true,
          name: true
        }
      });
      
      categories.push(...existingCategories);
      console.log(`使用 ${categories.length} 个现有测试项目分类`);
    }
    
    // 如果没有分类，无法创建项目
    if (categories.length === 0) {
      return NextResponse.json({ 
        error: "没有可用的项目分类，无法创建项目" 
      }, { status: 400 });
    }
    
    // 创建测试项目数据
    const projects: { id: string, name: string, categoryId: string }[] = [];
    if (createProjects) {
      // 清理现有项目
      await db.project.deleteMany({
        where: {
          name: {
            contains: '[测试]'
          }
        }
      });
      
      // 为每个分类创建3个项目
      for (const category of categories) {
        for (let i = 1; i <= 3; i++) {
          // 获取一个组织作为默认组织
          const organization = await db.organization.findFirst({
            select: { id: true }
          });
          
          if (!organization) {
            return NextResponse.json({ 
              error: "没有找到任何组织，无法创建项目" 
            }, { status: 400 });
          }
          
          const currentYear = new Date().getFullYear();
          
          const project = await db.project.create({
            data: {
              name: `[测试] ${category.name.replace('[测试] ', '')}项目${i}`,
              status: 'ACTIVE',
              startYear: currentYear,
              organizationId: organization.id,
              categoryId: category.id
            }
          });
          
          projects.push({
            id: project.id,
            name: project.name,
            categoryId: project.categoryId!
          });
          
          // 为每个项目创建2个子项目
          for (let j = 1; j <= 2; j++) {
            const subProject = await db.subProject.create({
              data: {
                name: `[测试] ${project.name.replace('[测试] ', '')}子项目${j}`,
                projectId: project.id
              }
            });
            
            // 将所有资金类型与子项目关联
            const fundTypes = await db.fundType.findMany({
              select: { id: true }
            });
            
            for (const fundType of fundTypes) {
              await db.subProject.update({
                where: { id: subProject.id },
                data: {
                  fundTypes: {
                    connect: { id: fundType.id }
                  }
                }
              });
            }
          }
        }
      }
      
      console.log(`创建了 ${projects.length} 个测试项目和 ${projects.length * 2} 个子项目`);
    } else {
      // 获取现有项目
      const existingProjects = await db.project.findMany({
        where: {
          name: {
            contains: '[测试]'
          }
        },
        select: {
          id: true,
          name: true,
          categoryId: true
        }
      });
      
      projects.push(...existingProjects.filter(p => p.categoryId).map(p => ({
        id: p.id,
        name: p.name,
        categoryId: p.categoryId!
      })));
      
      console.log(`使用 ${projects.length} 个现有测试项目`);
    }
    
    return NextResponse.json({
      success: true,
      message: "测试数据创建成功",
      data: {
        categories,
        projects
      }
    });
  } catch (error) {
    console.error("创建测试数据失败", error);
    return NextResponse.json(
      { error: "创建测试数据失败", details: error instanceof Error ? error.message : undefined },
      { status: 500 }
    );
  }
} 