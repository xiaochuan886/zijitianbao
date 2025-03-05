import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// 获取通知列表
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const isRead = searchParams.get("isRead");
    const type = searchParams.get("type");

    // 构建查询条件
    const where: any = {
      userId: session.user.id,
    };

    // 根据已读状态筛选
    if (isRead !== null && isRead !== undefined) {
      where.isRead = isRead === "true";
    }

    // 根据通知类型筛选
    if (type) {
      where.type = type;
    }

    // 查询总数
    const total = await prisma.notification.count({ where });

    // 查询数据
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

// 标记通知为已读
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { id, all } = data;

    // 如果提供了id，标记单个通知为已读
    if (id) {
      // 检查通知是否存在且属于当前用户
      const notification = await prisma.notification.findFirst({
        where: {
          id,
          userId: session.user.id,
        },
      });

      if (!notification) {
        return NextResponse.json(
          { error: "Notification not found or does not belong to you" },
          { status: 404 }
        );
      }

      // 标记为已读
      await prisma.notification.update({
        where: { id },
        data: { isRead: true },
      });

      return NextResponse.json({
        success: true,
        message: "Notification marked as read",
      });
    }
    // 如果all为true，标记所有通知为已读
    else if (all === true) {
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: "All notifications marked as read",
      });
    } else {
      return NextResponse.json(
        { error: "Either 'id' or 'all' parameter is required" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}

// 获取未读通知数量
export async function HEAD(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(null, { status: 401 });
    }

    // 查询未读通知数量
    const count = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    });

    // 将数量放在响应头中
    return new NextResponse(null, {
      headers: {
        "X-Unread-Count": count.toString(),
      },
    });
  } catch (error) {
    console.error("Failed to get unread notification count:", error);
    return new NextResponse(null, { status: 500 });
  }
} 