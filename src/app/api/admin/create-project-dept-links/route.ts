import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { Role } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// 验证请求数据
const requestSchema = z.object({
  defaultDepartmentId: z.string().nullable().optional(),
  forceUpdate: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 验证用户权限
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "需要管理员权限" }, { status: 403 });
    }

    // 解析请求数据
    const body = await request.json();
    const { defaultDepartmentId, forceUpdate = false } = requestSchema.parse(body);

    console.log(`创建项目-部门关联, 默认部门ID: ${defaultDepartmentId || '无'}, 强制更新: ${forceUpdate}`);
    
    // 获取所有项目
    const projects = await prisma.project.findMany({
      where: { status: "ACTIVE" },
      include: {
        departments: true,
      }
    });
    
    console.log(`找到 ${projects.length} 个项目`);
    
    // 获取所有部门
    const departments = await prisma.department.findMany();
    console.log(`找到 ${departments.length} 个部门`);
    
    // 记录操作结果
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    // 为每个项目创建关联
    for (const project of projects) {
      // 检查项目是否已有部门关联
      if (project.departments.length > 0 && !forceUpdate) {
        console.log(`项目 ${project.name} (${project.id}) 已有 ${project.departments.length} 个部门关联，跳过`);
        skipped++;
        continue;
      }
      
      // 如果指定了默认部门ID，则使用它
      if (defaultDepartmentId) {
        // 检查部门是否存在
        const deptExists = departments.some(dept => dept.id === defaultDepartmentId);
        if (!deptExists) {
          console.warn(`指定的默认部门ID ${defaultDepartmentId} 不存在，跳过项目 ${project.name}`);
          skipped++;
          continue;
        }
        
        // 创建关联
        await prisma.project.update({
          where: { id: project.id },
          data: {
            departments: {
              connect: { id: defaultDepartmentId }
            }
          }
        });
        
        console.log(`为项目 ${project.name} (${project.id}) 添加了默认部门 ${defaultDepartmentId}`);
        
        if (project.departments.some(dept => dept.id === defaultDepartmentId)) {
          updated++;
        } else {
          created++;
        }
      } else {
        // 智能匹配：这里我们可以尝试几种匹配策略
        // 1. 基于项目名称匹配部门
        // 2. 随机分配一个部门（作为兜底方案）
        
        let matchFound = false;
        
        // 尝试基于名称匹配
        for (const dept of departments) {
          if (project.name.includes(dept.name) || (dept.name && project.name.includes(dept.name))) {
            // 创建关联
            await prisma.project.update({
              where: { id: project.id },
              data: {
                departments: {
                  connect: { id: dept.id }
                }
              }
            });
            
            console.log(`根据名称匹配，为项目 ${project.name} (${project.id}) 添加了部门 ${dept.name} (${dept.id})`);
            
            if (project.departments.some(d => d.id === dept.id)) {
              updated++;
            } else {
              created++;
            }
            
            matchFound = true;
            break;
          }
        }
        
        // 如果没找到匹配，随机选择一个部门
        if (!matchFound && departments.length > 0) {
          // 简化版：使用第一个部门
          const defaultDept = departments[0];
          
          await prisma.project.update({
            where: { id: project.id },
            data: {
              departments: {
                connect: { id: defaultDept.id }
              }
            }
          });
          
          console.log(`未找到匹配，为项目 ${project.name} (${project.id}) 添加了默认部门 ${defaultDept.name} (${defaultDept.id})`);
          
          if (project.departments.some(d => d.id === defaultDept.id)) {
            updated++;
          } else {
            created++;
          }
        }
      }
    }
    
    // 返回结果
    return NextResponse.json({
      success: true,
      created,
      updated,
      skipped,
      totalProjects: projects.length,
      totalDepartments: departments.length
    });
    
  } catch (error) {
    console.error("创建项目-部门关联失败:", error);
    return NextResponse.json({ 
      error: "创建项目-部门关联失败", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 