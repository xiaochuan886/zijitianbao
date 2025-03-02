import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { RecordGenerator } from "@/lib/record-generator";

/**
 * 生成记录骨架的API路由
 * POST /api/admin/generate-records
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    
    // 权限检查：仅管理员可执行此操作
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "权限不足，仅管理员可执行此操作" },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { year, month, recordType, departmentId, organizationId } = body;
    
    // 参数验证
    if (!year || !month || !recordType) {
      return NextResponse.json(
        { error: "缺少必要参数：year, month, recordType" },
        { status: 400 }
      );
    }
    
    // 检查年月格式
    if (
      typeof year !== "number" || year < 2000 || year > 2100 ||
      typeof month !== "number" || month < 1 || month > 12
    ) {
      return NextResponse.json(
        { error: "年月格式错误" },
        { status: 400 }
      );
    }
    
    // 根据记录类型生成不同的记录
    let result;
    
    switch (recordType) {
      case "predict":
        result = await RecordGenerator.generatePredictRecords(
          year,
          month,
          departmentId,
          organizationId
        );
        break;
        
      case "actual":
        result = await RecordGenerator.generateActualUserRecords(
          year,
          month,
          departmentId,
          organizationId
        );
        break;
        
      default:
        return NextResponse.json(
          { error: "不支持的记录类型，可选值：predict, actual" },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      message: `成功为 ${year}年${month}月 生成${recordType === "predict" ? "预测" : "实际"}记录`,
      result
    });
    
  } catch (error) {
    console.error("生成记录骨架出错:", error);
    
    return NextResponse.json(
      { error: "生成记录骨架失败", details: (error as Error).message },
      { status: 500 }
    );
  }
} 