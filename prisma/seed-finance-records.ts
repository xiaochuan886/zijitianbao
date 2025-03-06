import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('开始生成2月份财务记录...');

    // 获取2月份的所有用户填报记录
    const userRecords = await prisma.actualUserRecord.findMany({
      where: {
        year: 2025,
        month: 2,
        status: {
          in: ['SUBMITTED', 'APPROVED']
        },
      },
      include: {
        detailedFundNeed: true,
      }
    });

    console.log(`找到 ${userRecords.length} 条2月份用户填报记录`);

    // 找出还没有对应财务记录的用户记录
    const recordsWithoutFinance = await Promise.all(
      userRecords.map(async (record) => {
        const hasFinanceRecord = await prisma.actualFinRecord.findFirst({
          where: {
            userRecordId: record.id
          }
        });
        return {
          record,
          hasFinanceRecord: !!hasFinanceRecord
        };
      })
    );

    const recordsToProcess = recordsWithoutFinance.filter(r => !r.hasFinanceRecord).map(r => r.record);
    console.log(`其中 ${recordsToProcess.length} 条记录没有对应的财务记录，将为这些记录创建财务记录`);

    if (recordsToProcess.length === 0) {
      console.log('没有需要创建财务记录的用户记录，操作结束');
      return;
    }

    // 查找财务用户（角色为FINANCE的用户）
    const financeUser = await prisma.user.findFirst({
      where: {
        role: 'FINANCE'
      }
    });

    if (!financeUser) {
      throw new Error('没有找到财务角色的用户');
    }

    console.log(`使用财务用户 ${financeUser.name} (${financeUser.id}) 创建财务记录`);

    // 批量创建财务记录
    const financeRecords = await Promise.all(
      recordsToProcess.map(async (userRecord) => {
        // 使用用户填报金额的1.2倍作为财务填报金额，模拟差异
        const financeAmount = userRecord.amount ? userRecord.amount * 1.2 : 0;
        
        return prisma.actualFinRecord.create({
          data: {
            detailedFundNeedId: userRecord.detailedFundNeedId,
            year: userRecord.year,
            month: userRecord.month,
            amount: financeAmount,
            status: 'SUBMITTED',
            submittedBy: financeUser.id,
            submittedAt: new Date(),
            userRecordId: userRecord.id,
          }
        });
      })
    );

    console.log(`成功创建 ${financeRecords.length} 条财务记录`);
    console.log('财务记录生成完成！');

  } catch (error) {
    console.error('生成财务记录时出错:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 