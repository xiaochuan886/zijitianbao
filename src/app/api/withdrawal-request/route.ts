import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// 获取撤回请求列表
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const status = searchParams.get("status");
    const moduleType = searchParams.get("moduleType");

    // 构建查询条件
    const where: any = {};
    
    // 如果不是管理员，只能查看自己的请求
    if (session.user.role !== "ADMIN") {
      where.requesterId = session.user.id;
    }
    
    // 根据状态筛选
    if (status) {
      where.status = status;
    }
    
    // 根据模块类型筛选
    if (moduleType) {
      if (moduleType === "predict") {
        where.predictRecordId = { not: null };
      } else if (moduleType === "actual_user") {
        where.actualUserRecordId = { not: null };
      } else if (moduleType === "actual_fin") {
        where.actualFinRecordId = { not: null };
      } else if (moduleType === "audit") {
        where.auditRecordId = { not: null };
      }
    }

    // 查询总数
    const total = await prisma.withdrawalRequest.count({ where });
    
    // 查询数据
    const requests = await prisma.withdrawalRequest.findMany({
      where,
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
            detailedFundNeedId: true,
            detailedFundNeed: {
              select: {
                id: true,
                subProject: {
                  select: {
                    id: true,
                    name: true,
                    project: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        actualUserRecord: {
          select: {
            id: true,
            status: true,
          },
        },
        actualFinRecord: {
          select: {
            id: true,
            status: true,
          },
        },
        auditRecord: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        requests,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch withdrawal requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch withdrawal requests" },
      { status: 500 }
    );
  }
}

// 创建撤回请求
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { recordId, recordType, reason } = data;
    
    console.log("撤回请求数据:", { recordId, recordType, reason });

    // 验证必填字段
    if (!recordId || !recordType || !reason) {
      console.log("缺少必填字段", { recordId, recordType, reason });
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 检查记录是否存在
    let record;
    let recordData: any = {};
    
    if (recordType === "predict") {
      record = await prisma.predictRecord.findUnique({
        where: { id: recordId },
      });
      console.log("找到预测记录:", record);
      if (record) {
        recordData.predictRecordId = recordId;
        recordData.status = record.status;
        recordData.submittedAt = record.submittedAt;
      }
    } else if (recordType === "actual_user") {
      record = await prisma.actualUserRecord.findUnique({
        where: { id: recordId },
      });
      if (record) {
        recordData.actualUserRecordId = recordId;
        recordData.status = record.status;
        recordData.submittedAt = record.submittedAt;
      }
    } else if (recordType === "actual_fin") {
      record = await prisma.actualFinRecord.findUnique({
        where: { id: recordId },
      });
      if (record) {
        recordData.actualFinRecordId = recordId;
        recordData.status = record.status;
        recordData.submittedAt = record.submittedAt;
      }
    } else if (recordType === "audit") {
      record = await prisma.auditRecord.findUnique({
        where: { id: recordId },
      });
      if (record) {
        recordData.auditRecordId = recordId;
        recordData.status = record.status;
        recordData.submittedAt = record.submittedAt;
      }
    } else {
      return NextResponse.json(
        { error: "Invalid record type" },
        { status: 400 }
      );
    }

    if (!record) {
      return NextResponse.json(
        { error: "Record not found" },
        { status: 404 }
      );
    }

    // 查找撤回配置
    const config = await prisma.withdrawalConfig.findFirst({
      where: {
        moduleType: recordType,
      },
    });

    if (!config) {
      return NextResponse.json(
        { error: "Withdrawal configuration not found" },
        { status: 400 }
      );
    }

    // 检查是否超过时间限制
    if (recordData.submittedAt) {
      const submittedAt = new Date(recordData.submittedAt);
      const now = new Date();
      const hoursSinceSubmission = (now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60);
      
      console.log(`提交时间: ${submittedAt} 已过时间(小时): ${hoursSinceSubmission} 时间限制(小时): ${config?.timeLimit}`);
      
      if (config?.timeLimit && hoursSinceSubmission > config.timeLimit) {
        return NextResponse.json(
          { 
            success: false, 
            message: `超过撤回时间限制，提交后${config.timeLimit}小时内可撤回，已过${Math.floor(hoursSinceSubmission)}小时`,
            error: {
              type: "time_limit_exceeded",
              hoursSinceSubmission,
              timeLimit: config.timeLimit
            }
          },
          { status: 400 }
        );
      }
    }

    // 检查是否超过最大撤回次数
    const withdrawalCount = await prisma.withdrawalRequest.count({
      where: {
        ...(recordType === "predict" ? { predictRecordId: recordId } : {}),
        ...(recordType === "actual_user" ? { actualUserRecordId: recordId } : {}),
        ...(recordType === "actual_fin" ? { actualFinRecordId: recordId } : {}),
        ...(recordType === "audit" ? { auditRecordId: recordId } : {}),
      },
    });

    if (config?.maxAttempts && withdrawalCount >= config.maxAttempts) {
      return NextResponse.json(
        { 
          success: false, 
          message: `已达到最大撤回次数(${config.maxAttempts}次)`,
          error: {
            type: "max_attempts_exceeded",
            count: withdrawalCount,
            maxAttempts: config.maxAttempts
          }
        },
        { status: 400 }
      );
    }

    // 检查记录状态是否允许撤回
    const allowedStatuses = config?.allowedStatuses ? JSON.parse(config.allowedStatuses) : [];
    
    console.log(`允许撤回的状态: ${allowedStatuses} 当前记录状态: ${record.status}`);
    
    if (!allowedStatuses.includes(record.status)) {
      return NextResponse.json(
        { 
          success: false, 
          message: `当前记录状态不允许撤回，当前状态: ${record.status}，允许状态: ${allowedStatuses.join(", ")}`,
          error: {
            type: "invalid_status",
            currentStatus: record.status,
            allowedStatuses
          }
        },
        { status: 400 }
      );
    }

    // 检查是否已有待处理的撤回请求
    const pendingRequest = await prisma.withdrawalRequest.findFirst({
      where: {
        ...(recordType === "predict" ? { predictRecordId: recordId } : {}),
        ...(recordType === "actual_user" ? { actualUserRecordId: recordId } : {}),
        ...(recordType === "actual_fin" ? { actualFinRecordId: recordId } : {}),
        ...(recordType === "audit" ? { auditRecordId: recordId } : {}),
        status: "pending",
      },
    });

    console.log("已有的待处理撤回请求查询条件:", {
      recordType,
      recordId,
      pendingRequestFound: !!pendingRequest
    });

    if (pendingRequest) {
      return NextResponse.json(
        { 
          success: false, 
          message: "该记录已有待处理的撤回请求",
          error: {
            type: "already_pending",
            requestId: pendingRequest.id
          }
        },
        { status: 400 }
      );
    }

    // 从recordData中提取创建撤回请求需要的字段
    const requestData = {
      ...(recordType === "predict" && recordData.predictRecordId ? { predictRecordId: recordData.predictRecordId } : {}),
      ...(recordType === "actual_user" && recordData.actualUserRecordId ? { actualUserRecordId: recordData.actualUserRecordId } : {}),
      ...(recordType === "actual_fin" && recordData.actualFinRecordId ? { actualFinRecordId: recordData.actualFinRecordId } : {}),
      ...(recordType === "audit" && recordData.auditRecordId ? { auditRecordId: recordData.auditRecordId } : {}),
    };
    
    // 创建撤回请求
    const withdrawalRequest = await prisma.withdrawalRequest.create({
      data: {
        ...requestData,
        requesterId: session.user.id,
        reason,
        status: "pending",
      },
    });

    // 如果不需要审批，直接处理撤回
    if (!config.requireApproval) {
      // 更新记录状态
      if (recordType === "predict" && recordData.predictRecordId) {
        await prisma.predictRecord.update({
          where: { id: recordData.predictRecordId },
          data: { status: "PENDING_WITHDRAWAL" },
        });
      } else if (recordType === "actual_user" && recordData.actualUserRecordId) {
        await prisma.actualUserRecord.update({
          where: { id: recordData.actualUserRecordId },
          data: { status: "PENDING_WITHDRAWAL" },
        });
      } else if (recordType === "actual_fin" && recordData.actualFinRecordId) {
        await prisma.actualFinRecord.update({
          where: { id: recordData.actualFinRecordId },
          data: { status: "PENDING_WITHDRAWAL" },
        });
      } else if (recordType === "audit" && recordData.auditRecordId) {
        await prisma.auditRecord.update({
          where: { id: recordData.auditRecordId },
          data: { status: "PENDING_WITHDRAWAL" },
        });
      }

      // 创建审计记录
      await prisma.recordAudit.create({
        data: {
          ...(recordType === "predict" ? { predictRecordId: recordData.predictRecordId } : {}),
          ...(recordType === "actual_user" ? { actualUserRecordId: recordData.actualUserRecordId } : {}),
          ...(recordType === "actual_fin" ? { actualFinRecordId: recordData.actualFinRecordId } : {}),
          ...(recordType === "audit" ? { auditRecordId: recordData.auditRecordId } : {}),
          userId: session.user.id,
          action: "withdrawn",
          timestamp: new Date(),
          oldValue: JSON.stringify(record),
          newValue: JSON.stringify({ ...record, status: "withdrawn" }),
          role: session.user.role,
          remarks: reason,
        },
      });

      // 更新撤回请求状态
      await prisma.withdrawalRequest.update({
        where: { id: withdrawalRequest.id },
        data: { status: "approved" },
      });
    } else {
      // 需要审批，发送通知给管理员
      const admins = await prisma.user.findMany({
        where: {
          role: "ADMIN",
        },
      });

      // 创建通知
      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            title: "新的撤回申请",
            content: `用户 ${session.user.name} 申请撤回记录，原因：${reason}`,
            type: "withdrawal_request",
            relatedId: withdrawalRequest.id,
            relatedType: recordType,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: withdrawalRequest,
    });
  } catch (error) {
    console.error("Failed to create withdrawal request:", error);
    return NextResponse.json(
      { error: "Failed to create withdrawal request" },
      { status: 500 }
    );
  }
} 