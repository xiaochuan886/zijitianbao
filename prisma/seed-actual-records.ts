import { PrismaClient } from '@prisma/client';
import { RecordStatus } from '@/lib/enums';

const prisma = new PrismaClient();

async function main() {
  console.log('开始生成实际支付记录...');

  // 获取上个月的年月
  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = prevMonth + 1; // 月份从1开始

  console.log(`生成 ${year}年${month}月 的实际支付记录`);

  // 获取一个有效的用户ID用于submittedBy字段
  const users = await prisma.user.findMany({
    take: 1,
  });

  if (users.length === 0) {
    console.error('错误: 没有找到用户，请先创建用户');
    return;
  }

  const submittedBy = users[0].id;
  console.log(`使用用户ID: ${submittedBy} 作为提交者`);

  // 获取所有活跃的详细资金需求
  const detailedFundNeeds = await prisma.detailedFundNeed.findMany({
    where: {
      isActive: true,
      subProject: {
        project: {
          status: 'ACTIVE',
        },
      },
    },
    include: {
      subProject: {
        include: {
          project: true,
        },
      },
      organization: true,
    },
  });

  console.log(`找到 ${detailedFundNeeds.length} 个活跃的详细资金需求`);

  // 为每个详细资金需求生成用户填报和财务填报记录
  for (const need of detailedFundNeeds) {
    // 生成随机金额
    const userAmount = Math.floor(Math.random() * 100000) / 100;
    
    // 财务金额有80%的概率与用户金额相同，20%的概率不同
    const financeAmount = Math.random() > 0.2 
      ? userAmount 
      : Math.floor(Math.random() * 100000) / 100;

    // 创建用户填报记录
    const userRecord = await prisma.actualUserRecord.create({
      data: {
        detailedFundNeedId: need.id,
        year,
        month,
        amount: userAmount,
        status: "SUBMITTED",
        submittedBy,
        submittedAt: new Date(),
        remark: '系统自动生成的测试数据',
      },
    });

    console.log(`创建用户填报记录: ${need.subProject.project.name} - ${need.subProject.name}, 金额: ${userAmount}`);

    // 创建财务填报记录
    const financeRecord = await prisma.actualFinRecord.create({
      data: {
        detailedFundNeedId: need.id,
        year,
        month,
        amount: financeAmount,
        status: "SUBMITTED",
        submittedBy,
        submittedAt: new Date(),
        remark: '系统自动生成的测试数据',
        userRecordId: userRecord.id,
      },
    });

    console.log(`创建财务填报记录: ${need.subProject.project.name} - ${need.subProject.name}, 金额: ${financeAmount}`);
  }

  console.log('实际支付记录生成完成!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 