"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"
import { RecordStatus } from "@/lib/enums"
import { useCurrentUser } from "@/hooks/use-current-user"

// 通用的筛选条件类型
export interface ProjectFilters {
  recordType: "user" | "finance"; // 记录类型：用户或财务
  organization: string;
  department: string;
  category?: string;
  project: string;
  subProject?: string;
  fundType?: string;
}

// 实际支出记录类型
export interface ActualRecord {
  id: string;
  detailedFundNeedId: string;
  year: number;
  month: number;
  amount: number | null;
  status: RecordStatus;
  remark?: string;
  submittedBy: string | null;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  detailedFundNeed: {
    id: string;
    subProject: {
      id: string;
      name: string;
      project: {
        id: string;
        name: string;
        category?: {
          id: string;
          name: string;
        };
      };
    };
    department: {
      id: string;
      name: string;
    };
    organization: {
      id: string;
      name: string;
      code: string;
    };
    fundType: {
      id: string;
      name: string;
    };
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

// 获取当前月的函数
export function getCurrentMonth(): MonthInfo {
  const now = new Date();
  let month = now.getMonth(); // 上个月 (0-11)
  let year = now.getFullYear();
  
  // 如果是1月，则上个月是上一年的12月
  if (month === 0) {
    month = 12;
    year -= 1;
  }
  
  return {
    year,
    month,
    label: `${year}年${month}月`
  };
}

// 实际支出填报钩子函数
export function useFundingActual(
  initialFilters: ProjectFilters = {
    recordType: "user", // 默认为用户记录
    organization: 'all',
    department: 'all',
    project: 'all',
    fundType: 'all',
    category: 'all',
    subProject: 'all'
  }
) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<ActualRecord[]>([]);
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
  const [currentMonth, setCurrentMonth] = useState<MonthInfo>(getCurrentMonth());
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 使用useRef存储最新的状态，避免闭包问题
  const filtersRef = useRef(filters);
  const currentMonthRef = useRef(currentMonth);
  const paginationRef = useRef(pagination);
  const metaLoadedRef = useRef(false);
  
  // 获取当前用户信息，用于判断是否为管理员
  const { user } = useCurrentUser();
  
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
    if (metaLoadedRef.current) {
      console.log('元数据已加载，跳过重复加载');
      return;
    }
    
    try {
      console.log('开始获取元数据...');
      const response = await fetch(`/api/funding/actual/meta`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('获取到元数据:', {
          organizations: data.organizations?.length || 0,
          departments: data.departments?.length || 0,
          projectCategories: data.projectCategories?.length || 0,
          projects: data.projects?.length || 0,
          subProjects: data.subProjects?.length || 0,
          fundTypes: data.fundTypes?.length || 0,
        });
        
        setOrganizations(data.organizations || []);
        setDepartments(data.departments || []);
        setProjectCategories(data.projectCategories || []);
        setProjects(data.projects || []);
        setSubProjects(data.subProjects || []);
        setFundTypes(data.fundTypes || []);
        metaLoadedRef.current = true;
      } else {
        console.error(`获取实际支出填报元数据失败`, await response.text());
        toast({
          title: "获取元数据失败",
          description: "请刷新页面重试",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`获取实际支出填报元数据失败`, error);
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
    
    console.log('构建查询参数，当前筛选条件:', JSON.stringify(currentFilters, null, 2));
    
    // 添加记录类型
    params.append("recordType", currentFilters.recordType);
    console.log(`添加记录类型: ${currentFilters.recordType}`);
    
    if (currentFilters.organization && currentFilters.organization !== 'all') {
      params.append("organizationId", currentFilters.organization);
      console.log(`添加组织筛选条件: ${currentFilters.organization}`);
    }
    
    if (currentFilters.department && currentFilters.department !== 'all') {
      params.append("departmentId", currentFilters.department);
      console.log(`添加部门筛选条件: ${currentFilters.department}`);
    }
    
    if (currentFilters.category && currentFilters.category !== 'all') {
      params.append("categoryId", currentFilters.category);
      console.log(`添加项目分类筛选条件: ${currentFilters.category}`);
    }
    
    if (currentFilters.project && currentFilters.project !== 'all') {
      params.append("projectId", currentFilters.project);
      console.log(`添加项目筛选条件: ${currentFilters.project}`);
    }
    
    if (currentFilters.subProject && currentFilters.subProject !== 'all') {
      params.append("subProjectId", currentFilters.subProject);
      console.log(`添加子项目筛选条件: ${currentFilters.subProject}`);
    }
    
    if (currentFilters.fundType && currentFilters.fundType !== 'all') {
      params.append("fundTypeId", currentFilters.fundType);
      console.log(`添加资金类型筛选条件: ${currentFilters.fundType}`);
    }
    
    // 使用当前月份作为默认年月参数
    params.append("year", month.year.toString());
    console.log(`添加默认年份: ${month.year}`);
    
    params.append("month", month.month.toString());
    console.log(`添加默认月份: ${month.month}`);
    
    // 添加分页参数
    params.append("page", currentPagination.page.toString());
    params.append("pageSize", currentPagination.pageSize.toString());
    
    const queryString = params.toString();
    console.log('最终查询参数:', queryString);
    
    return queryString;
  }, []);

  // 获取实际支出记录列表
  const fetchRecords = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      console.log('开始获取实际支出记录列表...');
      
      // 调用API获取实际支出记录列表
      const queryParams = buildQueryParams();
      // 添加缓存控制参数
      const cacheParam = `_t=${Date.now().toString()}`;
      const fullQueryString = queryParams ? `${queryParams}&${cacheParam}` : cacheParam;
      
      console.log(`请求API: /api/funding/actual?${fullQueryString}`);
      
      const response = await fetch(`/api/funding/actual?${fullQueryString}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API响应错误: ${response.status}`, errorText);
        throw new Error(`获取实际支出记录列表失败: ${response.status} ${errorText}`);
      }
      
      const data: PaginatedResponse<ActualRecord> & { warning?: string } = await response.json();
      console.log(`获取到 ${data.items.length} 条记录，共 ${data.total} 条`);
      
      // 检查API是否返回了警告信息
      if (data.warning) {
        console.log(`API警告: ${data.warning}`);
        // 显示警告信息
        toast({
          title: "筛选提示",
          description: data.warning,
          variant: "default",
        });
      }
      
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
      console.error("获取实际支出记录列表失败", error);
      toast({
        title: "获取实际支出记录列表失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams, fetchMetadata, toast]);

  // 处理月份变更
  const handleMonthChange = useCallback((year: number, month: number) => {
    console.log(`月份变更: ${year}年${month}月`);
    setCurrentMonth({
      year,
      month,
      label: `${year}年${month}月`
    });
    
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

  // 保存实际支出记录
  const saveRecords = useCallback(async (recordsToSave: {
    id?: string;
    detailedFundNeedId: string;
    year: number;
    month: number;
    amount: number | null;
    remark?: string;
  }[]) => {
    try {
      const recordType = filtersRef.current.recordType;
      const apiEndpoint = `/api/funding/actual/save?recordType=${recordType}`;
      
      const response = await fetch(apiEndpoint, {
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
        throw new Error(errorData.error || "保存实际支出记录失败");
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
      console.error("保存实际支出记录失败", error);
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
      throw error;
    }
  }, [fetchRecords, toast]);

  // 提交实际支出记录
  const submitRecords = useCallback(async (recordIds: string[]) => {
    try {
      const recordType = filtersRef.current.recordType;
      const apiEndpoint = `/api/funding/actual/submit?recordType=${recordType}`;
      
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recordIds
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "提交实际支出记录失败");
      }
      
      const result = await response.json();
      
      toast({
        title: "提交成功",
        description: `已成功提交 ${result.count} 条记录`,
      });
      
      // 刷新记录列表
      fetchRecords(true);
      
      return result;
    } catch (error) {
      console.error("提交实际支出记录失败", error);
      toast({
        title: "提交失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
      throw error;
    }
  }, [fetchRecords, toast]);

  // 获取状态统计数据
  const fetchStatusStats = useCallback(async () => {
    try {
      const queryParams = buildQueryParams();
      const response = await fetch(`/api/funding/actual/stats?${queryParams}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`获取状态统计数据失败: ${response.status}`);
      }
      
      const data = await response.json();
      return data.statusCounts || {};
    } catch (error) {
      console.error("获取状态统计数据失败", error);
      return {};
    }
  }, [buildQueryParams]);

  // 创建填报记录
  const createRecords = useCallback(async (params: {
    year: number;
    month: number;
    organizationId?: string;
    departmentId?: string;
    projectId?: string;
    projectCategoryId?: string;
    subProjectId?: string;
    fundTypeId?: string;
  }) => {
    try {
      const recordType = filtersRef.current.recordType;
      const response = await fetch("/api/funding/actual/create-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recordType,
          ...params
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "创建填报记录失败");
      }
      
      const result = await response.json();
      
      toast({
        title: "创建成功",
        description: `已成功创建 ${result.created} 条填报记录`,
      });
      
      // 刷新记录列表
      fetchRecords(true);
      
      return result;
    } catch (error) {
      console.error("创建填报记录失败", error);
      toast({
        title: "创建失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
      throw error;
    }
  }, [fetchRecords, toast]);

  // 申请撤回记录
  const withdrawRecord = useCallback(async (recordId: string, reason: string) => {
    try {
      const recordType = filtersRef.current.recordType === "user" ? "actual_user" : "actual_fin";
      
      const response = await fetch("/api/funding/actual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "withdrawal",
          recordId,
          reason,
          recordType
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "申请撤回记录失败");
      }
      
      const result = await response.json();
      
      toast({
        title: "申请已提交",
        description: result.message || "撤回申请已提交，等待管理员审核",
      });
      
      // 刷新记录列表
      fetchRecords(true);
      
      return result;
    } catch (error) {
      console.error("申请撤回记录失败", error);
      toast({
        title: "申请失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
      throw error;
    }
  }, [fetchRecords, toast]);

  // 初始化加载
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
    fetchRecords,
    handleFilterChange,
    handleMonthChange,
    handlePageChange,
    saveRecords,
    submitRecords,
    fetchStatusStats,
    createRecords,
    withdrawRecord
  };
}