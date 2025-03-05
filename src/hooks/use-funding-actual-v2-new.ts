"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"
import { RecordStatus } from "@/lib/enums"
import { useCurrentUser } from "@/hooks/use-current-user"

// 通用的筛选条件类型
export interface ProjectFilters {
  organization: string;
  department: string;
  category?: string;
  project: string;
  subProject?: string;
  fundType?: string;
}

// 记录类型枚举
export enum ActualRecordType {
  USER = "user",
  FINANCE = "finance"
}

// 实际支付记录类型（通用）
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
  // 获取上个月
  let month = now.getMonth(); // 当前月的索引减1就是上个月（因为JS月份从0开始）
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

// 实际支付填报钩子函数
export function useFundingActual(
  recordType: ActualRecordType = ActualRecordType.USER,
  initialFilters: ProjectFilters = {
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
  const recordTypeRef = useRef(recordType);
  
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
  
  useEffect(() => {
    recordTypeRef.current = recordType;
  }, [recordType]);

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
        console.error(`获取实际支付填报元数据失败`, await response.text());
        toast({
          title: "获取元数据失败",
          description: "请刷新页面重试",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`获取实际支付填报元数据失败`, error);
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
    const currentRecordType = recordTypeRef.current;
    
    // 添加记录类型
    params.append("recordType", currentRecordType);
    
    // 添加年月参数
    params.append("year", month.year.toString());
    params.append("month", month.month.toString());
    
    // 添加分页参数
    params.append("page", currentPagination.page.toString());
    params.append("pageSize", currentPagination.pageSize.toString());
    
    // 添加筛选参数
    if (currentFilters.organization && currentFilters.organization !== 'all') {
      params.append("organizationId", currentFilters.organization);
    }
    
    if (currentFilters.department && currentFilters.department !== 'all') {
      params.append("departmentId", currentFilters.department);
    }
    
    if (currentFilters.category && currentFilters.category !== 'all') {
      params.append("categoryId", currentFilters.category);
    }
    
    if (currentFilters.project && currentFilters.project !== 'all') {
      params.append("projectId", currentFilters.project);
    }
    
    if (currentFilters.subProject && currentFilters.subProject !== 'all') {
      params.append("subProjectId", currentFilters.subProject);
    }
    
    if (currentFilters.fundType && currentFilters.fundType !== 'all') {
      params.append("fundTypeId", currentFilters.fundType);
    }
    
    return params;
  }, []);

  // 获取记录列表
  const fetchRecords = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      // 构建查询参数
      const params = buildQueryParams();
      const timestamp = new Date().getTime();
      params.append("_t", timestamp.toString());
      
      // 请求记录
      const response = await fetch(`/api/funding/actual?${params.toString()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API响应错误', response.status, errorText);
        throw new Error(`获取记录失败: ${response.status}`);
      }
      
      const data: PaginatedResponse<ActualRecord> = await response.json();
      
      // 更新记录和分页信息
      setRecords(data.items);
      setPagination({
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
        totalPages: data.totalPages
      });
      
    } catch (error) {
      console.error('获取记录失败', error);
      toast({
        title: "获取记录失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams, toast]);

  // 处理筛选条件变化
  const handleFilterChange = useCallback((key: keyof ProjectFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    
    // 如果更改了分类，重置项目和子项目
    if (key === 'category') {
      setFilters(prev => ({ ...prev, project: 'all', subProject: 'all' }));
    }
    
    // 如果更改了项目，重置子项目
    if (key === 'project') {
      setFilters(prev => ({ ...prev, subProject: 'all' }));
    }
    
    // 重置分页到第一页
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  // 处理月份变化
  const handleMonthChange = useCallback((year: number, month: number) => {
    setCurrentMonth({
      year,
      month,
      label: `${year}年${month}月`
    });
    
    // 重置分页到第一页
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // 延迟获取新数据
    setTimeout(() => {
      fetchRecords(true);
    }, 100);
  }, [fetchRecords]);

  // 处理分页变化
  const handlePageChange = useCallback((newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    
    // 防止频繁请求
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    fetchTimeoutRef.current = setTimeout(() => {
      fetchRecords(true);
    }, 300);
  }, [fetchRecords]);

  // 重置筛选条件
  const handleReset = useCallback(() => {
    setFilters(initialFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // 延迟获取新数据
    setTimeout(() => {
      fetchRecords(true);
    }, 100);
  }, [fetchRecords, initialFilters]);

  // 获取特定类别下的项目
  const getProjectsByCategory = useCallback((categoryId: string) => {
    if (categoryId === 'all') {
      return projects;
    }
    return projects.filter(project => project.categoryId === categoryId);
  }, [projects]);

  // 获取特定项目下的子项目
  const getSubProjectsByProject = useCallback((projectId: string) => {
    if (projectId === 'all') {
      return subProjects;
    }
    return subProjects.filter(subProject => subProject.projectId === projectId);
  }, [subProjects]);

  // 获取所有资金类型
  const getAllFundTypes = useCallback(() => {
    return fundTypes;
  }, [fundTypes]);

  // 获取状态统计
  const fetchStatusStats = useCallback(async () => {
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      const month = currentMonthRef.current;
      const currentRecordType = recordTypeRef.current;
      
      params.append("recordType", currentRecordType);
      params.append("year", month.year.toString());
      params.append("month", month.month.toString());
      
      const timestamp = new Date().getTime();
      params.append("_t", timestamp.toString());
      
      // 请求状态统计
      const response = await fetch(`/api/funding/actual/stats?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`获取状态统计失败: ${response.status}`);
      }
      
      const data = await response.json();
      return data.counts || {};
    } catch (error) {
      console.error('获取状态统计失败', error);
      toast({
        title: "获取状态统计失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
      return {};
    }
  }, [toast]);

  // 筛选特定状态的记录
  const filterRecordsByStatus = useCallback(async (status: string | null, page: number = 1) => {
    setLoading(true);
    
    try {
      // 构建查询参数
      const params = buildQueryParams();
      const currentRecordType = recordTypeRef.current;
      
      // 添加状态参数
      if (status) {
        params.append("status", status);
      }
      
      // 更新页码
      params.set("page", page.toString());
      
      const timestamp = new Date().getTime();
      params.append("_t", timestamp.toString());
      
      // 请求记录
      const response = await fetch(`/api/funding/actual?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`筛选记录失败: ${response.status}`);
      }
      
      const data: PaginatedResponse<ActualRecord> = await response.json();
      
      // 更新记录和分页信息
      setRecords(data.items);
      setPagination({
        page: data.page,
        pageSize: data.pageSize,
        total: data.total,
        totalPages: data.totalPages
      });
      
    } catch (error) {
      console.error('筛选记录失败', error);
      toast({
        title: "筛选记录失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams, toast]);

  // 初始加载
  useEffect(() => {
    fetchMetadata();
    fetchRecords(true);
  }, [fetchMetadata, fetchRecords]);

  // 记录类型变化时重新获取数据
  useEffect(() => {
    fetchRecords(true);
  }, [recordType, fetchRecords]);

  return {
    loading,
    records,
    filters,
    pagination,
    setPagination,
    organizations,
    departments,
    projectCategories,
    projects,
    subProjects,
    fundTypes,
    currentMonth,
    handleFilterChange,
    handlePageChange,
    handleReset,
    fetchRecords,
    getProjectsByCategory,
    getSubProjectsByProject,
    getAllFundTypes,
    handleMonthChange,
    fetchStatusStats,
    filterRecordsByStatus,
    recordType
  };
} 