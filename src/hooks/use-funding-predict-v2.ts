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
  status: string;
}

// 预测记录类型
export interface PredictRecord {
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
    organization: 'all',
    department: 'all',
    project: 'all',
    status: 'all',
    category: 'all',
    subProject: 'all',
    fundType: 'all'
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
      const response = await fetch(`/api/funding/predict/meta`, {
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
        
        // 检查项目数据
        if (data.projects && data.projects.length > 0) {
          console.log('项目数据示例:', data.projects.slice(0, 3));
          
          // 检查项目分类ID是否存在
          const projectsWithCategory = data.projects.filter((p: { categoryId?: string }) => p.categoryId);
          console.log(`项目总数: ${data.projects.length}, 有分类ID的项目数: ${projectsWithCategory.length}`);
          
          if (projectsWithCategory.length === 0) {
            console.warn('警告: 所有项目都没有分类ID (categoryId)');
          }
          
          // 检查每个分类下有多少项目
          if (data.projectCategories && data.projectCategories.length > 0) {
            const categoryCounts: Record<string, number> = {};
            data.projectCategories.forEach((cat: { id: string; name: string }) => {
              const count = data.projects.filter((p: { categoryId?: string }) => p.categoryId === cat.id).length;
              categoryCounts[cat.name] = count;
            });
            console.log('各分类下的项目数量:', categoryCounts);
          }
        } else {
          console.warn('未获取到项目数据');
        }
        
        // 检查项目分类数据
        if (data.projectCategories && data.projectCategories.length > 0) {
          console.log('项目分类数据示例:', data.projectCategories.slice(0, 3));
        } else {
          console.warn('未获取到项目分类数据');
        }
        
        setOrganizations(data.organizations || []);
        setDepartments(data.departments || []);
        setProjectCategories(data.projectCategories || []);
        setProjects(data.projects || []);
        setSubProjects(data.subProjects || []);
        setFundTypes(data.fundTypes || []);
        metaLoadedRef.current = true;
      } else {
        console.error(`获取预测填报元数据失败`, await response.text());
        toast({
          title: "获取元数据失败",
          description: "请刷新页面重试",
          variant: "destructive",
        });
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
    
    console.log('构建查询参数，当前筛选条件:', JSON.stringify(currentFilters, null, 2));
    
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
    
    if (currentFilters.status && currentFilters.status !== 'all') {
      // 确保状态值是小写的，与后端API匹配
      const statusValue = currentFilters.status.toLowerCase();
      params.append("status", statusValue);
      console.log(`添加状态筛选条件: ${statusValue}`);
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

  // 获取预测记录列表
  const fetchRecords = useCallback(async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }
    
    try {
      console.log('开始获取预测记录列表...');
      
      // 调用API获取预测记录列表
      const queryParams = buildQueryParams();
      // 添加缓存控制参数
      const cacheParam = `_t=${Date.now().toString()}`;
      const fullQueryString = queryParams ? `${queryParams}&${cacheParam}` : cacheParam;
      
      console.log(`请求API: /api/funding/predict-v2?${fullQueryString}`);
      
      const response = await fetch(`/api/funding/predict-v2?${fullQueryString}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API响应错误: ${response.status}`, errorText);
        throw new Error(`获取预测记录列表失败: ${response.status} ${errorText}`);
      }
      
      const data: PaginatedResponse<PredictRecord> & { warning?: string } = await response.json();
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
      
      // 判断结果是否为空，并检查筛选条件
      if (data.total === 0) {
        // 检查是否应用了筛选
        const filters = filtersRef.current;
        const hasOrganizationFilter = filters.organization && filters.organization !== 'all';
        const hasDepartmentFilter = filters.department && filters.department !== 'all';
        const hasProjectCategoryFilter = filters.category && filters.category !== 'all';
        const hasProjectFilter = filters.project && filters.project !== 'all'; 
        const hasSubProjectFilter = filters.subProject && filters.subProject !== 'all';
        const hasFundTypeFilter = filters.fundType && filters.fundType !== 'all';
        const hasStatusFilter = filters.status && filters.status !== 'all';
        
        const hasAnyFilter = hasOrganizationFilter || hasDepartmentFilter || hasProjectCategoryFilter || 
                            hasProjectFilter || hasSubProjectFilter || hasFundTypeFilter || hasStatusFilter;
        
        if (hasAnyFilter) {
          console.log('筛选结果为空，应用的筛选条件:', JSON.stringify(filters, null, 2));
          
          // 根据筛选条件提供不同的提示信息
          let warningMessage = '';
          
          if (hasOrganizationFilter) {
            // 查找所选组织的名称
            const selectedOrg = organizations.find(org => org.id === filters.organization);
            const orgName = selectedOrg ? selectedOrg.name : '所选组织';
            
            warningMessage = `未找到与 ${orgName} 相关的填报记录。`;
            console.log(`组织筛选警告: ${warningMessage}`);
            
            // 提供更明确的引导
            const isAdmin = user?.role === "ADMIN";
            const adminMessage = isAdmin ? 
              `请点击页面上方的"修复项目-组织关联"按钮，为项目建立与组织的关联关系。` : 
              `请联系管理员使用"修复项目-组织关联"功能，为项目建立与组织的关联关系。`;
            
            // 提示用户
            toast({
              title: "未找到记录",
              description: `${warningMessage}这可能是因为该组织没有关联项目。${adminMessage}`,
              variant: "destructive",
              duration: 10000, // 延长显示时间，确保用户能看到
            });
          }
          else if (hasStatusFilter && filters.status) {
            const statusMap: Record<string, string> = {
              'draft': '草稿',
              'submitted': '已提交',
              'pending_withdrawal': '待撤回',
              'approved': '已审核',
              'rejected': '已拒绝',
              'unfilled': '未填写'
            };
            
            const statusName = statusMap[filters.status.toLowerCase()] || filters.status;
            
            warningMessage = `未找到状态为"${statusName}"的填报记录。`;
            console.log(`状态筛选警告: ${warningMessage}`);
            
            // 提示用户
            toast({
              title: "未找到记录",
              description: warningMessage,
              variant: "destructive",
            });
          }
          // 可以添加其他筛选条件的提示...
        }
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
      console.error("获取预测记录列表失败", error);
      toast({
        title: "获取预测记录列表失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [buildQueryParams, fetchMetadata, toast, organizations]);

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
    departmentId: string;
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
    console.log('getProjectsByCategory 被调用:', { categoryId, projectsCount: projects.length });
    
    // 如果没有选择分类或选择了"全部"，返回所有项目
    if (!categoryId || categoryId === 'all') {
      console.log('返回所有项目，数量:', projects.length);
      return projects;
    }
    
    // 检查项目数据是否有正确的categoryId字段
    const hasValidProjectsWithCategory = projects.some(project => project.categoryId === categoryId);
    
    // 如果没有任何项目匹配当前选择的分类ID，则检查项目数据是否有任何categoryId
    if (!hasValidProjectsWithCategory) {
      console.warn(`警告: 没有项目匹配分类ID: ${categoryId}`);
      
      // 检查是否有任何项目包含categoryId字段
      const hasAnyCategoryId = projects.some(project => project.categoryId);
      
      if (!hasAnyCategoryId) {
        console.warn('警告: 项目数据中没有任何项目包含categoryId字段，返回所有项目');
        return projects;
      }
      
      // 记录所有项目的分类ID，帮助调试
      const categoryIds = Array.from(new Set(projects.map(p => p.categoryId).filter(Boolean)));
      console.log('项目中存在的分类ID:', categoryIds);
    }
    
    // 确保项目数据已加载并且有 categoryId 字段
    const filteredProjects = projects.filter(project => {
      // 特殊处理：如果项目没有分类ID但筛选器已选择了特定分类，仍然返回这些项目
      // 这样可以确保即使数据不完整，用户仍能看到所有项目
      if (!project.categoryId) {
        // 返回true将无分类项目包含在结果中
        // 设置为false则排除无分类项目
        return false; 
      }
      
      const match = project.categoryId === categoryId;
      if (match) {
        console.log('找到匹配的项目:', project);
      }
      return match;
    });
    
    console.log('筛选后的项目数量:', filteredProjects.length);
    
    // 如果没有找到匹配的项目，提供所有项目作为后备选项
    if (filteredProjects.length === 0) {
      console.warn(`警告: 分类ID ${categoryId} 下没有找到任何项目，返回所有项目`);
      return projects;
    }
    
    return filteredProjects;
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
    setPagination,
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