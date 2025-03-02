// 资金需求明细关系迁移脚本
// 此脚本用于将现有记录与DetailedFundNeed关联起来

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('开始迁移数据...');
  
  // 1. 查找所有DetailedFundNeed记录
  const allDetailedFundNeeds = await prisma.detailedFundNeed.findMany({
    where: { isActive: true }
  });
  
  console.log(`找到 ${allDetailedFundNeeds.length} 条资金需求明细配置`);
  
  // 2. 处理PredictRecord记录
  await migrateRecords('PredictRecord', allDetailedFundNeeds);
  
  // 3. 处理ActualUserRecord记录
  await migrateRecords('ActualUserRecord', allDetailedFundNeeds);
  
  // 4. 处理ActualFinRecord记录
  await migrateRecords('ActualFinRecord', allDetailedFundNeeds);
  
  // 5. 处理AuditRecord记录
  await migrateRecords('AuditRecord', allDetailedFundNeeds);
  
  console.log('数据迁移完成！');
}

async function migrateRecords(recordType, allDetailedFundNeeds) {
  // 查询所有记录
  const records = await prisma[recordType].findMany();
  console.log(`找到 ${records.length} 条 ${recordType} 记录需要迁移`);
  
  let migratedCount = 0;
  let errorCount = 0;
  
  // 为每条记录找到匹配的DetailedFundNeed
  for (const record of records) {
    try {
      // 查找匹配的DetailedFundNeed记录
      const matchingNeed = allDetailedFundNeeds.find(need => 
        need.subProjectId === record.subProjectId && 
        need.departmentId === record.departmentId && 
        need.fundTypeId === record.fundTypeId
      );
      
      if (matchingNeed) {
        // 更新记录，设置detailedFundNeedId
        await prisma[recordType].update({
          where: { id: record.id },
          data: { detailedFundNeedId: matchingNeed.id }
        });
        migratedCount++;
      } else {
        // 如果找不到匹配的需求明细，则创建一个新的
        const newDetailedFundNeed = await prisma.detailedFundNeed.create({
          data: {
            subProjectId: record.subProjectId,
            departmentId: record.departmentId,
            fundTypeId: record.fundTypeId,
            // 查找记录关联的子项目，获取其项目的organizationId
            organizationId: await getOrganizationIdFromSubProject(record.subProjectId),
            isActive: true
          }
        });
        
        // 更新记录，设置detailedFundNeedId
        await prisma[recordType].update({
          where: { id: record.id },
          data: { detailedFundNeedId: newDetailedFundNeed.id }
        });
        migratedCount++;
      }
    } catch (error) {
      console.error(`迁移记录 ${record.id} 时出错:`, error);
      errorCount++;
    }
  }
  
  console.log(`${recordType} 迁移完成: 成功 ${migratedCount} 条, 失败 ${errorCount} 条`);
}

// 辅助函数：获取子项目所属项目的organizationId
async function getOrganizationIdFromSubProject(subProjectId) {
  try {
    const subProject = await prisma.subProject.findUnique({
      where: { id: subProjectId },
      include: { project: true }
    });
    
    if (subProject?.project?.organizationId) {
      return subProject.project.organizationId;
    } else {
      // 如果找不到，使用系统中第一个组织作为默认值
      const firstOrg = await prisma.organization.findFirst();
      return firstOrg?.id || null;
    }
  } catch (error) {
    console.error(`获取子项目 ${subProjectId} 的组织ID时出错:`, error);
    // 尝试查找系统中的第一个组织作为回退
    const firstOrg = await prisma.organization.findFirst();
    return firstOrg?.id || null;
  }
}

// 执行迁移
main()
  .catch(e => {
    console.error('迁移失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 