import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { Prisma } from "@prisma/client";
import { z } from "zod";

// 提交实际支付
export async function POST(req: NextRequest) {
  try {
    // 验证用户会话
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "未授权操作" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    
    // 获取是否为用户填报（默认为用户填报）
    const isUserReport = body.isUserReport !== false;
    
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
    const subProjectIds: string[] = Array.from(
      new Set(tempRecords.map((record: any) => record.subProjectId as string))
    );
    
    // 获取当前月份
    const { year, month } = body.projectInfo.nextMonth;
    
    // 确定状态字段
    const statusField = isUserReport ? "actualUserStatus" : "actualFinanceStatus";
    
    // 检查用户是否已经对这些项目提交过实际支付
    const existingSubmissions = await db.record.findMany({
      where: {
        subProjectId: { in: subProjectIds },
        year: year,
        month: month,
        [statusField]: "submitted",
        submittedBy: userId,
        ...(isUserReport ? { actualUser: { not: null } } : { actualFinance: { not: null } })
      }
    });

    if (existingSubmissions.length > 0) {
      return NextResponse.json({ 
        error: "您已经对部分项目提交过实际支付，不能重复提交",
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
              month: parseInt(monthStr)
            }
          });
          
          if (existingRecord) {
            // 如果记录已存在，则更新记录
            const updateData: Prisma.RecordUpdateInput = {
              status: "submitted", // 保留status字段兼容旧代码
              [statusField]: "submitted", // 使用新的状态字段
              submittedBy: userId,
              submittedAt: new Date(),
              remark: body.remarks[id] || existingRecord.remark
            };
            
            // 根据角色设置不同的字段
            if (isUserReport) {
              updateData.actualUser = value as number;
            } else {
              updateData.actualFinance = value as number;
            }
            
            await tx.record.update({
              where: { id: existingRecord.id },
              data: updateData
            });
          } else {
            // 创建新记录
            const createData: Prisma.RecordUncheckedCreateInput = {
              subProjectId: subProjectId,
              year: parseInt(yearStr),
              month: parseInt(monthStr),
              status: "submitted", // 保留status字段兼容旧代码
              [statusField]: "submitted", // 使用新的状态字段
              submittedBy: userId,
              submittedAt: new Date(),
              remark: body.remarks[id] || ""
            };
            
            // 根据角色设置不同的字段
            if (isUserReport) {
              createData.actualUser = value as number;
            } else {
              createData.actualFinance = value as number;
            }
            
            await tx.record.create({
              data: createData
            });
          }
          
          count++;
        } else {
          // 处理已存在的记录
          const record = await tx.record.findUnique({
            where: { id }
          });
          
          if (record) {
            // 检查记录状态，只有草稿状态的记录可以被提交
            const currentStatus = isUserReport ? record.actualUserStatus : record.actualFinanceStatus;
            if (currentStatus === "draft" || record.status === "draft") {
              const updateData: Prisma.RecordUpdateInput = {
                status: "submitted", // 保留status字段兼容旧代码
                [statusField]: "submitted", // 使用新的状态字段
                submittedBy: userId,
                submittedAt: new Date(),
                remark: body.remarks[id] || record.remark
              };
              
              // 根据角色设置不同的字段
              if (isUserReport) {
                updateData.actualUser = value as number;
              } else {
                updateData.actualFinance = value as number;
              }
              
              await tx.record.update({
                where: { id },
                data: updateData
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
    console.error("提交实际支付失败", error);
    return NextResponse.json({ error: "提交失败，请稍后重试" }, { status: 500 });
  }
} 