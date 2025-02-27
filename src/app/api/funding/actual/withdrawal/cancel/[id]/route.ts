import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/lib/db";
import { z } from "zod";

// 定义API响应类型
interface ApiResponse {
  success: boolean;
  message: string;
  recordId?: string;
  error?: string;
  details?: string;
}

// GET请求处理函数
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  return NextResponse.json({
    success: true,
    message: "撤回申请取消API正常工作",
    data: {
      projectId: params.id,
    },
  });
}

// POST请求处理函数
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    const projectId = params.id;
    console.log(`处理取消撤回请求: 项目ID=${projectId}`);
    
    if (!projectId) {
      return NextResponse.json({ 
        success: false,
        message: "请求失败",
        error: "缺少项目ID" 
      }, { status: 400 });
    }

    // 查询项目的子项目
    const subProjects = await db.subProject.findMany({
      where: {
        projectId: projectId
      },
      select: {
        id: true,
        name: true
      }
    });
    
    if (!subProjects || subProjects.length === 0) {
      console.log(`未找到项目ID ${projectId} 的子项目`);
      return NextResponse.json({ 
        success: false,
        message: "未找到项目的子项目",
        error: "未找到项目的子项目" 
      }, { status: 404 });
    }
    
    console.log(`找到 ${subProjects.length} 个子项目`);
    
    // 查找处于待撤回状态的记录
    const record = await db.record.findFirst({
      where: {
        subProjectId: {
          in: subProjects.map(sp => sp.id)
        },
        OR: [
          { status: "pending_withdrawal" },
          { actualUserStatus: "pending_withdrawal" },
          { actualFinanceStatus: "pending_withdrawal" }
        ]
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    if (!record) {
      console.log(`未找到待撤回的记录`);
      return NextResponse.json(
        { 
          success: false,
          message: "未找到待撤回的记录",
          error: "未找到待撤回的记录" 
        },
        { status: 404 }
      );
    }
    
    console.log(`找到待撤回记录: ${record.id}, 当前状态=${record.status}, 用户状态=${record.actualUserStatus}, 财务状态=${record.actualFinanceStatus}`);

    // 构建更新数据
    const updateData: any = {};
    
    // 如果用户状态是待撤回，恢复为已提交
    if (record.actualUserStatus === "pending_withdrawal") {
      updateData.actualUserStatus = "submitted";
    }
    
    // 如果财务状态是待撤回，恢复为已提交
    if (record.actualFinanceStatus === "pending_withdrawal") {
      updateData.actualFinanceStatus = "submitted";
    }
    
    // 如果主状态是待撤回，恢复为已提交
    if (record.status === "pending_withdrawal") {
      updateData.status = "submitted";
    }
    
    // 更新记录
    await db.record.update({
      where: { id: record.id },
      data: updateData
    });
    
    console.log(`已更新记录: ${record.id}, 新数据=`, updateData);

    return NextResponse.json({
      success: true,
      message: "已取消撤回申请",
      recordId: record.id
    });
  } catch (error) {
    console.error("处理取消撤回请求失败", error);
    return NextResponse.json(
      {
        success: false,
        message: "处理取消撤回请求失败",
        error: "处理取消撤回请求失败",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 