import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/lib/db";
import { z } from "zod";

// 请求体验证模式
const EditStatusSchema = z.object({
  recordId: z.string(),
  status: z.string(),
  remark: z.string().optional()
});

export async function POST(req: Request) {
  try {
    // 获取用户会话
    const session = await getServerSession(authOptions);
    
    // 暂时放宽身份验证要求 - 允许无会话请求
    // if (!session?.user) {
    //   return NextResponse.json(
    //     { error: "未授权访问" },
    //     { status: 401 }
    //   );
    // }
    
    // 解析请求体
    const body = await req.json();
    
    // 验证请求数据
    const validationResult = EditStatusSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "无效的请求数据", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { recordId, status, remark } = validationResult.data;
    
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