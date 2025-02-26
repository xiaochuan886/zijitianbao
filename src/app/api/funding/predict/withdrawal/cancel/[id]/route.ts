import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { db } from "@/lib/db";
import { z } from "zod";

// 定义API响应接口
interface ApiResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
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
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<ApiResponse>> {
  try {
    const projectId = params.id;

    // 验证项目ID是否存在
    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          message: "项目ID不能为空",
          error: "MISSING_PROJECT_ID",
        },
        { status: 400 }
      );
    }

    // 查找所有状态为"pending_withdrawal"的记录
    const records = await db.record.findMany({
      where: {
        subProject: {
          projectId: projectId,
        },
        status: "pending_withdrawal",
      },
    });

    // 如果没有找到记录，返回错误
    if (records.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "未找到待撤回的记录",
          error: "NO_RECORDS_FOUND",
        },
        { status: 404 }
      );
    }

    // 更新所有记录的状态为"submitted"
    const updatePromises = records.map((record) =>
      db.record.update({
        where: { id: record.id },
        data: { status: "submitted" },
      })
    );

    // 执行所有更新操作
    await Promise.all(updatePromises);

    // 更新项目状态
    await db.project.update({
      where: { id: projectId },
      data: { 
        // 使用正确的状态值
        status: "ACTIVE" 
      },
    });

    // 记录日志
    console.log(`已取消项目 ${projectId} 的撤回申请，共更新 ${records.length} 条记录`);

    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: "撤回申请已取消",
      data: {
        projectId,
        updatedRecords: records.length,
      },
    });
  } catch (error) {
    console.error("取消撤回申请时出错:", error);
    return NextResponse.json(
      {
        success: false,
        message: "取消撤回申请时出错",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
} 