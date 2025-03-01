"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"
import { RecordStatus } from "@/lib/enums"

// 通用的筛选条件类型
export interface ProjectFilters {
  organizationId?: string;
  departmentId?: string;
  projectCategoryId?: string;
  projectId?: string;
  subProjectId?: string;
  fundTypeId?: string;
  year?: string;
  month?: string;
  status?: string;
}

// 预测记录类型
export interface PredictRecord {
  id: string;
  subProjectId: string;
  fundTypeId: string;
  year: number;
  month: number;
  amount: number | null;
  status: RecordStatus;
  remark?: string;
  submittedBy: string;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  subProject: {
    id: string;
    name: string;
    projectId: string;
    project: {
      id: string;
      name: string;
      organizations: {
        id: string;
        name: string;
        code: string;
      }[];
      departments: {
        id: string;
        name: string;
      }[];
    };
    fundTypes: {
      id: string;
      name: string;
    }[];
  };
  fundType: {
    id: string;
    name: string;
  };
}

// 分页响应类型
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
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

// 预测填报钩子函数 V2 版本
export function useFundingPredictV2(
  initialFilters: ProjectFilters = {
    organizationId: undefined,
    projectId: undefined,
    year: undefined,
    month: undefined,
    status: undefined
  }
) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<PredictRecord[]>([]);
  const [filters, setFilters] = useState<ProjectFilters>(initialFilters);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  });
  const [organizations, setOrganizations] = useState<{ id: string; name: string; code: string }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [projectCategories, setProjectCategories] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string; categoryId: string }[]>([]);
  const [subProjects, setSubProjects] = useState<{ id: string; name: string; projectId: string }[]>([]);
  const [fundTypes, setFundTypes] = useState<{ id: string; name: string }[]>([]);
  const [currentMonth, setCurrentMonth] = useState<MonthInfo>(getNextMonth());
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 使用useRef存储最新的状态，避免闭包问题
  const filtersRef = useRef(filters);
  const currentMonthRef = useRef(currentMonth);
  const paginationRef = useRef(pagination);
  const metaLoadedRef = useRef(false);
  
  // 更新ref值
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);
  
  useEffect(() => {
    currentMonthRef.current = currentMonth;
  }, [currentMonth]);
  
  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  // 获取元数据（机构、部门）
  const fetchMetadata = useCallback(async () => {
    // 如果已经加载过元数据，不再重复加载
    if (metaLoadedRef.current) return;
    
    try {
      const response = await fetch(`/api/funding/predict/meta`, {
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
        setProjectCategories(data.projectCategories || []);
        setProjects(data.projects || []);
        setSubProjects(data.subProjects || []);
        setFundTypes(data.fundTypes || []);
        metaLoadedRef.current = true;
      } else {
        console.error(`获取预测填报元数据失败`);
      }
    } catch (error) {
      console.error(`获取预测填报元数据失败`, error);
      toast({
        title: "获取元数据失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    }
  }, [toast]);

  // 构建查询参数
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    const currentFilters = filtersRef.current;
    const month = currentMonthRef.current;
    const currentPagination = paginationRef.current;
    
    if (currentFilters.organizationId && currentFilters.organizationId !== 'all') {
      params.append("organizationId", currentFilters.organizationId);
    }
    
    if (currentFilters.departmentId && currentFilters.departmentId !== 'all') {
      params.append("departmentId", currentFilters.departmentId);
    }
    
    if (currentFilters.projectCategoryId && currentFilters.projectCategoryId !== 'all') {
      params.append("projectCategoryId", currentFilters.projectCategoryId);
    }
    
    if (currentFilters.projectId && currentFilters.projectId !== 'all') {
      params.append("projectId", currentFilters.projectId);
    }
    
    if (currentFilters.subProjectId && currentFilters.subProjectId !== 'all') {
      params.append("subProjectId", currentFilters.subProjectId);
    }
    
    if (currentFilters.fundTypeId && currentFilters.fundTypeId !== 'all') {
      params.append("fundTypeId", currentFilters.fundTypeId);
    }
    
    if (currentFilters.status && currentFilters.status !== 'all') {
      params.append("status", currentFilters.status);
    }
    
    // 如果筛选条件中有年月，使用筛选条件的年月，否则使用当前月份
    if (currentFilters.year) {
      params.append("year", currentFilters.year);
    } else {
      params.append("year", month.year.toString());
    }
    
    if (currentFilters.month) {
      params.append("month", currentFilters.month);
    } else {
      params.append("month", month.month.toString().padStart(2, "0"));
    }
    
    // 添加分页参数
    params.append("page", currentPagination.page.toString());
    params.append("pageSize", currentPagination.pageSize.toString());
    
    return params.toString();
  }, []);

  // 获取预测记录列表
  const fetchRecords = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      // 调用API获取预测记录列表
      const queryParams = buildQueryParams();
      // 添加缓存控制参数
      const cacheParam = `_t=${Date.now().toString()}`;
      const fullQueryString = queryParams ? `${queryParams}&${cacheParam}` : cacheParam;
      
      const response = await fetch(`/api/funding/predict-v2?${fullQueryString}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error("获取预测记录列表失败");
      }
      
      const data: PaginatedResponse<PredictRecord> = await response.json();
      setRecords(data.items || []);
      setPagination({
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
        totalPages: data.totalPages
      });
      
      // 获取元数据
      fetchMetadata();
    } catch (error) {
      console.error("获取预测记录列表失败", error);
      toast({
        title: "获取预测记录列表失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams, fetchMetadata, toast]);

  // 处理筛选条件变化 - 添加防抖处理
  const handleFilterChange = useCallback((key: keyof ProjectFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    
    // 重置分页
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // 取消之前的请求
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    // 设置新的延迟请求
    fetchTimeoutRef.current = setTimeout(() => {
      fetchRecords(true);
    }, 300);
  }, [fetchRecords]);

  // 处理分页变化
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
    
    // 取消之前的请求
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    // 设置新的延迟请求
    fetchTimeoutRef.current = setTimeout(() => {
      fetchRecords(true);
    }, 300);
  }, [fetchRecords]);

  // 保存预测记录
  const saveRecords = useCallback(async (recordsToSave: {
    id?: string;
    subProjectId: string;
    fundTypeId: string;
    year: number;
    month: number;
    amount: number | null;
    remark?: string;
  }[]) => {
    try {
      const response = await fetch("/api/funding/predict-v2/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: recordsToSave
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "保存预测记录失败");
      }
      
      const result = await response.json();
      
      toast({
        title: "保存成功",
        description: `已成功保存 ${result.details.created + result.details.updated} 条记录`,
      });
      
      // 刷新记录列表
      fetchRecords(true);
      
      return result;
    } catch (error) {
      console.error("保存预测记录失败", error);
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
      return null;
    }
  }, [fetchRecords, toast]);

  // 申请撤回记录
  const requestWithdrawal = useCallback(async (recordId: string, reason: string) => {
    try {
      const response = await fetch("/api/funding/predict-v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "withdrawal",
          recordId,
          reason
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "申请撤回失败");
      }
      
      const result = await response.json();
      
      toast({
        title: "申请已提交",
        description: result.message || "撤回申请已提交，等待管理员审核",
      });
      
      // 刷新记录列表
      fetchRecords(true);
      
      return true;
    } catch (error) {
      console.error("申请撤回失败", error);
      toast({
        title: "申请失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
      return false;
    }
  }, [fetchRecords, toast]);

  // 重置筛选条件
  const handleReset = useCallback(() => {
    setFilters(initialFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // 取消之前的请求
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    // 设置新的延迟请求
    fetchTimeoutRef.current = setTimeout(() => {
      fetchRecords(true);
    }, 300);
  }, [fetchRecords, initialFilters]);

  // 获取特定项目分类下的项目
  const getProjectsByCategory = useCallback((categoryId: string | undefined) => {
    if (!categoryId || categoryId === 'all') {
      return projects;
    }
    return projects.filter(project => project.categoryId === categoryId);
  }, [projects]);

  // 获取特定项目下的子项目
  const getSubProjectsByProject = useCallback((projectId: string | undefined) => {
    if (!projectId || projectId === 'all') {
      return subProjects;
    }
    return subProjects.filter(subProject => subProject.projectId === projectId);
  }, [subProjects]);

  // 获取所有资金类型
  const getAllFundTypes = useCallback(() => {
    return fundTypes;
  }, [fundTypes]);

  // 初始加载数据
  useEffect(() => {
    fetchRecords(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    loading,
    records,
    filters,
    pagination,
    organizations,
    departments,
    projectCategories,
    projects,
    subProjects,
    fundTypes,
    currentMonth,
    setFilters,
    handleFilterChange,
    handlePageChange,
    handleReset,
    fetchRecords,
    saveRecords,
    requestWithdrawal,
    getProjectsByCategory,
    getSubProjectsByProject,
    getAllFundTypes,
  };
} 