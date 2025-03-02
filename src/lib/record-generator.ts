import { PrismaClient, RecordStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 记录生成服务 - 负责基于DetailedFundNeed配置生成各类记录骨架
 */
export class RecordGenerator {
  /**
   * 为指定年月生成预测记录骨架
   * @param year 年份
   * @param month 月份
   * @param departmentId 可选，指定部门ID，为空时生成所有部门的记录
   * @param organizationId 可选，指定组织ID，为空时生成所有组织的记录
   */
  static async generatePredictRecords(
    year: number,
    month: number,
    departmentId?: string,
    organizationId?: string
  ) {
    console.log(`开始为 ${year}年${month}月 生成预测记录骨架...`);
    
    // 查询活跃的资金需求明细配置
    const fundNeeds = await prisma.detailedFundNeed.findMany({
      where: {
        isActive: true,
        ...(departmentId ? { departmentId } : {}),
        ...(organizationId ? { organizationId } : {})
      },
      include: {
        subProject: true,
        department: true,
        fundType: true
      }
    });
    
    console.log(`找到 ${fundNeeds.length} 条活跃的资金需求明细配置`);
    
    // 批量创建记录
    const created = await prisma.$transaction(
      async (tx) => {
        let createdCount = 0;
        let skippedCount = 0;
        
        for (const need of fundNeeds) {
          // 检查记录是否已存在
          const existingRecord = await tx.predictRecord.findUnique({
            where: {
              detailedFundNeedId_year_month: {
                detailedFundNeedId: need.id,
                year,
                month
              }
            }
          });
          
          if (!existingRecord) {
            // 创建新记录
            await tx.predictRecord.create({
              data: {
                detailedFundNeedId: need.id,
                subProjectId: need.subProjectId,
                fundTypeId: need.fundTypeId,
                departmentId: need.departmentId,
                year,
                month,
                status: RecordStatus.UNFILLED // 初始状态为未填写
              }
            });
            createdCount++;
          } else {
            skippedCount++;
          }
        }
        
        return { createdCount, skippedCount };
      }
    );
    
    console.log(`预测记录骨架生成完成: 新建 ${created.createdCount} 条, 已存在 ${created.skippedCount} 条`);
    
    return created;
  }
  
  /**
   * 为指定年月生成实际支出记录骨架（填报人记录）
   * @param year 年份
   * @param month 月份
   * @param departmentId 可选，指定部门ID
   * @param organizationId 可选，指定组织ID
   */
  static async generateActualUserRecords(
    year: number,
    month: number,
    departmentId?: string,
    organizationId?: string
  ) {
    console.log(`开始为 ${year}年${month}月 生成实际支出填报记录骨架...`);
    
    // 查询活跃的资金需求明细配置
    const fundNeeds = await prisma.detailedFundNeed.findMany({
      where: {
        isActive: true,
        ...(departmentId ? { departmentId } : {}),
        ...(organizationId ? { organizationId } : {})
      }
    });
    
    // 批量创建记录
    const created = await prisma.$transaction(
      async (tx) => {
        let createdCount = 0;
        let skippedCount = 0;
        
        for (const need of fundNeeds) {
          // 检查记录是否已存在
          const existingRecord = await tx.actualUserRecord.findUnique({
            where: {
              detailedFundNeedId_year_month: {
                detailedFundNeedId: need.id,
                year,
                month
              }
            }
          });
          
          if (!existingRecord) {
            // 创建新记录
            await tx.actualUserRecord.create({
              data: {
                detailedFundNeedId: need.id,
                subProjectId: need.subProjectId,
                fundTypeId: need.fundTypeId,
                departmentId: need.departmentId,
                year,
                month,
                status: RecordStatus.UNFILLED
              }
            });
            createdCount++;
          } else {
            skippedCount++;
          }
        }
        
        return { createdCount, skippedCount };
      }
    );
    
    console.log(`实际支出填报记录骨架生成完成: 新建 ${created.createdCount} 条, 已存在 ${created.skippedCount} 条`);
    
    return created;
  }
  
  /**
   * 当实际支出填报记录提交后，生成对应的财务审核记录
   * @param actualUserRecordId 已提交的填报记录ID
   */
  static async generateActualFinRecord(actualUserRecordId: string) {
    // 查询填报记录
    const userRecord = await prisma.actualUserRecord.findUnique({
      where: { id: actualUserRecordId },
      include: {
        detailedFundNeed: true
      }
    });
    
    if (!userRecord) {
      throw new Error(`找不到ID为 ${actualUserRecordId} 的填报记录`);
    }
    
    // 检查是否已存在财务记录
    const existingFinRecord = await prisma.actualFinRecord.findUnique({
      where: {
        userRecordId: actualUserRecordId
      }
    });
    
    if (existingFinRecord) {
      return existingFinRecord;
    }
    
    // 创建财务记录
    const finRecord = await prisma.actualFinRecord.create({
      data: {
        detailedFundNeedId: userRecord.detailedFundNeedId,
        subProjectId: userRecord.subProjectId,
        fundTypeId: userRecord.fundTypeId,
        year: userRecord.year,
        month: userRecord.month,
        amount: userRecord.amount, // 初始金额与填报记录相同
        status: RecordStatus.DRAFT, // 财务记录初始状态为草稿
        userRecordId: userRecord.id
      }
    });
    
    return finRecord;
  }
  
  /**
   * 当财务审核记录提交后，生成对应的最终审计记录
   * @param actualFinRecordId 已提交的财务审核记录ID
   */
  static async generateAuditRecord(actualFinRecordId: string) {
    // 查询财务记录
    const finRecord = await prisma.actualFinRecord.findUnique({
      where: { id: actualFinRecordId },
      include: {
        detailedFundNeed: true
      }
    });
    
    if (!finRecord) {
      throw new Error(`找不到ID为 ${actualFinRecordId} 的财务记录`);
    }
    
    // 检查是否已存在审计记录
    const existingAuditRecord = await prisma.auditRecord.findUnique({
      where: {
        financeRecordId: actualFinRecordId
      }
    });
    
    if (existingAuditRecord) {
      return existingAuditRecord;
    }
    
    // 创建审计记录
    const auditRecord = await prisma.auditRecord.create({
      data: {
        detailedFundNeedId: finRecord.detailedFundNeedId,
        subProjectId: finRecord.subProjectId,
        fundTypeId: finRecord.fundTypeId,
        year: finRecord.year,
        month: finRecord.month,
        amount: finRecord.amount, // 初始金额与财务记录相同
        status: RecordStatus.DRAFT, // 审计记录初始状态为草稿
        financeRecordId: finRecord.id
      }
    });
    
    return auditRecord;
  }
  
  /**
   * 获取部门在特定年月可填报的记录配置
   * @param departmentId 部门ID
   * @param year 年份
   * @param month 月份
   */
  static async getAvailableFundNeeds(departmentId: string, year: number, month: number) {
    // 查询该部门负责的所有资金需求明细
    const fundNeeds = await prisma.detailedFundNeed.findMany({
      where: {
        departmentId,
        isActive: true
      },
      include: {
        subProject: {
          include: {
            project: true
          }
        },
        fundType: true
      }
    });
    
    // 查询已经有记录的明细
    const existingRecords = await prisma.predictRecord.findMany({
      where: {
        departmentId,
        year,
        month
      },
      select: {
        detailedFundNeedId: true
      }
    });
    
    const existingNeedIds = new Set(existingRecords.map(r => r.detailedFundNeedId));
    
    // 过滤出尚未创建记录的明细
    const availableNeeds = fundNeeds.filter(need => !existingNeedIds.has(need.id));
    
    return {
      totalNeeds: fundNeeds.length,
      availableNeeds: availableNeeds.length,
      needs: availableNeeds
    };
  }
}

export default RecordGenerator; 