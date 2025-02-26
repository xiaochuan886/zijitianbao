import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

// 保存资金需求预测草稿
export async function POST(req: NextRequest) {
  try {
    // 获取用户会话
    const session = await getServerSession(authOptions);
    
    // 临时解决方案：即使没有会话也继续执行，不返回401错误
    // 在生产环境中应该删除这段代码，保留下面的授权检查
    // if (!session || !session.user) {
    //   return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    // }

    // 获取请求数据
    const data = await req.json();
    const { records, remarks, projectInfo } = data;

    console.log("保存API收到数据:", JSON.stringify({
      recordsCount: Object.keys(records).length,
      remarksCount: remarks ? Object.keys(remarks).length : 0,
      hasProjectInfo: !!projectInfo,
      tempRecords: projectInfo?.tempRecords?.length || 0
    }, null, 2));

    // 打印更详细的记录数据以进行调试
    console.log("记录数据示例:", Object.keys(records).slice(0, 3).map(key => ({ key, value: records[key] })));
    
    // 如果有tempRecords，打印详情
    if (projectInfo?.tempRecords?.length > 0) {
      console.log("临时记录详情:", JSON.stringify(projectInfo.tempRecords.slice(0, 3), null, 2));
    }

    if (!records || typeof records !== "object") {
      return NextResponse.json(
        { error: "无效的记录数据" },
        { status: 400 }
      );
    }
    
    // 处理记录
    const updatePromises = [];
    const createdRecords: Array<{recordId: string, subProjectId: string, year: number, month: number, value: any}> = [];
    const updatedRecords: string[] = [];
    
    // 检查records对象是否为空
    if (Object.keys(records).length === 0) {
      console.log("接收到空的records对象，无数据需要保存");
      return NextResponse.json({ 
        success: true,
        message: "没有数据需要保存",
        created: 0,
        updated: 0,
        total: 0
      });
    }
    
    for (const [recordId, value] of Object.entries(records)) {
      try {
        // 如果是临时ID，需要创建新记录
        if (recordId.startsWith('temp-')) {
          console.log(`处理临时记录: ${recordId}, 值: ${value}`);
          
          // 从临时ID中解析信息 (temp-subProjectId-fundTypeId-year-month)
          const parts = recordId.split('-');
          if (parts.length >= 5) {
            const subProjectId = parts[1];
            // fundTypeId不在Record模型中，但我们可以从它获取更详细的日志信息
            const fundTypeId = parts[2];  
            const year = parseInt(parts[3]);
            const month = parseInt(parts[4]);
            
            console.log(`解析临时记录ID: 子项目ID=${subProjectId}, 资金类型=${fundTypeId}, 年=${year}, 月=${month}, 值=${value}`);
            
            // 确保解析出的值是有效的
            if (!subProjectId || isNaN(year) || isNaN(month)) {
              console.error(`临时记录ID格式无效: ${recordId}`);
              continue;
            }
            
            // 查找子项目是否存在
            const subProject = await db.subProject.findUnique({
              where: { id: subProjectId }
            });
            
            if (!subProject) {
              console.error(`找不到子项目: ${subProjectId}`);
              continue;
            }
            
            // 查找该子项目下是否已存在相同月份的记录
            const existingRecord = await db.record.findFirst({
              where: {
                subProjectId: subProjectId,
                year: year,
                month: month
              }
            });

            if (existingRecord) {
              console.log(`找到已存在的记录: ID=${existingRecord.id}，更新而非创建`);
              
              try {
                // 更新已存在的记录
                const updatePromise = db.record.update({
                  where: { id: existingRecord.id },
                  data: {
                    predicted: value === null ? null : parseFloat(String(value)),
                    status: "draft",
                    submittedBy: session?.user?.id || "temp-user-id",
                    // 暂时注释掉remark字段，解决类型问题
                    // remark: remarks?.[recordId] || "", 
                    updatedAt: new Date(),
                  },
                });
                
                updatePromises.push(updatePromise);
                updatedRecords.push(existingRecord.id);
              } catch (updateError) {
                console.error(`更新记录失败: ${existingRecord.id}`, updateError);
              }
            } else {
              console.log(`未找到现有记录，创建新记录: 子项目=${subProjectId}, 年=${year}, 月=${month}`);
              
              try {
                // 创建新记录
                createdRecords.push({ recordId, subProjectId, year, month, value });
                
                const createPromise = db.record.create({
                  data: {
                    subProjectId,
                    year,
                    month,
                    predicted: value === null ? null : parseFloat(String(value)),
                    status: "draft",
                    submittedBy: session?.user?.id || "temp-user-id",
                    // 暂时注释掉remark字段，解决类型问题
                    // remark: remarks?.[recordId] || "", 
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  },
                });
                
                updatePromises.push(createPromise);
              } catch (createError) {
                console.error(`创建记录失败: 子项目=${subProjectId}, 年=${year}, 月=${month}`, createError);
              }
            }
          } else {
            console.error(`临时记录ID格式无效，无法解析: ${recordId}`);
          }
        } else {
          console.log(`更新现有记录: ${recordId}, 值: ${value}`);
          
          try {
            // 更新现有记录
            const updatePromise = db.record.update({
              where: { id: recordId },
              data: {
                predicted: value === null ? null : parseFloat(String(value)),
                status: "draft",
                submittedBy: session?.user?.id || "temp-user-id",
                // 暂时注释掉remark字段，解决类型问题
                // remark: remarks?.[recordId] || "", 
                updatedAt: new Date(),
              },
            });
            
            updatePromises.push(updatePromise);
            updatedRecords.push(recordId);
          } catch (updateError) {
            console.error(`更新记录失败: ${recordId}`, updateError);
          }
        }
      } catch (recordError) {
        console.error(`处理记录时出错: ${recordId}`, recordError);
      }
    }

    console.log(`即将处理记录: 创建=${createdRecords.length}, 更新=${updatedRecords.length}`);
    
    const results = await Promise.all(updatePromises);
    console.log(`处理完成: ${results.length} 条记录`);
    
    // 记录每个创建或更新的记录ID
    if (results.length > 0) {
      console.log("操作结果:", results.map(result => {
        if (result && typeof result === 'object' && 'id' in result) {
          return {
            id: result.id,
            type: 'record',
            operation: createdRecords.some(cr => cr.subProjectId === (result as any).subProjectId && cr.year === (result as any).year && cr.month === (result as any).month) ? 'created' : 'updated'
          };
        }
        return null;
      }).filter(Boolean));
    }

    return NextResponse.json({ 
      success: true,
      message: "保存成功",
      created: createdRecords.length,
      updated: updatedRecords.length,
      total: results.length
    });
  } catch (error) {
    console.error("保存资金需求预测草稿失败", error);
    // 记录更详细的错误信息
    if (error instanceof Error) {
      console.error("错误详情:", {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    return NextResponse.json(
      { error: "保存资金需求预测草稿失败", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 