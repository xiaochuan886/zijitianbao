import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  try {
    // 解析请求体
    const body = await req.json();
    const { recordId, status, remark } = body;
    
    if (!recordId || !status) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }
    
    // 检查记录是否存在
    const record = await db.record.findUnique({
      where: { id: recordId }
    });
    
    if (!record) {
      return NextResponse.json(
        { error: "找不到指定的记录" },
        { status: 404 }
      );
    }
    
    // 更新记录状态
    const updatedRecord = await db.record.update({
      where: { id: recordId },
      data: {
        status,
        remark: remark || record.remark,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      record: updatedRecord
    });
    
  } catch (error) {
    console.error("更新记录状态失败", error);
    return NextResponse.json(
      { error: "更新记录状态失败，请稍后重试" },
      { status: 500 }
    );
  }
} 