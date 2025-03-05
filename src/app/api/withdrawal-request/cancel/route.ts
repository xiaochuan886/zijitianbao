import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { recordId, recordType } = data;
    
    console.log("取消撤回请求数据:", { recordId, recordType });

    // 验证必填字段
    if (!recordId || !recordType) {
      console.log("缺少必填字段", { recordId, recordType });
      return NextResponse.json(
        { 
          success: false,
          message: "缺少必填字段",
          error: {
            type: "missing_fields",
            fields: !recordId ? "recordId" : "recordType"
          }
        },
        { status: 400 }
      );
    }

    // 检查记录是否存在
    let record;
    
    if (recordType === "predict") {
      record = await prisma.predictRecord.findUnique({
        where: { id: recordId },
      });
      console.log("找到预测记录:", record);
    } else if (recordType === "actual_user") {
      record = await prisma.actualUserRecord.findUnique({
        where: { id: recordId },
      });
    } else if (recordType === "actual_fin") {
      record = await prisma.actualFinRecord.findUnique({
        where: { id: recordId },
      });
    } else if (recordType === "audit") {
      record = await prisma.auditRecord.findUnique({
        where: { id: recordId },
      });
    } else {
      return NextResponse.json(
        { 
          success: false,
          message: "无效的记录类型",
          error: {
            type: "invalid_record_type",
            recordType
          }
        },
        { status: 400 }
      );
    }

    if (!record) {
      return NextResponse.json(
        { 
          success: false,
          message: "记录不存在或已被删除",
          error: {
            type: "record_not_found",
            recordId,
            recordType
          }
        },
        { status: 404 }
      );
    }

    // 检查记录是否处于待撤回状态
    if (record.status !== "PENDING_WITHDRAWAL") {
      return NextResponse.json(
        { 
          success: false, 
          message: `记录状态不是待撤回状态，当前状态: ${record.status}`,
          error: {
            type: "invalid_status",
            currentStatus: record.status,
            expectedStatus: "PENDING_WITHDRAWAL"
          }
        },
        { status: 400 }
      );
    }

    // 查找待处理的撤回请求
    let withdrawalRequest;
    if (recordType === "predict") {
      withdrawalRequest = await prisma.withdrawalRequest.findFirst({
        where: {
          predictRecordId: recordId,
          status: "pending",
        },
      });
    } else if (recordType === "actual_user") {
      withdrawalRequest = await prisma.withdrawalRequest.findFirst({
        where: {
          actualUserRecordId: recordId,
          status: "pending",
        },
      });
    } else if (recordType === "actual_fin") {
      withdrawalRequest = await prisma.withdrawalRequest.findFirst({
        where: {
          actualFinRecordId: recordId,
          status: "pending",
        },
      });
    } else if (recordType === "audit") {
      withdrawalRequest = await prisma.withdrawalRequest.findFirst({
        where: {
          auditRecordId: recordId,
          status: "pending",
        },
      });
    }

    if (!withdrawalRequest) {
      return NextResponse.json(
        { 
          success: false, 
          message: "未找到待处理的撤回请求",
          error: {
            type: "no_pending_request",
            recordId,
            recordType
          }
        },
        { status: 404 }
      );
    }

    // 检查请求者是否有权限取消
    if (withdrawalRequest.requesterId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json(
        { 
          success: false, 
          message: "您没有权限取消此撤回请求",
          error: {
            type: "permission_denied",
            userId: session.user.id,
            userRole: session.user.role,
            requesterId: withdrawalRequest.requesterId
          }
        },
        { status: 403 }
      );
    }

    // 更新记录状态回到SUBMITTED
    if (recordType === "predict") {
      await prisma.predictRecord.update({
        where: { id: recordId },
        data: { status: "SUBMITTED" },
      });
    } else if (recordType === "actual_user") {
      await prisma.actualUserRecord.update({
        where: { id: recordId },
        data: { status: "SUBMITTED" },
      });
    } else if (recordType === "actual_fin") {
      await prisma.actualFinRecord.update({
        where: { id: recordId },
        data: { status: "SUBMITTED" },
      });
    } else if (recordType === "audit") {
      await prisma.auditRecord.update({
        where: { id: recordId },
        data: { status: "SUBMITTED" },
      });
    }

    // 更新撤回请求状态为已取消
    await prisma.withdrawalRequest.update({
      where: { id: withdrawalRequest.id },
      data: { status: "canceled" },
    });

    // 创建审计记录
    await prisma.recordAudit.create({
      data: {
        ...(recordType === "predict" ? { predictRecordId: recordId } : {}),
        ...(recordType === "actual_user" ? { actualUserRecordId: recordId } : {}),
        ...(recordType === "actual_fin" ? { actualFinRecordId: recordId } : {}),
        ...(recordType === "audit" ? { auditRecordId: recordId } : {}),
        userId: session.user.id,
        action: "cancel_withdrawal",
        timestamp: new Date(),
        oldValue: JSON.stringify(record),
        newValue: JSON.stringify({ ...record, status: "SUBMITTED" }),
        role: session.user.role,
        remarks: "用户取消撤回请求",
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: "撤回请求已取消" },
    });
  } catch (error) {
    console.error("Failed to cancel withdrawal request:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "取消撤回请求失败",
        error: {
          type: "server_error",
          details: error instanceof Error ? error.message : String(error)
        }
      },
      { status: 500 }
    );
  }
} 