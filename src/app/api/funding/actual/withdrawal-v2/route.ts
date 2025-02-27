import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// 验证请求数据
const requestSchema = z.object({
  recordId: z.string(),
  reason: z.string().min(5, "撤回原因至少需要5个字符").max(500, "撤回原因最多500个字符")
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { recordId, reason } = body;
    
    console.log("收到撤回申请请求:", { recordId, reason });
    
    // 验证请求数据
    const result = requestSchema.safeParse(body);
    if (!result.success) {
      console.error("请求数据验证失败:", result.error.format());
      return NextResponse.json({ 
        error: "请求数据格式错误", 
        details: result.error.format() 
      }, { status: 400 });
    }
    
    // 记录数据库查询过程
    console.log("准备查询记录:", recordId);
    
    // 查找记录是否存在
    let record = await db.record.findUnique({
      where: { id: recordId }
    });
    
    // 如果直接按ID查不到记录，尝试查找该ID对应的项目或子项目的记录
    if (!record) {
      console.log("直接查询记录未找到，尝试查找关联记录");
      
      // 尝试查找子项目ID对应的记录
      const subProject = await db.subProject.findUnique({
        where: { id: recordId },
        include: {
          records: {
            orderBy: {
              updatedAt: 'desc'
            },
            take: 1
          }
        }
      });
      
      if (subProject && subProject.records.length > 0) {
        console.log("通过子项目ID找到记录:", subProject.records[0].id);
        record = subProject.records[0];
      } else {
        // 尝试查找项目ID对应的记录
        const project = await db.project.findUnique({
          where: { id: recordId },
          include: {
            subProjects: {
              include: {
                records: {
                  orderBy: {
                    updatedAt: 'desc'
                  },
                  take: 1
                }
              }
            }
          }
        });
        
        if (project) {
          // 找到有记录的第一个子项目
          for (const sp of project.subProjects) {
            if (sp.records.length > 0) {
              console.log("通过项目ID找到记录:", sp.records[0].id);
              record = sp.records[0];
              break;
            }
          }
        }
      }
    }
    
    console.log("查询结果:", record ? `找到记录ID: ${record.id}` : "记录不存在");
    
    if (!record) {
      // 返回更详细的错误信息
      return NextResponse.json({ 
        error: "记录不存在",
        message: "找不到对应的记录，请确认记录ID是否正确"
      }, { status: 404 });
    }
    
    // 记录状态检查
    console.log("记录当前状态:", record.status);
    
    // 检查记录状态是否为已提交
    if (record.status !== "submitted") {
      return NextResponse.json({ 
        error: "只有已提交的记录才能申请撤回",
        currentStatus: record.status
      }, { status: 400 });
    }
    
    console.log("准备更新记录状态为待撤回, 记录ID:", record.id);
    
    // 更新记录状态为"待撤回"
    await db.record.update({
      where: { id: record.id },
      data: {
        status: "pending_withdrawal",
        remark: record.remark ? `${record.remark} | 撤回原因: ${reason}` : `撤回原因: ${reason}`
      }
    });
    
    console.log("记录状态已更新为待撤回");
    
    return NextResponse.json({ 
      success: true,
      message: "撤回申请已提交，等待管理员审核",
      received: { recordId, reason },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error("处理撤回申请失败:", error);
    return NextResponse.json({ 
      error: "处理撤回申请失败",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return NextResponse.json({
    message: "撤回API GET测试成功",
    timestamp: new Date().toISOString()
  });
} 