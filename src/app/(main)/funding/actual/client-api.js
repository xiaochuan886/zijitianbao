"use client";

import { toast } from "sonner";

// 客户端API函数，用于提交撤回申请
export const submitWithdrawalRequest = async (recordId, reason) => {
  try {
    console.log("客户端发送撤回申请:", { recordId, reason });
    
    // 使用浏览器原生fetch API
    const response = await fetch("/api/funding/predict/withdrawal-v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recordId,
        reason,
      }),
    });

    // 获取完整的响应数据，无论成功或失败
    const data = await response.json();
    console.log("API响应:", { status: response.status, data });

    if (!response.ok) {
      // 处理404错误
      if (response.status === 404) {
        throw new Error(data.message || "找不到对应的记录，请刷新页面后重试");
      }
      
      // 处理400错误
      if (response.status === 400 && data.currentStatus) {
        throw new Error(`只有已提交的记录才能申请撤回，当前状态: ${data.currentStatus}`);
      }
      
      throw new Error(data.error || "提交撤回申请失败");
    }
    
    // 成功提交撤回申请
    toast.success(data.message || "撤回申请已提交，等待管理员审核");
    
    // 添加自动刷新页面功能
    setTimeout(() => {
      window.location.reload();
    }, 1500); // 延迟1.5秒后刷新，给用户足够时间看到成功消息

    return { success: true, data };
  } catch (error) {
    console.error("提交撤回申请失败:", error);
    toast.error(error.message || "提交撤回申请失败");
    return { success: false, error };
  }
};

// 客户端API函数，用于取消撤回申请
export const cancelWithdrawalRequest = async (projectId) => {
  try {
    console.log("客户端发送取消撤回申请:", { projectId });
    
    // 使用浏览器原生fetch API
    const response = await fetch(`/api/funding/predict/withdrawal/cancel/${projectId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      }
    });

    // 获取完整的响应数据，无论成功或失败
    const data = await response.json();
    console.log("取消撤回API响应:", { status: response.status, data });

    if (!response.ok) {
      // 处理404错误
      if (response.status === 404) {
        throw new Error(data.message || "找不到待撤回的记录，请刷新页面后重试");
      }
      
      throw new Error(data.error || "取消撤回申请失败");
    }
    
    // 成功取消撤回申请
    toast.success(data.message || "已取消撤回申请");
    
    // 添加自动刷新页面功能
    setTimeout(() => {
      window.location.reload();
    }, 1500); // 延迟1.5秒后刷新，给用户足够时间看到成功消息

    return { success: true, data };
  } catch (error) {
    console.error("取消撤回申请失败:", error);
    toast.error(error.message || "取消撤回申请失败");
    return { success: false, error };
  }
};

// 测试API连接状态的函数
export const testApiConnection = async () => {
  try {
    // 测试撤回API
    const withdrawalResponse = await fetch("/api/funding/predict/withdrawal", {
      method: "HEAD",
    });
    
    // 测试测试版API
    const testResponse = await fetch("/api/funding/predict/withdrawal-v2", {
      method: "GET",
    });
    
    // 输出测试结果
    console.log("API连接测试结果:", {
      withdrawalApi: {
        status: withdrawalResponse.status,
        ok: withdrawalResponse.ok
      },
      testApi: {
        status: testResponse.status,
        ok: testResponse.ok,
        data: await testResponse.json()
      }
    });
    
    return {
      success: true,
      withdrawalApiStatus: withdrawalResponse.status,
      testApiStatus: testResponse.status
    };
  } catch (error) {
    console.error("API连接测试失败:", error);
    return {
      success: false,
      error: error.message
    };
  }
}; 