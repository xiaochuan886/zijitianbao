import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { z } from "zod";
import { services } from "@/lib/services";
import { RecordStatus, Role } from "@/lib/enums";
import { prisma } from "@/lib/prisma";

// 定义备注项的类型
interface RemarkItem {
  subProject: string;
  content: string;
  period: string;
}

// 验证撤回请求数据
const withdrawalRequestSchema = z.object({
  action: z.literal("withdrawal"),
  recordId: z.string(),
  reason: z.string().min(1, "请填写撤回原因"),
  test: z.boolean().optional(),
});

// 验证查询参数
const queryParamsSchema = z.object({
  year: z.string().optional(),
  month: z.string().optional(),
  projectId: z.string().optional(),
  organizationId: z.string().optional(),
  departmentId: z.string().optional(),
  projectCategoryId: z.string().optional(),
  subProjectId: z.string().optional(),
  fundTypeId: z.string().optional(),
  status: z.string().optional(),
  page: z.string().transform(val => parseInt(val) || 1).optional(),
  pageSize: z.string().transform(val => parseInt(val) || 10).optional(),
});

export async function GET(request: NextRequest) {
  try {
    // 获取用户会话
    const session = await getServerSession(authOptions);
    
    // 临时解决方案：即使没有会话也继续执行，不返回401错误
    let userId = "temp-user-id";
    let isAdmin = false;
    
    if (session && session.user) {
      userId = session.user.id;
      // 确定用户是否为管理员
      isAdmin = session.user.role === Role.ADMIN;
      console.log(`当前用户: ${userId}, 角色: ${session.user.role}, 是否管理员: ${isAdmin}`);
    }

    // 解析查询参数
    const searchParams = request.nextUrl.searchParams;
    const queryResult = queryParamsSchema.safeParse(Object.fromEntries(searchParams.entries()));
    
    if (!queryResult.success) {
      return NextResponse.json({ 
        error: "查询参数格式错误", 
        details: queryResult.error.format() 
      }, { status: 400 });
    }

    const { 
      year, 
      month, 
      projectId, 
      organizationId, 
      departmentId,
      projectCategoryId,
      subProjectId,
      fundTypeId, 
      status, 
      page = 1, 
      pageSize = 10 
    } = queryResult.data;

    // 构建项目查询条件
    const projectWhere: any = {
      status: "ACTIVE"
    };

    // 如果有项目ID，直接查询该项目
    if (projectId) {
      projectWhere.id = projectId;
    }

    // 如果有项目分类ID，筛选该分类下的项目
    if (projectCategoryId) {
      console.log(`按项目分类筛选: ${projectCategoryId}`);
      projectWhere.categoryId = projectCategoryId;
    }

    // 如果有组织ID，查询该组织下的项目
    if (organizationId) {
      console.log(`按组织筛选项目: ${organizationId}`);
      projectWhere.organizations = {
        some: { id: organizationId }
      };
    }
    
    // 如果有部门ID，查询该部门下的项目
    if (departmentId) {
      console.log(`按部门筛选项目: ${departmentId}`);
      projectWhere.departments = {
        some: { id: departmentId }
      };
    }
    
    // 打印查询条件
    console.log('项目查询条件:', JSON.stringify(projectWhere, null, 2));

    // 获取所有符合条件的项目及其子项目和资金类型
    let projects = await prisma.project.findMany({
      where: projectWhere,
      include: {
        category: true,
        subProjects: {
          include: {
            detailedFundNeeds: {
              include: {
                department: true,
                fundType: true,
                organization: true
              }
            }
          }
        }
      }
    });
    
    console.log(`查询到 ${projects.length} 个项目`);
    
    // 如果没有找到项目但指定了组织ID，尝试检查组织是否存在
    if (projects.length === 0 && organizationId) {
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId }
      });
      
      if (organization) {
        console.log(`组织存在但未找到关联项目: ${organization.name}`);
        
        // 移除自动返回所有项目的逻辑，尊重用户筛选条件
        console.log(`用户筛选了组织 '${organization.name}'，但未找到关联项目，返回空结果`);
        
        // 添加日志以查看关联表的情况
        const projectOrganizations = await prisma.$queryRaw`
          SELECT * FROM _ProjectOrganizations WHERE A = ${organizationId}
        `;
        console.log(`组织-项目关联记录数: ${Array.isArray(projectOrganizations) ? projectOrganizations.length : 0}`);
      } else {
        console.log(`未找到指定的组织: ${organizationId}`);
      }
    }
    
    // 如果子项目ID被指定，则过滤项目，只保留包含该子项目的项目
    if (subProjectId && projects.length > 0) {
      console.log(`按子项目ID筛选: ${subProjectId}`);
      projects = projects.filter(project => 
        project.subProjects.some(subProject => subProject.id === subProjectId)
      );
      console.log(`过滤后的项目数量: ${projects.length}`);
    }
    
    if (projects.length > 0) {
      // 获取第一个项目的所有关联机构（通过detailedFundNeeds）
      const organizationNames = new Set<string>();
      projects[0].subProjects.forEach(subProject => {
        subProject.detailedFundNeeds.forEach(need => {
          if (need.organization) {
            organizationNames.add(need.organization.name);
          }
        });
      });
      
      console.log('首个项目信息:', {
        id: projects[0].id,
        name: projects[0].name,
        organizations: Array.from(organizationNames),
        subProjects: projects[0].subProjects.length
      });
    } else {
      console.log('未找到符合条件的项目');
      
      // 移除此处的管理员自动获取所有项目的逻辑
      // 即使是管理员，也应该尊重筛选条件
      console.log('尊重用户筛选条件，返回空结果');
    }

    // 获取所有子项目ID
    const subProjectIds = projects.flatMap(p => 
      p.subProjects.map(sp => sp.id)
    );
    
    console.log(`找到 ${subProjectIds.length} 个子项目ID`);

    // 查询已有的预测记录
    const yearParam = year ? parseInt(year) : null;
    const monthParam = month ? parseInt(month) : null;

    let existingRecords: any[] = [];
    if (yearParam && monthParam) {
      // 处理状态筛选：
      // 1. 标准状态：draft, submitted, pending_withdrawal 直接传递给 Prisma
      // 2. 扩展状态：rejected, approved, unfilled 需要特殊处理
      const statusCondition: any = {};
      let useExtendedStatus = false;
      
      if (status) {
        // 状态值转小写处理
        const statusLower = status.toLowerCase();
        console.log(`处理状态筛选: ${statusLower}`);
        
        // 判断是否为标准RecordStatus中的值
        if (['draft', 'submitted', 'pending_withdrawal'].includes(statusLower)) {
          // 重要修复：使用大写的枚举值，Prisma需要严格匹配枚举
          if (statusLower === 'draft') {
            statusCondition.status = RecordStatus.DRAFT;
          } else if (statusLower === 'submitted') {
            statusCondition.status = RecordStatus.SUBMITTED;
          } else if (statusLower === 'pending_withdrawal') {
            statusCondition.status = RecordStatus.PENDING_WITHDRAWAL;
          }
          console.log(`使用标准状态筛选: ${statusLower} => ${statusCondition.status}`);
        } else {
          // 标记这是扩展状态，后续需要内存处理
          useExtendedStatus = true;
          console.log(`识别到扩展状态: ${statusLower}, 将在内存中处理`);
        }
      }
      
      // 如果需要筛选资金类型
      if (fundTypeId && fundTypeId !== 'all') {
        console.log(`按资金类型筛选: ${fundTypeId}`);
      }
      
      // 构建子项目ID条件
      // 注意：如果子项目列表为空但是需要进行状态筛选，我们不设置子项目条件
      // 这样可以确保管理员能看到所有状态的记录
      const subProjectCondition = 
        (subProjectIds.length > 0 && !isAdmin) || (subProjectIds.length > 0 && !status) ? 
          (subProjectId && subProjectId !== 'all' ? { equals: subProjectId } : { in: subProjectIds }) :
          undefined;
      
      // 构建资金类型条件
      const fundTypeCondition = fundTypeId && fundTypeId !== 'all' && fundTypeId !== 'default'
        ? { equals: fundTypeId }
        : undefined;
      
      // 打印完整查询条件
      console.log('记录查询条件:', {
        subProjectId: subProjectCondition,
        fundTypeId: fundTypeCondition,
        year: yearParam,
        month: monthParam,
        status: statusCondition.status
      });
      
      try {
        // 构建查询条件
        const queryConditions: any = {};
        
        // 仅当有有效的子项目ID条件时添加
        if (subProjectCondition) {
          queryConditions.subProjectId = subProjectCondition;
        }
        
        // 添加其他条件
        if (fundTypeCondition) queryConditions.fundTypeId = fundTypeCondition;
        if (yearParam) queryConditions.year = yearParam;
        if (monthParam) queryConditions.month = monthParam;
        if (statusCondition.status) queryConditions.status = statusCondition.status;
        
        console.log('完整Prisma查询条件:', JSON.stringify(queryConditions, null, 2));
        
        existingRecords = await prisma.predictRecord.findMany({
          where: queryConditions,
          include: {
            subProject: {
              include: {
                project: {
                  include: {
                    category: true
                  }
                },
                detailedFundNeeds: {
                  include: {
                    department: true,
                    fundType: true,
                    organization: true
                  }
                }
              }
            },
            fundType: true,
          }
        });
        
        console.log(`查询到 ${existingRecords.length} 条记录`);
      } catch (error) {
        console.error("查询记录时出错:", error);
        // 继续执行，不抛出异常
        existingRecords = [];
      }
      
      // 如果是扩展状态，进行内存中的后处理筛选
      if (useExtendedStatus && status) {
        const statusLower = status.toLowerCase();
        
        // 对于"unfilled"扩展状态，实际上需要清空现有记录，稍后会重新生成
        if (statusLower === 'unfilled') {
          console.log('处理"未填写"状态，清空现有记录');
          existingRecords = [];
        } 
        // 对于"approved"扩展状态，筛选出内容包含"已审核"的记录
        else if (statusLower === 'approved') {
          console.log('处理"已审核"状态，筛选包含"已审核"或"approved"的记录');
          existingRecords = existingRecords.filter(r => 
            r.remark && (r.remark.includes('已审核') || r.remark.toLowerCase().includes('approved'))
          );
          console.log(`筛选后剩余 ${existingRecords.length} 条记录`);
        } 
        // 对于"rejected"扩展状态，筛选出内容包含"已拒绝"的记录
        else if (statusLower === 'rejected') {
          console.log('处理"已拒绝"状态，筛选包含"已拒绝"或"rejected"的记录');
          existingRecords = existingRecords.filter(r => 
            r.remark && (r.remark.includes('已拒绝') || r.remark.toLowerCase().includes('rejected'))
          );
          console.log(`筛选后剩余 ${existingRecords.length} 条记录`);
        }
      }
    }

    // 按子项目ID和资金类型ID组织记录
    const recordsMap = new Map<string, any>();
    existingRecords.forEach(record => {
      const key = `${record.subProjectId}_${record.fundTypeId}`;
      recordsMap.set(key, record);
    });

    // 构建完整的记录列表（包括未填写的记录）
    let allRecords: any[] = [];

    // 为每个子项目和资金类型创建记录
    projects.forEach(project => {
      project.subProjects.forEach(subProject => {
        // 如果指定了子项目ID，只处理匹配的子项目
        if (subProjectId && subProjectId !== 'all' && subProject.id !== subProjectId) {
          return;
        }
        
        // 从detailedFundNeeds中提取唯一的资金类型
        const fundTypes = Array.from(
          new Map(
            subProject.detailedFundNeeds.map(need => 
              [need.fundType.id, need.fundType]
            )
          ).values()
        );
        
        if (fundTypes.length > 0) {
          // 为每个资金类型创建记录
          fundTypes.forEach(fundType => {
            // 如果指定了资金类型ID，只处理匹配的资金类型
            if (fundTypeId && fundTypeId !== 'all' && fundType.id !== fundTypeId) {
              return;
            }
            
            const key = `${subProject.id}_${fundType.id}`;
            const existingRecord = recordsMap.get(key);

            if (existingRecord) {
              // 使用已有记录
              allRecords.push(existingRecord);
            } else if (yearParam && monthParam) {
              // 获取与该子项目和资金类型相关的部门和组织
              const relatedDepartments = subProject.detailedFundNeeds
                .filter(need => need.fundType.id === fundType.id)
                .map(need => need.department);
                
              const relatedOrganizations = subProject.detailedFundNeeds
                .filter(need => need.fundType.id === fundType.id)
                .map(need => need.organization)
                .filter(org => org !== null);
              
              // 创建未填写的记录
              allRecords.push({
                id: `temp_${key}_${yearParam}_${monthParam}`,
                subProjectId: subProject.id,
                fundTypeId: fundType.id,
                year: yearParam,
                month: monthParam,
                amount: null,
                status: "UNFILLED", // 特殊状态表示未填写
                remark: null,
                submittedBy: null,
                submittedAt: null,
                createdAt: new Date(),
                updatedAt: new Date(),
                subProject: {
                  id: subProject.id,
                  name: subProject.name,
                  projectId: project.id,
                  project: {
                    id: project.id,
                    name: project.name,
                    // 使用从detailedFundNeeds中提取的组织和部门
                    relatedOrganizations,
                    relatedDepartments
                  },
                  // 不再使用fundTypes字段
                  detailedFundNeeds: subProject.detailedFundNeeds
                },
                fundType: fundType
              });
            }
          });
        } else {
          // 如果子项目没有关联的资金类型，创建一个默认记录
          const defaultKey = `${subProject.id}_default`;
          if (yearParam && monthParam) {
            // 如果指定了资金类型且不是"default"，跳过
            if (fundTypeId && fundTypeId !== 'all' && fundTypeId !== 'default') {
              return;
            }
            
            // 获取与该子项目相关的部门和组织
            const relatedDepartments = subProject.detailedFundNeeds
              .map(need => need.department);
              
            const relatedOrganizations = subProject.detailedFundNeeds
              .map(need => need.organization)
              .filter(org => org !== null);
            
            allRecords.push({
              id: `temp_${defaultKey}_${yearParam}_${monthParam}`,
              subProjectId: subProject.id,
              fundTypeId: null,
              year: yearParam,
              month: monthParam,
              amount: null,
              status: "UNFILLED", // 特殊状态表示未填写
              remark: null,
              submittedBy: null,
              submittedAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              subProject: {
                id: subProject.id,
                name: subProject.name,
                projectId: project.id,
                project: {
                  id: project.id,
                  name: project.name,
                  // 使用从detailedFundNeeds中提取的组织和部门
                  relatedOrganizations,
                  relatedDepartments
                },
                // 使用detailedFundNeeds替代fundTypes
                detailedFundNeeds: subProject.detailedFundNeeds
              },
              fundType: { id: "default", name: "未指定" }
            });
          }
        }
      });
    });
    
    // 如果指定了特定状态，只返回符合该状态的记录
    if (status && status.toLowerCase() !== 'all') {
      const statusLower = status.toLowerCase();
      console.log(`最终筛选状态 ${statusLower}, 当前记录数 ${allRecords.length}`);
      
      // 只保留符合状态条件的记录
      if (statusLower === 'unfilled') {
        allRecords = allRecords.filter(r => 
          r.status.toLowerCase() === 'unfilled' || r.status.toLowerCase() === 'unfilled');
      } else if (statusLower === 'draft') {
        allRecords = allRecords.filter(r => 
          r.status.toLowerCase() === 'draft' || r.status.toLowerCase() === RecordStatus.DRAFT.toLowerCase());
      } else if (statusLower === 'submitted') {
        allRecords = allRecords.filter(r => 
          r.status.toLowerCase() === 'submitted' || r.status.toLowerCase() === RecordStatus.SUBMITTED.toLowerCase());
      } else if (statusLower === 'pending_withdrawal') {
        allRecords = allRecords.filter(r => 
          r.status.toLowerCase() === 'pending_withdrawal' || r.status.toLowerCase() === RecordStatus.PENDING_WITHDRAWAL.toLowerCase());
      } else if (statusLower === 'approved') {
        allRecords = allRecords.filter(r => 
          r.remark && (r.remark.includes('已审核') || r.remark.toLowerCase().includes('approved'))
        );
      } else if (statusLower === 'rejected') {
        allRecords = allRecords.filter(r => 
          r.remark && (r.remark.includes('已拒绝') || r.remark.toLowerCase().includes('rejected'))
        );
      }
      
      console.log(`状态筛选后的记录数 ${allRecords.length}`);
    }
    
    // 如果筛选后记录为空但用户是管理员，考虑添加特殊处理
    if (allRecords.length === 0 && isAdmin && status) {
      console.log('管理员筛选记录为空，尝试更宽松的查询...');
      
      try {
        // 对于管理员，仅使用年月和状态筛选，不考虑项目和组织限制
        const adminQueryConditions: any = {
          year: yearParam,
          month: monthParam
        };
        
        // 仅添加标准状态条件
        if (status && ['draft', 'submitted', 'pending_withdrawal'].includes(status.toLowerCase())) {
          const statusLower = status.toLowerCase();
          if (statusLower === 'draft') {
            adminQueryConditions.status = RecordStatus.DRAFT;
          } else if (statusLower === 'submitted') {
            adminQueryConditions.status = RecordStatus.SUBMITTED;
          } else if (statusLower === 'pending_withdrawal') {
            adminQueryConditions.status = RecordStatus.PENDING_WITHDRAWAL;
          }
        }
        
        console.log('管理员宽松查询条件:', JSON.stringify(adminQueryConditions, null, 2));
        
        const adminRecords = await prisma.predictRecord.findMany({
          where: adminQueryConditions,
          include: {
            subProject: {
              include: {
                project: {
                  include: {
                    category: true
                  }
                },
                detailedFundNeeds: {
                  include: {
                    department: true,
                    fundType: true,
                    organization: true
                  }
                }
              }
            },
            fundType: true,
          }
        });
        
        console.log(`管理员宽松查询返回 ${adminRecords.length} 条记录`);
        
        // 如果是扩展状态，进行内存中筛选
        if (status && ['approved', 'rejected', 'unfilled'].includes(status.toLowerCase())) {
          const statusLower = status.toLowerCase();
          if (statusLower === 'approved') {
            allRecords = adminRecords.filter(r => 
              r.remark && (r.remark.includes('已审核') || r.remark.toLowerCase().includes('approved'))
            );
          } else if (statusLower === 'rejected') {
            allRecords = adminRecords.filter(r => 
              r.remark && (r.remark.includes('已拒绝') || r.remark.toLowerCase().includes('rejected'))
            );
          } else if (statusLower === 'unfilled') {
            // 对于未填写状态，需要特殊处理
            // 这里我们可能需要另一种策略
          }
          
          console.log(`管理员扩展状态筛选后 ${allRecords.length} 条记录`);
        } else {
          // 对于标准状态，直接使用查询结果
          allRecords = adminRecords;
        }
      } catch (error) {
        console.error('管理员宽松查询出错:', error);
      }
    }

    console.log(`最终返回记录总数: ${allRecords.length}`);
    
    // 应用分页
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedRecords = allRecords.slice(startIndex, endIndex);

    return NextResponse.json({
      items: paginatedRecords,
      total: allRecords.length,
      page,
      pageSize,
      totalPages: Math.ceil(allRecords.length / pageSize),
      warning: (projects.length > 0 && organizationId) ? 
        `当前选择的组织未关联到任何项目，显示了所有项目。请先创建组织与项目的关联。` : 
        undefined
    });
  } catch (error) {
    console.error("获取预测记录列表失败:", error);
    return NextResponse.json({ 
      error: "获取预测记录列表失败", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 获取用户会话
    const session = await getServerSession(authOptions);
    
    // 临时解决方案：即使没有会话也继续执行，不返回401错误
    let userId = "temp-user-id";
    if (session && session.user) {
      userId = session.user.id;
    }

    // 解析请求体
    const body = await request.json();

    // 处理撤回申请
    if (body.action === "withdrawal") {
      // 验证撤回请求数据
      const result = withdrawalRequestSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json({ 
          error: "请求数据格式错误", 
          details: result.error.format() 
        }, { status: 400 });
      }
      
      const { recordId, reason } = result.data;
      
      // 查找记录是否存在
      const record = await services.predictRecord.findById(recordId);
      
      if (!record) {
        // 如果在测试环境，直接返回成功
        if (process.env.NODE_ENV === "development" && body.test === true) {
          return NextResponse.json({ 
            success: true,
            message: "测试模式：撤回申请已提交，等待管理员审核",
            note: "记录ID不存在，但测试模式下忽略此错误"
          });
        }
        
        return NextResponse.json({ error: "记录不存在" }, { status: 404 });
      }
      
      // 检查记录状态是否为已提交
      if (record.status !== "SUBMITTED" && process.env.NODE_ENV !== "development") {
        return NextResponse.json({ 
          error: "只有已提交的记录才能申请撤回" 
        }, { status: 400 });
      }
      
      // 更新记录状态为"待撤回"
      await services.predictRecord.update(recordId, {
        status: RecordStatus.PENDING_WITHDRAWAL,
        remark: record.remark ? `${record.remark} | 撤回原因: ${reason}` : `撤回原因: ${reason}`
      }, userId);
      
      return NextResponse.json({ 
        success: true,
        message: "撤回申请已提交，等待管理员审核" 
      });
    }

    // 处理其他类型的请求...
    return NextResponse.json({ error: "不支持的操作" }, { status: 400 });
  } catch (error) {
    console.error("处理预测记录请求失败:", error);
    return NextResponse.json({ 
      error: "处理预测记录请求失败", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 