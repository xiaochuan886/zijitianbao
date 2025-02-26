import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 仅返回成功响应，不做任何数据库操作
    return NextResponse.json({
      success: true,
      message: "API路由正常工作"
    });
  } catch (error) {
    console.error("测试API出错", error);
    return NextResponse.json(
      { error: "测试API出错" },
      { status: 500 }
    );
  }
} 