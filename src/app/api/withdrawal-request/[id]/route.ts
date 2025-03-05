import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { RecordStatus } from "@/lib/enums";

// 获取单个撤回请求详情
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { error: "Withdrawal request ID is required" },
        { status: 400 }
      );
    }

    // 查询撤回请求
    const withdrawalRequest = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        predictRecord: {
          select: {
            id: true,
            status: true,
            year: true,
            month: true,
            amount: true,
            submittedAt: true,
            createdAt: true,
          },
        },
        actualUserRecord: {
          select: {
            id: true,
            status: true,
            submittedAt: true,
            createdAt: true,
          },
        },
        actualFinRecord: {
          select: {
            id: true,
            status: true,
            submittedAt: true,
            createdAt: true,
          },
        },
        auditRecord: {
          select: {
            id: true,
            status: true,
            submittedAt: true,
            createdAt: true,
          },
        },
      },
    });

    if (!withdrawalRequest) {
      return NextResponse.json(
        { error: "Withdrawal request not found" },
        { status: 404 }
      );
    }

    // 检查权限：只有管理员或请求者本人可以查看
    if (
      session.user.role !== "ADMIN" &&
      withdrawalRequest.requesterId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "You don't have permission to view this request" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: withdrawalRequest,
    });
  } catch (error) {
    console.error("Failed to fetch withdrawal request:", error);
    return NextResponse.json(
      { error: "Failed to fetch withdrawal request" },
      { status: 500 }
    );
  }
}

// 审批撤回请求
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 只有管理员可以审批
    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Only administrators can approve withdrawal requests" },
        { status: 403 }
      );
    }

    const id = params.id;
    if (!id) {
      return NextResponse.json(
        { error: "Withdrawal request ID is required" },
        { status: 400 }
      );
    }

    const data = await request.json();
    const { status, remarks } = data;

    // 验证状态
    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    // 查询撤回请求
    const withdrawalRequest = await prisma.withdrawalRequest.findUnique({
      where: { id },
    });

    if (!withdrawalRequest) {
      return NextResponse.json(
        { error: "Withdrawal request not found" },
        { status: 404 }
      );
    }

    // 检查请求状态是否为待处理
    if (withdrawalRequest.status !== "pending") {
      return NextResponse.json(
        { error: "This request has already been processed" },
        { status: 400 }
      );
    }

    // 更新撤回请求状态
    const updatedRequest = await prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status,
        admin: { connect: { id: session.user.id } },
        reviewedAt: new Date(),
        adminComment: remarks || null,
      },
    });

    // 如果批准撤回，更新相关记录状态
    if (status === "approved") {
      let recordId;
      let recordType;

      if (withdrawalRequest.predictRecordId) {
        recordId = withdrawalRequest.predictRecordId;
        recordType = "predict";
        
        // 获取记录当前状态
        const record = await prisma.predictRecord.findUnique({
          where: { id: recordId },
        });
        
        if (record) {
          // 更新记录状态
          await prisma.predictRecord.update({
            where: { id: recordId },
            data: { status: "PENDING_WITHDRAWAL" },
          });
          
          // 创建审计记录
          await prisma.recordAudit.create({
            data: {
              predictRecordId: recordId,
              userId: session.user.id,
              action: "withdrawn",
              timestamp: new Date(),
              oldValue: JSON.stringify(record),
              newValue: JSON.stringify({ ...record, status: "PENDING_WITHDRAWAL" }),
              role: session.user.role,
              remarks: `管理员批准撤回申请。${remarks || ""}`,
            },
          });
        }
      } else if (withdrawalRequest.actualUserRecordId) {
        recordId = withdrawalRequest.actualUserRecordId;
        recordType = "actual_user";
        
        // 获取记录当前状态
        const record = await prisma.actualUserRecord.findUnique({
          where: { id: recordId },
        });
        
        if (record) {
          // 更新记录状态
          await prisma.actualUserRecord.update({
            where: { id: recordId },
            data: { status: "PENDING_WITHDRAWAL" },
          });
          
          // 创建审计记录
          await prisma.recordAudit.create({
            data: {
              actualUserRecordId: recordId,
              userId: session.user.id,
              action: "withdrawn",
              timestamp: new Date(),
              oldValue: JSON.stringify(record),
              newValue: JSON.stringify({ ...record, status: "PENDING_WITHDRAWAL" }),
              role: session.user.role,
              remarks: `管理员批准撤回申请。${remarks || ""}`,
            },
          });
        }
      } else if (withdrawalRequest.actualFinRecordId) {
        recordId = withdrawalRequest.actualFinRecordId;
        recordType = "actual_fin";
        
        // 获取记录当前状态
        const record = await prisma.actualFinRecord.findUnique({
          where: { id: recordId },
        });
        
        if (record) {
          // 更新记录状态
          await prisma.actualFinRecord.update({
            where: { id: recordId },
            data: { status: "PENDING_WITHDRAWAL" },
          });
          
          // 创建审计记录
          await prisma.recordAudit.create({
            data: {
              actualFinRecordId: recordId,
              userId: session.user.id,
              action: "withdrawn",
              timestamp: new Date(),
              oldValue: JSON.stringify(record),
              newValue: JSON.stringify({ ...record, status: "PENDING_WITHDRAWAL" }),
              role: session.user.role,
              remarks: `管理员批准撤回申请。${remarks || ""}`,
            },
          });
        }
      } else if (withdrawalRequest.auditRecordId) {
        recordId = withdrawalRequest.auditRecordId;
        recordType = "audit";
        
        // 获取记录当前状态
        const record = await prisma.auditRecord.findUnique({
          where: { id: recordId },
        });
        
        if (record) {
          // 更新记录状态
          await prisma.auditRecord.update({
            where: { id: recordId },
            data: { status: "PENDING_WITHDRAWAL" },
          });
          
          // 创建审计记录
          await prisma.recordAudit.create({
            data: {
              auditRecordId: recordId,
              userId: session.user.id,
              action: "withdrawn",
              timestamp: new Date(),
              oldValue: JSON.stringify(record),
              newValue: JSON.stringify({ ...record, status: "PENDING_WITHDRAWAL" }),
              role: session.user.role,
              remarks: `管理员批准撤回申请。${remarks || ""}`,
            },
          });
        }
      }

      // 创建通知
      // 通知请求者
      await prisma.$transaction([
        prisma.notification.create({
          data: {
            userId: withdrawalRequest.requesterId,
            title: `撤回请求已${status === "approved" ? "批准" : "拒绝"}`,
            content: `您的撤回请求已${status === "approved" ? "批准" : "拒绝"}。${remarks ? `备注: ${remarks}` : ""}`,
            type: status === "approved" ? "withdrawal_approved" : "withdrawal_rejected",
            relatedId: id,
            relatedType: "withdrawal_request",
          },
        })
      ]);
    } else if (status === "rejected") {
      // 发送通知给请求者
      await prisma.$transaction([
        prisma.notification.create({
          data: {
            userId: withdrawalRequest.requesterId,
            title: "撤回请求已拒绝",
            content: `您的撤回请求已被拒绝。${remarks ? `原因：${remarks}` : ""}`,
            type: "withdrawal_rejected",
            relatedId: id,
            relatedType: "withdrawal_request",
          },
        })
      ]);
    }

    return NextResponse.json({
      success: true,
      data: updatedRequest,
    });
  } catch (error) {
    console.error("Failed to process withdrawal request:", error);
    return NextResponse.json(
      { error: "Failed to process withdrawal request" },
      { status: 500 }
    );
  }
} 