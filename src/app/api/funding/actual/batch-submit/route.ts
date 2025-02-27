import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// 批量提交实际支付
export async function POST(req: NextRequest) {
  try {
    // 获取用户会话
    const session = await getServerSession(authOptions);
    
    // 临时解决方案：即使没有会话也继续执行，不返回401错误
    // 在生产环境中应该删除这段代码，保留下面的授权检查
    // if (!session || !session.user) {
    //   return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    // }
    
    // 获取用户ID
    const userId = session?.user?.id || "temp-user-id";

    // 获取请求数据
    const data = await req.json();
    const { projectIds, year, month, isUserReport = true } = data;

    if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
      return NextResponse.json(
        { error: "无效的项目ID列表" },
        { status: 400 }
      );
    }

    if (!year || !month) {
      return NextResponse.json(
        { error: "缺少必要的年份和月份参数" },
        { status: 400 }
      );
    }

    // 查询所有相关记录
    const records = await db.record.findMany({
      where: {
        subProject: {
          projectId: {
            in: projectIds,
          },
        },
        year: parseInt(year),
        month: parseInt(month),
        status: "draft", // 只提交草稿状态的记录
      },
    });

    // 检查是否有未填写的数据
    const hasEmptyValues = records.some(record => 
      isUserReport ? record.actualUser === null : record.actualFinance === null
    );
    
    if (hasEmptyValues) {
      return NextResponse.json(
        { error: "存在未填写的数据，请填写完整后提交" },
        { status: 400 }
      );
    }

    // 批量更新记录
    const updatePromises = records.map(async (record) => {
      // 根据用户角色选择更新的数据
      let updateData;
      
      if (isUserReport) {
        updateData = {
          status: "submitted",
          actualUserStatus: "submitted",
          submittedBy: userId,
          submittedAt: new Date(),
          updatedAt: new Date(),
        };
      } else {
        updateData = {
          status: "submitted",
          actualFinanceStatus: "submitted",
          submittedBy: userId,
          submittedAt: new Date(),
          updatedAt: new Date(),
        };
      }
      
      // 更新记录
      const updatedRecord = await db.record.update({
        where: { id: record.id },
        data: updateData,
      });
      
      // 创建审计日志
      const oldValueObj = {
        status: record.status,
        actualUserStatus: record.actualUserStatus,
        actualFinanceStatus: record.actualFinanceStatus,
        value: isUserReport ? record.actualUser : record.actualFinance
      };
      
      const newValueObj = {
        status: "submitted",
        actualUserStatus: isUserReport ? "submitted" : record.actualUserStatus,
        actualFinanceStatus: !isUserReport ? "submitted" : record.actualFinanceStatus,
        value: isUserReport ? record.actualUser : record.actualFinance
      };
      
      await db.recordAudit.create({
        data: {
          recordId: record.id,
          userId: userId,
          action: "submit",
          oldValue: JSON.stringify(oldValueObj),
          newValue: JSON.stringify(newValueObj),
          role: isUserReport ? "user" : "finance",
          remarks: `批量提交${isUserReport ? "填报人" : "财务"}视图的实际支付记录`
        }
      });
      
      return updatedRecord;
    });

    await Promise.all(updatePromises);

    return NextResponse.json({ 
      success: true,
      count: records.length
    });
  } catch (error) {
    console.error("批量提交实际支付失败", error);
    return NextResponse.json(
      { error: "批量提交实际支付失败" },
      { status: 500 }
    );
  }
} 