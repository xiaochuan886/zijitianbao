import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// GET /api/withdrawal-config
// 获取所有撤回配置
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "未授权访问" },
        { status: 401 }
      );
    }
    
    const configs = await prisma.withdrawalConfig.findMany();
    
    return NextResponse.json({
      success: true,
      data: configs,
    });
  } catch (error) {
    console.error("获取撤回配置失败:", error);
    return NextResponse.json(
      { success: false, message: "获取撤回配置失败" },
      { status: 500 }
    );
  }
}

// POST /api/withdrawal-config
// 创建或更新撤回配置
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "未授权访问" },
        { status: 401 }
      );
    }
    
    // 检查是否是管理员
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    
    if (user?.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, message: "只有管理员可以创建或更新撤回配置" },
        { status: 403 }
      );
    }
    
    // 判断请求类型并解析
    const contentType = request.headers.get('content-type') || '';
    let body: any = {};
    
    // 处理不同格式的请求体
    if (contentType.includes('application/x-www-form-urlencoded')) {
      // 处理表单数据
      const formData = await request.formData().catch(async () => {
        // 如果formData解析失败，尝试手动解析
        const text = await request.text();
        console.log("原始表单数据:", text);
        
        const params = new URLSearchParams(text);
        const result = new FormData();
        params.forEach((value, key) => {
          result.append(key, value);
        });
        return result;
      });
      
      // 转换为普通对象
      formData.forEach((value, key) => {
        body[key] = value;
      });
      
      console.log("表单数据解析结果:", body);
    } else {
      // 处理JSON请求
      body = await request.json();
      console.log("JSON数据解析结果:", body);
    }
    
    console.log("最终请求体:", JSON.stringify(body, null, 2));
    
    // 提取和转换必要字段
    let moduleType = body.moduleType;
    let allowedStatuses = body.allowedStatuses;
    let timeLimit = parseInt(body.timeLimit as string) || 0;
    let maxAttempts = parseInt(body.maxAttempts as string) || 0;
    let requireApproval = body.requireApproval === 'true' || body.requireApproval === true;
    
    console.log("解析后的字段:", {
      moduleType,
      allowedStatuses,
      timeLimit,
      maxAttempts,
      requireApproval
    });
    
    // 验证必要字段
    if (!moduleType) {
      console.log("缺少必要参数: moduleType");
      return NextResponse.json(
        { success: false, message: "缺少必要的参数: moduleType" },
        { status: 400 }
      );
    }
    
    if (!allowedStatuses) {
      console.log("缺少必要参数: allowedStatuses");
      return NextResponse.json(
        { success: false, message: "缺少必要的参数: allowedStatuses" },
        { status: 400 }
      );
    }
    
    if (!timeLimit) {
      console.log("缺少必要参数: timeLimit");
      return NextResponse.json(
        { success: false, message: "缺少必要的参数: timeLimit" },
        { status: 400 }
      );
    }
    
    if (!maxAttempts) {
      console.log("缺少必要参数: maxAttempts");
      return NextResponse.json(
        { success: false, message: "缺少必要的参数: maxAttempts" },
        { status: 400 }
      );
    }
    
    // 查找现有配置
    const existingConfig = await prisma.withdrawalConfig.findFirst({
      where: { moduleType },
    });
    
    let config;
    
    if (existingConfig) {
      // 更新现有配置
      config = await prisma.withdrawalConfig.update({
        where: { id: existingConfig.id },
        data: {
          allowedStatuses: typeof allowedStatuses === 'string' 
            ? allowedStatuses 
            : JSON.stringify(allowedStatuses),
          timeLimit,
          maxAttempts,
          requireApproval: requireApproval ?? true,
        },
      });
    } else {
      // 创建新配置
      config = await prisma.withdrawalConfig.create({
        data: {
          moduleType,
          allowedStatuses: typeof allowedStatuses === 'string' 
            ? allowedStatuses 
            : JSON.stringify(allowedStatuses),
          timeLimit,
          maxAttempts,
          requireApproval: requireApproval ?? true,
        },
      });
    }
    
    return NextResponse.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error("创建或更新撤回配置失败:", error);
    return NextResponse.json(
      { success: false, message: "创建或更新撤回配置失败" },
      { status: 500 }
    );
  }
}

// DELETE /api/withdrawal-config
// 删除所有撤回配置（仅用于测试）
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, message: "未授权访问" },
        { status: 401 }
      );
    }
    
    // 检查是否是管理员
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    
    if (user?.role !== Role.ADMIN) {
      return NextResponse.json(
        { success: false, message: "只有管理员可以删除撤回配置" },
        { status: 403 }
      );
    }
    
    // 删除所有撤回配置
    await prisma.withdrawalConfig.deleteMany({});
    
    return NextResponse.json({
      success: true,
      message: "所有撤回配置已删除",
    });
  } catch (error) {
    console.error("删除撤回配置失败:", error);
    return NextResponse.json(
      { success: false, message: "删除撤回配置失败" },
      { status: 500 }
    );
  }
} 