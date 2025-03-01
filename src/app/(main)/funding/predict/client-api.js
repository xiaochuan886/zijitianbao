"use client";

import { toast } from "sonner";

/**
 * 提交撤回申请
 * @param {string} projectId - 项目ID
 * @param {string|undefined} subProjectId - 子项目ID，可选
 * @param {string} reason - 撤回原因
 * @returns {Promise<{success: boolean, data?: any, error?: any}>} - 操作结果
 */
export const submitWithdrawalRequest = async (projectId, subProjectId, reason) => {
  try {
    // 构建请求主体
    const requestBody = {
      projectId,
      subProjectId,
      reason
    };
    
    // 发送撤回申请请求
    const response = await fetch("/api/funding/predict/withdrawal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    // 获取响应数据
    const data = await response.json();

    if (!response.ok) {
      // 处理各种错误情况
      if (response.status === 404) {
        throw new Error(data.message || "找不到对应的记录");
      }
      
      if (response.status === 400) {
        throw new Error(data.message || "请求参数错误");
      }
      
      throw new Error(data.error || "提交撤回申请失败");
    }
    
    // 成功提交撤回申请
    toast.success(data.message || "撤回申请已提交，等待管理员审核");
    
    return { success: true, data };
  } catch (error) {
    console.error("提交撤回申请失败:", error);
    toast.error(error.message || "提交撤回申请失败");
    return { success: false, error };
  }
};

/**
 * 取消撤回申请
 * @param {string} projectId - 项目ID
 * @param {string|undefined} subProjectId - 子项目ID，可选
 * @returns {Promise<{success: boolean, data?: any, error?: any}>} - 操作结果
 */
export const cancelWithdrawalRequest = async (projectId, subProjectId) => {
  try {
    // 构建URL
    let url = `/api/funding/predict/withdrawal/cancel`;
    
    // 添加查询参数
    const params = new URLSearchParams();
    params.append("projectId", projectId);
    if (subProjectId) {
      params.append("subProjectId", subProjectId);
    }
    
    // 发送取消撤回请求
    const response = await fetch(`${url}?${params.toString()}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      }
    });

    // 获取响应数据
    const data = await response.json();

    if (!response.ok) {
      // 处理各种错误情况
      if (response.status === 404) {
        throw new Error(data.message || "找不到待撤回的记录");
      }
      
      throw new Error(data.error || "取消撤回申请失败");
    }
    
    // 成功取消撤回申请
    toast.success(data.message || "已取消撤回申请");
    
    return { success: true, data };
  } catch (error) {
    console.error("取消撤回申请失败:", error);
    toast.error(error.message || "取消撤回申请失败");
    return { success: false, error };
  }
};

/**
 * 获取项目详情
 * @param {string} projectId - 项目ID
 * @param {number} year - 年份
 * @param {number} month - 月份
 * @returns {Promise<{success: boolean, data?: any, error?: any}>} - 操作结果
 */
export const getProjectDetails = async (projectId, year, month) => {
  try {
    //
  } catch (error) {
    console.error("获取项目详情失败:", error);
    return { success: false, error: error.message };
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