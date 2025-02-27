import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { Prisma } from "@prisma/client";
import { z } from "zod";

// 提交资金需求预测
export async function POST(req: NextRequest) {
  try {
    // 验证用户会话
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "未授权操作" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    
    // 基本参数校验
    if (!body.records || !body.projectInfo) {
      return NextResponse.json({ error: "提交数据格式不正确" }, { status: 400 });
    }

    // 获取临时记录列表，用于确定检查项目
    const tempRecords = body.projectInfo.tempRecords || [];
    if (tempRecords.length === 0) {
      return NextResponse.json({ error: "没有可提交的记录" }, { status: 400 });
    }

    // 整理出所有相关的子项目ID，用于检查用户是否已提交过
    const subProjectIds = [...new Set(tempRecords.map((record: any) => record.subProjectId))];
    
    // 获取当前月份
    const { year, month } = body.projectInfo.nextMonth;
    
    // 检查用户是否已经对这些项目提交过预测
    const existingSubmissions = await db.record.findMany({
      where: {
        subProjectId: { in: subProjectIds },
        year: year,
        month: month,
        status: "submitted",
        submittedBy: userId
      }
    });

    if (existingSubmissions.length > 0) {
      return NextResponse.json({ 
        error: "您已经对部分项目提交过预测，不能重复提交",
        affectedProjects: existingSubmissions.map(e => e.subProjectId)
      }, { status: 400 });
    }
    
    // 开始事务
    const result = await db.$transaction(async (tx) => {
      let count = 0;
      
      // 处理所有记录
      for (const [id, value] of Object.entries(body.records)) {
        // 检查是否为临时记录ID
        if (id.startsWith('temp-')) {
          // 解析临时ID获取信息
          const [_, subProjectId, fundTypeId, yearStr, monthStr] = id.split('-');
          
          if (!subProjectId || !fundTypeId || !yearStr || !monthStr) {
            continue;
          }
          
          // 检查是否有其他用户已经提交过该记录
          const existingRecord = await tx.record.findFirst({
            where: {
              subProjectId: subProjectId,
              year: parseInt(yearStr),
              month: parseInt(monthStr),
              status: "submitted"
            }
          });
          
          if (existingRecord) {
            // 如果其他用户已提交，则跳过此记录，不覆盖
            continue;
          }
          
          // 创建新记录
          await tx.record.create({
            data: {
              subProjectId: subProjectId,
              year: parseInt(yearStr),
              month: parseInt(monthStr),
              predicted: value as number,
              status: "submitted",
              submittedBy: userId,
              submittedAt: new Date(),
              remark: body.remarks[id] || ""
            }
          });
          
          count++;
        } else {
          // 处理已存在的记录
          const record = await tx.record.findUnique({
            where: { id }
          });
          
          if (record) {
            // 检查记录状态，只有草稿状态的记录可以被提交
            if (record.status === "draft") {
              await tx.record.update({
                where: { id },
                data: {
                  predicted: value as number,
                  status: "submitted",
                  submittedBy: userId,
                  submittedAt: new Date(),
                  remark: body.remarks[id] || ""
                }
              });
              
              count++;
            }
          }
        }
      }
      
      return { count };
    });
    
    return NextResponse.json({ 
      message: "提交成功", 
      count: result.count 
    });
    
  } catch (error) {
    console.error("提交资金需求预测失败", error);
    return NextResponse.json({ error: "提交失败，请稍后重试" }, { status: 500 });
  }
} 