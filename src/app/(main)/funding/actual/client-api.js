"use client";

import { toast } from "sonner";

/**
 * 提交撤回申请
 * @param {string} projectId - 项目ID
 * @param {string} subProjectId - 子项目ID
 * @param {string} reason - 撤回原因
 * @param {boolean} isUserReport - 是否为用户填报，默认为true
 * @returns {Promise<boolean>} - 是否成功
 */
export const submitWithdrawalRequest = async (projectId, subProjectId, reason, isUserReport = true) => {
  try {
    // 查询记录ID
    const recordIdUrl = `/api/funding/actual/record-id?projectId=${projectId}&subProjectId=${subProjectId}`;
    const recordIdResponse = await fetch(recordIdUrl);
    
    if (!recordIdResponse.ok) {
      throw new Error("获取记录ID失败");
    }
    
    const recordData = await recordIdResponse.json();
    const recordId = recordData.recordId || null;
    
    if (!recordId) {
      throw new Error("未找到对应的记录");
    }
    
    // 发送撤回申请
    const response = await fetch("/api/funding/actual/route", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "withdrawal",
        recordId,
        reason,
        isUserReport
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(data.message || "找不到对应的记录");
      }
      
      if (response.status === 400 && data.currentStatus) {
        throw new Error(`只有已提交的记录才能申请撤回，当前状态: ${data.currentStatus}`);
      }
      
      throw new Error(data.error || "提交撤回申请失败");
    }
    
    toast.success("撤回申请已提交，等待管理员审核");
    return true;
  } catch (error) {
    console.error("提交撤回申请失败:", error);
    toast.error(error.message || "提交撤回申请失败");
    return false;
  }
};

/**
 * 取消撤回申请
 * @param {string} projectId - 项目ID
 * @param {string} subProjectId - 子项目ID
 * @param {boolean} isUserReport - 是否为用户填报，默认为true
 * @returns {Promise<boolean>} - 是否成功
 */
export const cancelWithdrawalRequest = async (projectId, subProjectId, isUserReport = true) => {
  try {
    // 使用专门的取消撤回API
    const cancelUrl = `/api/funding/actual/withdrawal/cancel/${projectId}?subProjectId=${subProjectId}&isUserReport=${isUserReport}`;
    const response = await fetch(cancelUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      }
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(data.message || "找不到待撤回的记录");
      }
      
      throw new Error(data.error || "取消撤回申请失败");
    }
    
    toast.success("已取消撤回申请");
    return true;
  } catch (error) {
    console.error("取消撤回申请失败:", error);
    toast.error(error.message || "取消撤回申请失败");
    return false;
  }
};

// 测试API连接状态的函数
export const testApiConnection = async () => {
  try {
    // 测试撤回API
    const withdrawalResponse = await fetch("/api/funding/actual/withdrawal", {
      method: "HEAD",
    });
    
    // 测试测试版API
    const testResponse = await fetch("/api/funding/actual/withdrawal-v2", {
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