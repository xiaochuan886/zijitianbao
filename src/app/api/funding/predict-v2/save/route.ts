import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { z } from "zod";
import { services } from "@/lib/services";
import { RecordStatus } from "@/lib/enums";

// 验证保存记录请求数据
const saveRecordSchema = z.object({
  records: z.array(
    z.object({
      id: z.string().optional(),
      subProjectId: z.string(),
      fundTypeId: z.string(),
      year: z.number(),
      month: z.number(),
      amount: z.number().nullable(),
      remark: z.string().optional(),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    // 获取用户会话
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    // 解析请求体
    const body = await request.json();
    
    // 验证请求数据
    const result = saveRecordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ 
        error: "请求数据格式错误", 
        details: result.error.format() 
      }, { status: 400 });
    }
    
    const { records } = result.data;
    
    // 处理记录保存
    const createdRecords: string[] = [];
    const updatedRecords: string[] = [];
    const failedRecords: { record: any; error: string }[] = [];
    
    for (const record of records) {
      try {
        if (record.id) {
          // 更新已存在的记录
          await services.predictRecord.update(record.id, {
            amount: record.amount === null ? undefined : record.amount,
            remark: record.remark,
          }, session.user.id);
          
          updatedRecords.push(record.id);
        } else {
          // 检查是否已存在相同条件的记录
          const existingRecord = await (services.predictRecord as any).findFirst({
            where: {
              subProjectId: record.subProjectId,
              fundTypeId: record.fundTypeId,
              year: record.year,
              month: record.month,
            }
          });
          
          if (existingRecord) {
            // 更新已存在的记录
            await services.predictRecord.update(existingRecord.id, {
              amount: record.amount === null ? undefined : record.amount,
              remark: record.remark,
            }, session.user.id);
            
            updatedRecords.push(existingRecord.id);
          } else {
            // 创建新记录
            const newRecord = await services.predictRecord.create({
              subProjectId: record.subProjectId,
              fundTypeId: record.fundTypeId,
              year: record.year,
              month: record.month,
              amount: record.amount === null ? undefined : record.amount,
              status: RecordStatus.DRAFT,
              remark: record.remark,
              submittedBy: session.user.id,
            });
            
            createdRecords.push(newRecord.id);
          }
        }
      } catch (error) {
        console.error(`保存记录失败:`, error);
        failedRecords.push({
          record,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "记录保存成功",
      details: {
        created: createdRecords.length,
        updated: updatedRecords.length,
        failed: failedRecords.length,
      },
      createdRecords,
      updatedRecords,
      failedRecords,
    });
  } catch (error) {
    console.error("保存预测记录失败:", error);
    return NextResponse.json({ 
      error: "保存预测记录失败", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 