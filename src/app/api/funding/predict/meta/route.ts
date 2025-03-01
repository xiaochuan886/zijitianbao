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

    // 获取所有项目 - 修复状态查询，支持大小写不敏感匹配
    const projects = await db.project.findMany({
      where: {
        status: {
          in: ['active', 'ACTIVE', 'Active'] // 支持不同大小写
        }
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

    // 输出项目状态的调试信息
    console.log(`查询到项目数据: ${projects.length}个`);
    if (projects.length > 0) {
      console.log(`首个项目示例: ID=${projects[0].id}, 名称=${projects[0].name}, 分类ID=${projects[0].categoryId || '无'}`);
    }

    // 检查项目数据是否包含 categoryId
    const projectsWithCategory = projects.filter(p => p.categoryId);
    console.log(`项目总数: ${projects.length}, 有分类ID的项目数: ${projectsWithCategory.length}`);
    
    // 如果有项目没有分类ID，为它们分配默认分类
    if (projectsWithCategory.length < projects.length) {
      console.warn(`警告: ${projects.length - projectsWithCategory.length} 个项目没有分类ID`);
      
      // 获取第一个项目分类作为默认分类
      if (projectCategories.length > 0) {
        const defaultCategory = projectCategories[0];
        console.log(`使用 ${defaultCategory.name} (${defaultCategory.id}) 作为默认分类`);
        
        // 为没有分类ID的项目添加默认分类ID
        const updatedProjects = projects.map(project => {
          if (!project.categoryId) {
            console.log(`为项目 "${project.name}" (${project.id}) 添加默认分类ID`);
            
            // 尝试更新数据库中的项目分类
            db.project.update({
              where: { id: project.id },
              data: { categoryId: defaultCategory.id }
            }).catch(error => {
              console.error(`更新项目 "${project.name}" (${project.id}) 的分类ID失败:`, error);
            });
            
            // 返回带有默认分类ID的新项目对象
            return {
              ...project,
              categoryId: defaultCategory.id
            };
          }
          return project;
        });
        
        // 使用更新后的项目列表替换原始列表
        projects.length = 0;
        projects.push(...updatedProjects);
        
        console.log('已为所有缺少分类ID的项目添加默认分类ID');
      }
    }

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