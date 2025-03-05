import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "未授权" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 标记所有未读通知为已读
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "所有通知已标记为已读",
    });
  } catch (error) {
    console.error("标记所有通知为已读失败:", error);
    return NextResponse.json(
      { success: false, message: "标记所有通知为已读失败" },
      { status: 500 }
    );
  }
} 