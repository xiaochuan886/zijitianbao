import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { RecordStatus } from "@/lib/enums";

// 验证请求体
const requestSchema = z.object({
  records: z.array(
    z.object({
      id: z.string(),
      amount: z.string().optional(),
      remark: z.string().optional(),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    // 获取会话信息
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    // 解析请求体
    const body = await request.json();
    const validationResult = requestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "请求数据格式错误", details: validationResult.error },
        { status: 400 }
      );
    }

    const { records } = validationResult.data;

    // 分离临时ID和真实ID记录
    const tempRecords = records.filter(record => record.id.startsWith("temp_"));
    const realRecords = records.filter(record => !record.id.startsWith("temp_"));

    console.log(`处理${records.length}条记录，其中临时ID: ${tempRecords.length}，真实ID: ${realRecords.length}`);

    // 处理结果
    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as string[]
    };

    // 处理真实ID记录 - 更新现有记录
    if (realRecords.length > 0) {
      for (const record of realRecords) {
        try {
          // 转换金额为数字
          const amount = record.amount ? parseFloat(record.amount) : null;

          // 更新记录
          await prisma.predictRecord.update({
            where: { id: record.id },
            data: {
              amount,
              remark: record.remark || null,
              status: "DRAFT",
              updatedAt: new Date()
            }
          });

          results.updated++;
        } catch (error) {
          console.error(`更新记录 ${record.id} 失败:`, error);
          results.failed++;
          results.errors.push(`记录 ${record.id} 更新失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }
    }

    // 处理临时ID记录 - 创建新记录
    if (tempRecords.length > 0) {
      for (const record of tempRecords) {
        try {
          // 解析临时ID，提取detailedFundNeedId、年份和月份
          const parts = record.id.split('_');
          if (parts.length >= 4 && parts[0] === 'temp') {
            const detailedFundNeedId = parts[1];
            const year = parseInt(parts[2]);
            const month = parseInt(parts[3]);
            
            if (detailedFundNeedId && !isNaN(year) && !isNaN(month)) {
              // 查询资金需求明细
              const detailedFundNeed = await prisma.detailedFundNeed.findUnique({
                where: { id: detailedFundNeedId },
                include: {
                  subProject: true,
                  fundType: true,
                  department: true,
                },
              });
              
              if (detailedFundNeed) {
                // 转换金额为数字
                const amount = record.amount ? parseFloat(record.amount) : null;
                
                // 创建新记录
                await prisma.predictRecord.create({
                  data: {
                    year,
                    month,
                    amount,
                    remark: record.remark || null,
                    status: "DRAFT",
                    detailedFundNeedId: detailedFundNeed.id
                  }
                });
                
                results.created++;
              } else {
                throw new Error(`未找到资金需求明细: ${detailedFundNeedId}`);
              }
            } else {
              throw new Error(`临时ID格式错误: ${record.id}`);
            }
          } else {
            throw new Error(`临时ID格式错误: ${record.id}`);
          }
        } catch (error) {
          console.error(`创建记录 ${record.id} 失败:`, error);
          results.failed++;
          results.errors.push(`记录 ${record.id} 创建失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
      }
    }

    return NextResponse.json({
      message: `成功处理记录: 创建 ${results.created} 条, 更新 ${results.updated} 条`,
      results
    });
  } catch (error) {
    console.error("保存记录失败", error);
    return NextResponse.json({ error: "保存记录失败" }, { status: 500 });
  }
} 