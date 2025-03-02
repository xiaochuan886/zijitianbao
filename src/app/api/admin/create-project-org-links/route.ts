import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { Role } from "@/lib/enums";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// 验证请求数据
const requestSchema = z.object({
  defaultOrganizationId: z.string().nullable().optional(),
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
    const { defaultOrganizationId, forceUpdate = false } = requestSchema.parse(body);

    console.log(`创建项目-组织关联, 默认组织ID: ${defaultOrganizationId || '无'}, 强制更新: ${forceUpdate}`);
    
    // 获取所有项目
    const projects = await prisma.project.findMany({
      where: { status: "ACTIVE" },
      include: {
        organizations: true,
      }
    });
    
    console.log(`找到 ${projects.length} 个项目`);
    
    // 获取所有组织
    const organizations = await prisma.organization.findMany();
    console.log(`找到 ${organizations.length} 个组织`);
    
    // 记录操作结果
    let created = 0;
    let updated = 0;
    let skipped = 0;
    
    // 为每个项目创建关联
    for (const project of projects) {
      // 检查项目是否已有组织关联
      if (project.organizations.length > 0 && !forceUpdate) {
        console.log(`项目 ${project.name} (${project.id}) 已有 ${project.organizations.length} 个组织关联，跳过`);
        skipped++;
        continue;
      }
      
      let matchFound = false;
      
      // 1. 优先使用Project表的organizationId字段（如果存在）
      if (project.organizationId) {
        // 查找对应的组织
        const matchingOrg = organizations.find(org => org.id === project.organizationId);
        
        if (matchingOrg) {
          // 创建关联
          await prisma.project.update({
            where: { id: project.id },
            data: {
              organizations: {
                connect: { id: matchingOrg.id }
              }
            }
          });
          
          console.log(`使用项目表organizationId，为项目 ${project.name} (${project.id}) 添加了组织 ${matchingOrg.name} (${matchingOrg.id})`);
          
          if (project.organizations.some(o => o.id === matchingOrg.id)) {
            updated++;
          } else {
            created++;
          }
          
          matchFound = true;
        } else {
          console.log(`项目 ${project.name} 有organizationId (${project.organizationId})，但未找到该组织，尝试其他匹配方式`);
        }
      }
      
      // 2. 尝试基于名称匹配（如果organizationId没有匹配）
      if (!matchFound) {
        for (const org of organizations) {
          // 检查项目名称是否包含组织名称或组织名称包含项目名称
          if (project.name.includes(org.name) || 
              (org.name.length > 2 && project.name.includes(org.name.substring(0, org.name.length - 1)))) {
            
            // 创建关联
            await prisma.project.update({
              where: { id: project.id },
              data: {
                organizations: {
                  connect: { id: org.id }
                }
              }
            });
            
            console.log(`基于名称匹配，为项目 ${project.name} (${project.id}) 添加了组织 ${org.name} (${org.id})`);
            
            if (project.organizations.some(o => o.id === org.id)) {
              updated++;
            } else {
              created++;
            }
            
            matchFound = true;
            break;
          }
        }
      }
      
      // 3. 如果指定了默认组织ID，则使用它
      if (!matchFound && defaultOrganizationId) {
        // 检查组织是否存在
        const orgExists = organizations.some(org => org.id === defaultOrganizationId);
        if (!orgExists) {
          console.warn(`指定的默认组织ID ${defaultOrganizationId} 不存在，跳过项目 ${project.name}`);
          skipped++;
          continue;
        }
        
        // 创建关联
        await prisma.project.update({
          where: { id: project.id },
          data: {
            organizations: {
              connect: { id: defaultOrganizationId }
            }
          }
        });
        
        console.log(`为项目 ${project.name} (${project.id}) 添加了指定的默认组织 ${defaultOrganizationId}`);
        
        if (project.organizations.some(org => org.id === defaultOrganizationId)) {
          updated++;
        } else {
          created++;
        }
        
        matchFound = true;
      }
      
      // 4. 继续尝试基于代码匹配
      if (!matchFound && project.code) {
        for (const org of organizations) {
          if (org.code && project.code.startsWith(org.code)) {
            // 创建关联
            await prisma.project.update({
              where: { id: project.id },
              data: {
                organizations: {
                  connect: { id: org.id }
                }
              }
            });
            
            console.log(`根据代码匹配，为项目 ${project.name} (${project.id}) 添加了组织 ${org.name} (${org.id})`);
            
            if (project.organizations.some(o => o.id === org.id)) {
              updated++;
            } else {
              created++;
            }
            
            matchFound = true;
            break;
          }
        }
      }
      
      // 5. 如果仍未找到匹配，并且未指定默认组织，则尝试分配第一个组织
      if (!matchFound && organizations.length > 0) {
        // 查找与项目代码前缀最相似的组织
        let bestMatchOrg = organizations[0];
        let bestMatchScore = 0;
        
        if (project.code) {
          for (const org of organizations) {
            if (org.code) {
              // 计算共同前缀长度
              let commonPrefixLength = 0;
              const minLength = Math.min(project.code.length, org.code.length);
              
              for (let i = 0; i < minLength; i++) {
                if (project.code[i] === org.code[i]) {
                  commonPrefixLength++;
                } else {
                  break;
                }
              }
              
              if (commonPrefixLength > bestMatchScore) {
                bestMatchScore = commonPrefixLength;
                bestMatchOrg = org;
              }
            }
          }
        }
        
        await prisma.project.update({
          where: { id: project.id },
          data: {
            organizations: {
              connect: { id: bestMatchOrg.id }
            }
          }
        });
        
        if (bestMatchScore > 0) {
          console.log(`基于代码前缀最佳匹配(${bestMatchScore}字符)，为项目 ${project.name} (${project.id}) 添加了组织 ${bestMatchOrg.name} (${bestMatchOrg.id})`);
        } else {
          console.log(`未找到匹配，为项目 ${project.name} (${project.id}) 添加了备选组织 ${bestMatchOrg.name} (${bestMatchOrg.id})`);
        }
        
        if (project.organizations.some(o => o.id === bestMatchOrg.id)) {
          updated++;
        } else {
          created++;
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
      totalOrganizations: organizations.length
    });
    
  } catch (error) {
    console.error("创建项目-组织关联失败:", error);
    return NextResponse.json({ 
      error: "创建项目-组织关联失败", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 