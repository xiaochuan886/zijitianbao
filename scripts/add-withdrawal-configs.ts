import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('开始添加撤回配置...');
  
  // 首先删除所有现有的撤回配置
  await prisma.withdrawalConfig.deleteMany({});
  
  // 创建预测模块的撤回配置
  await prisma.withdrawalConfig.create({
    data: {
      moduleType: 'predict',
      allowedStatuses: JSON.stringify(['SUBMITTED']),
      timeLimit: 24, // 24小时内可撤回
      maxAttempts: 3, // 最多3次撤回机会
      requireApproval: true, // 需要管理员审批
    },
  });
  
  // 创建用户实际填报模块的撤回配置
  await prisma.withdrawalConfig.create({
    data: {
      moduleType: 'actual_user',
      allowedStatuses: JSON.stringify(['SUBMITTED']),
      timeLimit: 24,
      maxAttempts: 3,
      requireApproval: true,
    },
  });
  
  // 创建财务实际填报模块的撤回配置
  await prisma.withdrawalConfig.create({
    data: {
      moduleType: 'actual_fin',
      allowedStatuses: JSON.stringify(['SUBMITTED']),
      timeLimit: 24,
      maxAttempts: 3,
      requireApproval: true,
    },
  });
  
  // 创建审计模块的撤回配置
  await prisma.withdrawalConfig.create({
    data: {
      moduleType: 'audit',
      allowedStatuses: JSON.stringify(['SUBMITTED']),
      timeLimit: 24,
      maxAttempts: 3,
      requireApproval: true,
    },
  });
  
  console.log('撤回配置添加成功！');
}

main()
  .catch((e) => {
    console.error('添加撤回配置时出错:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 