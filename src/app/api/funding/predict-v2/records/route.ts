import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// 验证查询参数
const querySchema = z.object({
  ids: z.array(z.string()).min(1, "至少需要提供一个记录ID")
});

// 获取当前年份和月份以及上个月
function getCurrentYearAndPreviousMonths() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 当前月份（1-12）
  
  // 计算填报月份（当前月份+1）
  let reportMonth = currentMonth + 1;
  let reportYear = currentYear;
  
  // 如果填报月份超过12月，则年份+1，月份从1开始
  if (reportMonth > 12) {
    reportMonth = 1;
    reportYear += 1;
  }
  
  // 计算前三个月（相对于填报月份）
  const previousMonths = [];
  for (let i = 1; i <= 3; i++) {
    let month = reportMonth - i;
    let year = reportYear;
    
    if (month <= 0) {
      month += 12;
      year -= 1;
    }
    
    previousMonths.push({ year, month });
  }
  
  // 按时间顺序排序（从早到晚）
  previousMonths.reverse();
  
  // 上个月（相对于填报月份）
  const lastMonth = reportMonth - 1 <= 0 ? 12 : reportMonth - 1;
  const lastMonthYear = reportMonth - 1 <= 0 ? reportYear - 1 : reportYear;
  
  return { 
    currentYear: reportYear, 
    currentMonth: reportMonth, 
    previousMonths, 
    lastMonth, 
    lastMonthYear 
  };
}

export async function GET(request: NextRequest) {
  try {
    // 获取会话信息
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    // 解析查询参数
    const { searchParams } = new URL(request.url);
    
    // 获取所有ids[]参数
    const ids = searchParams.getAll("ids[]");
    
    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: "未提供记录ID" }, { status: 400 });
    }

    console.log(`查询记录IDs: ${ids.join(", ")}`);

    // 过滤出非临时ID（不以temp_开头的ID）
    const realIds = ids.filter(id => !id.startsWith("temp_"));
    
    // 如果有真实ID，查询数据库
    let records: any[] = [];
    if (realIds.length > 0) {
      records = await prisma.predictRecord.findMany({
        where: {
          id: {
            in: realIds
          }
        },
        include: {
          detailedFundNeed: {
            include: {
              subProject: {
                include: {
                  project: {
                    include: {
                      category: true
                    }
                  }
                }
              },
              department: true,
              organization: true,
              fundType: true
            }
          }
        }
      });
    }

    // 如果有临时ID，需要特殊处理
    const tempIds = ids.filter(id => id.startsWith("temp_"));
    const detailedFundNeedIds: string[] = [];
    
    if (tempIds.length > 0) {
      // 解析临时ID，提取detailedFundNeedId、年份和月份
      for (const tempId of tempIds) {
        const parts = tempId.split('_');
        if (parts.length >= 4 && parts[0] === 'temp') {
          const detailedFundNeedId = parts[1];
          const year = parseInt(parts[2]);
          const month = parseInt(parts[3]);
          
          if (detailedFundNeedId && !isNaN(year) && !isNaN(month)) {
            try {
              // 收集所有detailedFundNeedId用于后续查询历史记录
              if (!detailedFundNeedIds.includes(detailedFundNeedId)) {
                detailedFundNeedIds.push(detailedFundNeedId);
              }
              
              // 查询资金需求明细
              const detailedFundNeed = await prisma.detailedFundNeed.findUnique({
                where: { id: detailedFundNeedId },
                include: {
                  subProject: {
                    include: {
                      project: {
                        include: {
                          category: true
                        }
                      }
                    }
                  },
                  department: true,
                  organization: true,
                  fundType: true
                }
              });
              
              if (detailedFundNeed) {
                // 创建临时记录
                const tempRecord = {
                  id: tempId,
                  year,
                  month,
                  amount: null,
                  remark: null,
                  status: "unfilled",
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  detailedFundNeedId: detailedFundNeed.id,
                  detailedFundNeed
                };
                
                records.push(tempRecord);
              }
            } catch (error) {
              console.error(`处理临时ID ${tempId} 失败:`, error);
            }
          }
        }
      }
    } else {
      // 如果没有临时ID，从真实记录中提取detailedFundNeedId
      records.forEach(record => {
        if (record.detailedFundNeedId && !detailedFundNeedIds.includes(record.detailedFundNeedId)) {
          detailedFundNeedIds.push(record.detailedFundNeedId);
        }
      });
    }
    
    // 获取历史记录
    if (detailedFundNeedIds.length > 0) {
      const { previousMonths } = getCurrentYearAndPreviousMonths();
      
      // 构建查询条件
      const historyConditions = [];
      for (const detailedFundNeedId of detailedFundNeedIds) {
        for (const { year, month } of previousMonths) {
          historyConditions.push({
            detailedFundNeedId,
            year,
            month
          });
        }
      }
      
      // 查询历史记录
      if (historyConditions.length > 0) {
        console.log(`查询历史记录，条件数量: ${historyConditions.length}`);
        const historyRecords = await prisma.predictRecord.findMany({
          where: {
            OR: historyConditions
          },
          include: {
            detailedFundNeed: {
              include: {
                subProject: {
                  include: {
                    project: {
                      include: {
                        category: true
                      }
                    }
                  }
                },
                department: true,
                organization: true,
                fundType: true
              }
            }
          }
        });
        
        console.log(`获取到${historyRecords.length}条历史记录`);
        
        // 将历史记录添加到结果中
        records = [...records, ...historyRecords];
      }
    }

    // 确保记录不重复（根据detailedFundNeedId、year和month去重）
    const uniqueRecords = [];
    const recordKeys = new Set();

    for (const record of records) {
      const key = `${record.detailedFundNeedId}_${record.year}_${record.month}`;
      if (!recordKeys.has(key)) {
        recordKeys.add(key);
        uniqueRecords.push(record);
      }
    }

    return NextResponse.json({
      records: uniqueRecords,
      count: uniqueRecords.length
    });
  } catch (error) {
    console.error("获取记录详情失败", error);
    return NextResponse.json({ error: "获取记录详情失败" }, { status: 500 });
  }
} 