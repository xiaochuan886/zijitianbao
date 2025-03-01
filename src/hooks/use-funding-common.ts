"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"

// 通用的筛选条件类型
export interface ProjectFilters {
  organizationId?: string;
  departmentId?: string;
  categoryId?: string;
  projectName?: string;
  status?: string;
}

// 通用的元数据类型
export interface ProjectMeta {
  organizations: { id: string; name: string; code: string }[];
  departments: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}

// 月份信息类型
export interface MonthInfo {
  year: number;
  month: number;
  label: string;
}

// 获取下个月的函数
export function getNextMonth(): MonthInfo {
  const now = new Date();
  let nextMonth = now.getMonth() + 2; // 当前月+2
  let year = now.getFullYear();
  
  if (nextMonth > 12) {
    nextMonth = nextMonth - 12;
    year += 1;
  }
  
  return {
    year,
    month: nextMonth,
    label: `${year}年${nextMonth}月`
  };
}

// 通用的资金需求预测钩子
export function useFundingCommon<T = any>(
  apiEndpoint: string,
  initialFilters: ProjectFilters = {
    organizationId: undefined,
    departmentId: undefined,
    categoryId: undefined,
    projectName: "",
    status: "all"
  }
) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<T[]>([]);
  const [filters, setFilters] = useState<ProjectFilters>(initialFilters);
  const [organizations, setOrganizations] = useState<{ id: string; name: string; code: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [currentMonth, setCurrentMonth] = useState<MonthInfo>(getNextMonth());
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 使用useRef存储最新的状态，避免闭包问题
  const filtersRef = useRef(filters);
  const currentMonthRef = useRef(currentMonth);
  const metaLoadedRef = useRef(false);
  
  // 更新ref值
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);
  
  useEffect(() => {
    currentMonthRef.current = currentMonth;
  }, [currentMonth]);

  // 获取元数据（机构、部门、项目分类）
  const fetchMetadata = useCallback(async () => {
    // 如果已经加载过元数据，不再重复加载
    if (metaLoadedRef.current) return;
    
    try {
      const response = await fetch(`/api/funding/${apiEndpoint}/meta`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
        setDepartments(data.departments || []);
        setCategories(data.categories || []);
        metaLoadedRef.current = true;
      } else {
        console.error(`获取${apiEndpoint}元数据失败`);
      }
    } catch (error) {
      console.error(`获取${apiEndpoint}元数据失败`, error);
      toast({
        title: "获取元数据失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    }
  }, [apiEndpoint, toast]);

  // 构建查询参数
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    const currentFilters = filtersRef.current;
    const month = currentMonthRef.current;
    
    if (currentFilters.organizationId && currentFilters.organizationId !== 'all') {
      params.append("organizationId", currentFilters.organizationId);
    }
    
    if (currentFilters.departmentId && currentFilters.departmentId !== 'all') {
      params.append("departmentId", currentFilters.departmentId);
    }
    
    if (currentFilters.categoryId && currentFilters.categoryId !== 'all') {
      params.append("categoryId", currentFilters.categoryId);
    }
    
    if (currentFilters.projectName) {
      params.append("projectName", currentFilters.projectName);
    }
    
    if (currentFilters.status && currentFilters.status !== 'all') {
      params.append("status", currentFilters.status);
    }
    
    params.append("year", month.year.toString());
    params.append("month", month.month.toString().padStart(2, "0"));
    
    return params.toString();
  }, []);

  // 获取项目列表
  const fetchProjects = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      // 调用API获取项目列表
      const queryParams = buildQueryParams();
      // 添加缓存控制参数
      const cacheParam = `_t=${Date.now().toString()}`;
      const fullQueryString = queryParams ? `${queryParams}&${cacheParam}` : cacheParam;
      
      const response = await fetch(`/api/funding/${apiEndpoint}?${fullQueryString}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error("获取项目列表失败");
      }
      
      const data = await response.json();
      setProjects(data.items || data);
      
      // 获取元数据
      fetchMetadata();
    } catch (error) {
      console.error("获取项目列表失败", error);
      toast({
        title: "获取项目列表失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [apiEndpoint, buildQueryParams, fetchMetadata, toast]);

  // 处理筛选条件变化 - 添加防抖处理
  const handleFilterChange = useCallback((key: keyof ProjectFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    
    // 取消之前的请求
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    // 设置新的延迟请求
    fetchTimeoutRef.current = setTimeout(() => {
      fetchProjects(true);
    }, 300);
  }, [fetchProjects]);

  // 批量提交项目
  const batchSubmitProjects = useCallback(async (projectIds: string[], subProjectIds: string[]) => {
    try {
      // 显示提交中的提示
      const submittingToast = toast({
        title: "正在提交...",
        description: "正在批量提交项目，请稍候",
      });
      
      // 调用API提交项目
      const response = await fetch(`/api/funding/${apiEndpoint}/batch-submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectIds,
          subProjectIds,
          year: currentMonthRef.current.year,
          month: currentMonthRef.current.month,
        }),
      });
      
      // 关闭提交中的提示
      submittingToast.dismiss();
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "批量提交失败");
      }
      
      const result = await response.json();
      
      // 显示成功提示
      toast({
        title: "提交成功",
        description: `已成功提交 ${result.count} 个项目`,
      });
      
      // 刷新项目列表
      fetchProjects(true);
      
      return true;
    } catch (error) {
      console.error("批量提交失败", error);
      toast({
        title: "提交失败",
        description: error instanceof Error ? error.message : "批量提交失败",
        variant: "destructive"
      });
      return false;
    }
  }, [apiEndpoint, fetchProjects, toast]);

  // 初始化
  useEffect(() => {
    // 初始化时设置当前月份
    const nextMonth = getNextMonth();
    setCurrentMonth(nextMonth);
    currentMonthRef.current = nextMonth;
    
    // 获取项目列表 - 使用setTimeout确保状态已更新
    setTimeout(() => {
      fetchProjects(true);
    }, 0);
    
    // 清理函数
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  // 重置筛选条件
  const handleReset = useCallback(() => {
    setFilters(initialFilters);
    
    // 取消之前的请求
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    // 设置新的延迟请求
    fetchTimeoutRef.current = setTimeout(() => {
      fetchProjects(true);
    }, 100);
  }, [fetchProjects, initialFilters]);

  return {
    loading,
    projects,
    setProjects,
    filters,
    setFilters,
    handleFilterChange,
    handleReset,
    organizations,
    departments,
    categories,
    currentMonth,
    fetchProjects,
    batchSubmitProjects
  };
}

// 通用的状态选项
export const commonStatusOptions = [
  { value: "未填写", label: "未填写" },
  { value: "草稿", label: "草稿" },
  { value: "已提交", label: "已提交" },
  { value: "pending_withdrawal", label: "撤回审核中" }
];

// 检查项目是否可编辑
export function isProjectEditable(status?: string): boolean {
  return !status || status === "未填写" || status === "草稿";
} 