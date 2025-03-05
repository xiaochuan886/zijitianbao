import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "未授权" },
        { status: 401 }
      );
    }

    const id = params.id;
    const userId = session.user.id;

    // 检查通知是否存在且属于当前用户
    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!notification) {
      return NextResponse.json(
        { success: false, message: "通知不存在或不属于您" },
        { status: 404 }
      );
    }

    // 标记为已读
    await prisma.notification.update({
      where: { id },
      data: { 
        isRead: true,
        readAt: new Date()
      },
    });

    return NextResponse.json({
      success: true,
      message: "通知已标记为已读",
    });
  } catch (error) {
    console.error("标记通知为已读失败:", error);
    return NextResponse.json(
      { success: false, message: "标记通知为已读失败" },
      { status: 500 }
    );
  }
} 