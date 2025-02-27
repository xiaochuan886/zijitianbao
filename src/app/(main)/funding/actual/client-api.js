"use client";

import { toast } from "sonner";

// 客户端API函数，用于保存实际支付草稿
export const saveActualPaymentDrafts = async (records, remarks = "", isUserReport = true) => {
  try {
    console.log("客户端保存实际支付草稿:", { records, remarks, isUserReport });
    
    // 使用浏览器原生fetch API
    const response = await fetch("/api/funding/actual/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records,
        remarks,
        isUserReport
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
      if (response.status === 400) {
        throw new Error(data.error || "保存草稿失败");
      }
      
      throw new Error(data.error || "保存草稿失败");
    }
    
    // 成功保存草稿
    toast.success(data.message || `已成功保存 ${data.count || records.length} 条记录`);
    
    return { success: true, data };
  } catch (error) {
    console.error("保存实际支付草稿失败:", error);
    toast.error(error.message || "保存草稿失败");
    return { success: false, error };
  }
};

// 客户端API函数，用于提交实际支付记录
export const submitActualPayments = async (records, remarks = "", isUserReport = true) => {
  try {
    console.log("客户端提交实际支付记录:", { records, remarks, isUserReport });
    
    // 使用浏览器原生fetch API
    const response = await fetch("/api/funding/actual/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records,
        remarks,
        isUserReport
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
      if (response.status === 400) {
        throw new Error(data.error || "提交记录失败");
      }
      
      throw new Error(data.error || "提交记录失败");
    }
    
    // 成功提交记录
    toast.success(data.message || `已成功提交 ${data.count || records.length} 条记录`);
    
    // 添加自动刷新页面功能
    setTimeout(() => {
      window.location.reload();
    }, 1500); // 延迟1.5秒后刷新，给用户足够时间看到成功消息

    return { success: true, data };
  } catch (error) {
    console.error("提交实际支付记录失败:", error);
    toast.error(error.message || "提交记录失败");
    return { success: false, error };
  }
};

// 客户端API函数，用于批量提交实际支付记录
export const batchSubmitActualPayments = async (projectIds, year, month, isUserReport = true) => {
  try {
    console.log("客户端批量提交实际支付记录:", { projectIds, year, month, isUserReport });
    
    // 使用浏览器原生fetch API
    const response = await fetch("/api/funding/actual/batch-submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        projectIds,
        year,
        month,
        isUserReport
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
      if (response.status === 400) {
        throw new Error(data.error || "批量提交记录失败");
      }
      
      throw new Error(data.error || "批量提交记录失败");
    }
    
    // 成功批量提交记录
    toast.success(data.message || `已成功批量提交 ${data.count || 0} 条记录`);
    
    // 添加自动刷新页面功能
    setTimeout(() => {
      window.location.reload();
    }, 1500); // 延迟1.5秒后刷新，给用户足够时间看到成功消息

    return { success: true, data };
  } catch (error) {
    console.error("批量提交实际支付记录失败:", error);
    toast.error(error.message || "批量提交记录失败");
    return { success: false, error };
  }
};

// 客户端API函数，用于获取元数据（组织和部门列表）
export const fetchActualPaymentMetadata = async () => {
  try {
    console.log("获取实际支付元数据");
    
    // 使用浏览器原生fetch API
    const response = await fetch("/api/funding/actual/meta", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      }
    });

    // 获取完整的响应数据，无论成功或失败
    const data = await response.json();
    console.log("元数据API响应:", { status: response.status, data });

    if (!response.ok) {
      throw new Error(data.error || "获取元数据失败");
    }
    
    return { success: true, data };
  } catch (error) {
    console.error("获取实际支付元数据失败:", error);
    toast.error(error.message || "获取元数据失败");
    return { success: false, error };
  }
}; 