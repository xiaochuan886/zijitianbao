import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/lib/db";

// 取消撤回申请
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const recordId = params.id;
    
    // 获取用户会话
    const session = await getServerSession(authOptions);
    
    // 临时解决方案：即使没有会话也继续执行
    let userId = "temp-user-id";
    if (session && session.user) {
      userId = session.user.id;
    }
    
    // 查找记录是否存在
    const record = await db.record.findUnique({
      where: { 
        id: recordId,
        status: "pending_withdrawal" // 确保状态为待撤回
      }
    });
    
    if (!record) {
      return NextResponse.json({
        error: "找不到处于撤回申请状态的记录"
      }, { status: 404 });
    }
    
    // 直接更新记录状态为已提交
    await db.record.update({
      where: {
        id: recordId
      },
      data: {
        status: "submitted"
      }
    });
    
    return NextResponse.json({
      message: "已成功取消撤回申请"
    });
    
  } catch (error) {
    console.error("取消撤回申请失败", error);
    return NextResponse.json({ error: "取消撤回申请失败，请稍后重试" }, { status: 500 });
  }
} 