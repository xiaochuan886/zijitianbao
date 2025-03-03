import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// 验证请求体
const requestSchema = z.object({
  records: z.array(
    z.object({
      id: z.string(),
    })
  ),
});

export async function POST(request: NextRequest) {
  try {
    // 获取会话信息
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    // 解析请求体
    const body = await request.json();
    const validationResult = requestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "请求数据格式错误", details: validationResult.error },
        { status: 400 }
      );
    }

    const { records } = validationResult.data;

    // 过滤出真实ID记录（不处理临时ID）
    const realRecordIds = records
      .filter(record => !record.id.startsWith("temp_"))
      .map(record => record.id);

    if (realRecordIds.length === 0) {
      return NextResponse.json({ error: "没有有效的记录ID" }, { status: 400 });
    }

    console.log(`提交${realRecordIds.length}条记录`);

    // 更新记录状态为已提交
    const updateResult = await prisma.predictRecord.updateMany({
      where: {
        id: {
          in: realRecordIds
        }
      },
      data: {
        status: "SUBMITTED",
        submittedAt: new Date(),
        submittedBy: session.user.id
      }
    });

    return NextResponse.json({
      message: `成功提交${updateResult.count}条记录`,
      count: updateResult.count
    });
  } catch (error) {
    console.error("提交记录失败", error);
    return NextResponse.json({ error: "提交记录失败" }, { status: 500 });
  }
} 