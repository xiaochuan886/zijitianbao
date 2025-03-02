import { NextRequest, NextResponse } from 'next/server'
import { ProjectService } from '@/lib/services/project.service'
import { ProjectStatus } from '@prisma/client'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-options'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const projectService = new ProjectService()

// 项目创建验证模式
const projectCreateSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(50),
  startYear: z.number().min(2000).max(2100),
  categoryId: z.string().optional(),
  subProjects: z.array(z.object({
    name: z.string().min(2),
    detailedFundNeeds: z.array(z.object({
      organizationId: z.string(),
      departmentId: z.string(),
      fundTypeId: z.string()
    })).min(1)
  })).min(1)
})

// GET /api/projects - 获取项目列表
export async function GET(req: NextRequest) {
  try {
    // 使用getServerSession替代parseSession进行权限检查
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ message: '未授权访问' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '10')
    const search = searchParams.get('search') || ''
    const organizationId = searchParams.get('organizationId') || undefined
    const status = searchParams.get('status') as ProjectStatus | undefined
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

    const result = await projectService.findAll(
      { page, pageSize },
      { 
        search, 
        filters: {
          organizationId,
          status
        },
        sorting: {
          field: sortBy,
          order: sortOrder
        }
      }
    )

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { message: error.message || '获取项目列表失败' },
      { status: error.statusCode || 500 }
    )
  }
}

// POST /api/projects - 创建项目
export async function POST(req: NextRequest) {
  try {
    // 使用getServerSession替代parseSession进行权限检查
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ message: '未授权访问' }, { status: 401 });
    }

    const body = await req.json()
    console.log('接收到的项目数据:', body)
    
    // 验证请求数据
    const validationResult = projectCreateSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: '数据验证失败', 
        details: validationResult.error.format() 
      }, { status: 400 })
    }
    
    const { name, code, startYear, categoryId, subProjects } = validationResult.data
    
    // 检查项目名称是否已存在
    const existingProject = await prisma.project.findFirst({
      where: { 
        OR: [
          { name },
          { code }
        ]
      }
    })
    
    if (existingProject) {
      return NextResponse.json({ 
        error: '项目已存在', 
        details: existingProject.name === name ? '项目名称已存在' : '项目编码已存在' 
      }, { status: 400 })
    }
    
    // 创建项目及其子项目
    const project = await prisma.project.create({
      data: {
        name,
        code,
        startYear,
        categoryId: categoryId || null,
        status: 'ACTIVE',
        subProjects: {
          create: subProjects.map(subProject => ({
            name: subProject.name
          }))
        }
      },
      include: {
        subProjects: true
      }
    })
    
    // 创建子项目的资金需求明细
    for (let i = 0; i < subProjects.length; i++) {
      const subProject = subProjects[i]
      const createdSubProject = project.subProjects[i]
      
      // 为每个子项目创建资金需求明细
      for (const need of subProject.detailedFundNeeds) {
        await prisma.detailedFundNeed.create({
          data: {
            subProjectId: createdSubProject.id,
            departmentId: need.departmentId,
            fundTypeId: need.fundTypeId,
            organizationId: need.organizationId,
            isActive: true
          }
        })
      }
    }
    
    return NextResponse.json({ 
      message: '项目创建成功', 
      project: {
        id: project.id,
        name: project.name,
        code: project.code
      }
    })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { message: error.message || '创建项目失败' },
      { status: error.statusCode || 500 }
    )
  }
}

// 更新项目
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 });
    }
    
    const body = await req.json();
    
    // 验证请求数据
    const validationResult = projectCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: '数据验证失败', 
        details: validationResult.error.format() 
      }, { status: 400 });
    }
    
    const { id, name, code, startYear, categoryId, subProjects } = body;
    
    if (!id) {
      return NextResponse.json({ error: '缺少项目ID' }, { status: 400 });
    }
    
    // 检查项目是否存在
    const existingProject = await prisma.project.findUnique({
      where: { id },
      include: {
        subProjects: {
          include: {
            detailedFundNeeds: true
          }
        }
      }
    });
    
    if (!existingProject) {
      return NextResponse.json({ error: '项目不存在' }, { status: 404 });
    }
    
    // 检查项目名称或编码是否与其他项目冲突
    const conflictProject = await prisma.project.findFirst({
      where: { 
        OR: [
          { name, id: { not: id } },
          { code, id: { not: id } }
        ]
      }
    });
    
    if (conflictProject) {
      return NextResponse.json({ 
        error: '项目信息冲突', 
        details: conflictProject.name === name ? '项目名称已存在' : '项目编码已存在' 
      }, { status: 400 });
    }
    
    // 更新项目基本信息
    await prisma.project.update({
      where: { id },
      data: {
        name,
        code,
        startYear,
        categoryId: categoryId || null
      }
    });
    
    // 处理子项目更新
    // 1. 获取现有子项目ID列表
    const existingSubProjectIds = existingProject.subProjects.map(sp => sp.id);
    const existingSubProjectMap = new Map(
      existingProject.subProjects.map(sp => [sp.name, sp])
    );
    
    // 2. 处理每个子项目
    for (const subProject of subProjects) {
      // 检查子项目是否已存在（通过名称匹配）
      const existingSubProject = existingSubProjectMap.get(subProject.name);
      
      if (existingSubProject) {
        // 子项目已存在，更新资金需求明细
        
        // 获取现有资金需求明细
        const existingNeeds = existingSubProject.detailedFundNeeds;
        const existingNeedsMap = new Map();
        
        // 创建查找键：departmentId-fundTypeId-organizationId
        existingNeeds.forEach(need => {
          const key = `${need.departmentId}-${need.fundTypeId}-${need.organizationId}`;
          existingNeedsMap.set(key, need);
        });
        
        // 处理新的资金需求明细
        for (const need of subProject.detailedFundNeeds) {
          const key = `${need.departmentId}-${need.fundTypeId}-${need.organizationId}`;
          
          if (!existingNeedsMap.has(key)) {
            // 创建新的资金需求明细
            await prisma.detailedFundNeed.create({
              data: {
                subProjectId: existingSubProject.id,
                departmentId: need.departmentId,
                fundTypeId: need.fundTypeId,
                organizationId: need.organizationId,
                isActive: true
              }
            });
          }
          
          // 从Map中移除已处理的需求
          existingNeedsMap.delete(key);
        }
        
        // 删除不再需要的资金需求明细
        for (const need of Array.from(existingNeedsMap.values())) {
          await prisma.detailedFundNeed.delete({
            where: { id: need.id }
          });
        }
        
        // 从待处理列表中移除已处理的子项目
        existingSubProjectMap.delete(subProject.name);
      } else {
        // 创建新的子项目
        const newSubProject = await prisma.subProject.create({
          data: {
            name: subProject.name,
            projectId: id
          }
        });
        
        // 创建资金需求明细
        for (const need of subProject.detailedFundNeeds) {
          await prisma.detailedFundNeed.create({
            data: {
              subProjectId: newSubProject.id,
              departmentId: need.departmentId,
              fundTypeId: need.fundTypeId,
              organizationId: need.organizationId,
              isActive: true
            }
          });
        }
      }
    }
    
    // 删除不再需要的子项目
    for (const subProject of Array.from(existingSubProjectMap.values())) {
      // 先删除关联的资金需求明细
      await prisma.detailedFundNeed.deleteMany({
        where: { subProjectId: subProject.id }
      });
      
      // 然后删除子项目
      await prisma.subProject.delete({
        where: { id: subProject.id }
      });
    }
    
    return NextResponse.json({ 
      message: '项目更新成功', 
      project: {
        id,
        name,
        code
      }
    });
  } catch (error) {
    console.error('更新项目失败:', error);
    return NextResponse.json({ error: '更新项目失败' }, { status: 500 });
  }
}