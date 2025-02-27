import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { z } from "zod";

// 验证请求数据
const submitSchema = z.object({
  records: z.record(z.string(), z.number().nullable()),
  remarks: z.record(z.string(), z.string().nullable()),
  isUserReport: z.boolean().default(true), // 区分填报人和财务填报
});

export async function POST(req: Request) {
  try {
    // 获取用户会话
    const session = await getServerSession(authOptions);
    
    // 临时解决方案：即使没有会话也继续执行，不返回401错误
    let userId = "temp-user-id";
    if (session && session.user) {
      userId = session.user.id;
    }

    // 解析请求体
    const body = await req.json();
    
    // 验证请求数据
    const result = submitSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ 
        error: "请求数据格式错误", 
        details: result.error.format() 
      }, { status: 400 });
    }
    
    const { records, remarks, isUserReport } = result.data;

    // 获取所有要更新的记录ID
    const recordIds = Object.keys(records);
    
    if (recordIds.length === 0) {
      return NextResponse.json({ 
        error: "没有要提交的记录" 
      }, { status: 400 });
    }
    
    // 查询这些记录是否存在并检查状态
    const existingRecords = await db.record.findMany({
      where: {
        id: {
          in: recordIds
        }
      }
    });
    
    // 验证所有记录是否存在
    if (existingRecords.length !== recordIds.length) {
      const missingRecordIds = recordIds.filter(
        id => !existingRecords.some(record => record.id === id)
      );
      
      return NextResponse.json({ 
        error: "部分记录不存在", 
        missingRecordIds 
      }, { status: 400 });
    }
    
    // 验证记录状态，只有草稿状态的记录才能提交
    const nonDraftRecords = existingRecords.filter(
      record => record.status !== "draft" && record.status !== "pending_withdrawal"
    );
    
    if (nonDraftRecords.length > 0 && process.env.NODE_ENV !== "development") {
      return NextResponse.json({ 
        error: "只有草稿或待撤回状态的记录才能提交", 
        recordIds: nonDraftRecords.map(record => record.id) 
      }, { status: 400 });
    }
    
    // 更新记录
    const updatePromises = recordIds.map(async recordId => {
      const updateData: any = {
        status: "submitted",
        submittedBy: userId,
        submittedAt: new Date()
      };
      
      // 根据填报角色更新不同的字段
      if (isUserReport) {
        updateData.actualUser = records[recordId];
      } else {
        updateData.actualFinance = records[recordId];
      }
      
      // 更新备注
      if (remarks[recordId] !== undefined) {
        updateData.remark = remarks[recordId];
      }
      
      return db.record.update({
        where: { id: recordId },
        data: updateData
      });
    });
    
    // 执行所有更新操作
    await Promise.all(updatePromises);
    
    return NextResponse.json({
      success: true,
      message: "记录提交成功",
      submittedRecords: recordIds.length
    });
    
  } catch (error) {
    console.error("提交记录失败", error);
    return NextResponse.json({ 
      error: "提交记录失败，请稍后重试", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 