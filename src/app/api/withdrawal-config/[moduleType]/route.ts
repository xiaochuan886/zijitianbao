import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

// 获取特定模块的撤回配置
export async function GET(
  request: Request,
  { params }: { params: { moduleType: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { moduleType } = params;
    if (!moduleType) {
      return NextResponse.json(
        { error: "Module type is required" },
        { status: 400 }
      );
    }

    const config = await prisma.withdrawalConfig.findFirst({
      where: {
        moduleType,
      },
    });

    if (!config) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("Failed to fetch withdrawal config:", error);
    return NextResponse.json(
      { error: "Failed to fetch withdrawal config" },
      { status: 500 }
    );
  }
} 