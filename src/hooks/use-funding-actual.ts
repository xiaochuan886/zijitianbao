"use client"

import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { debounce } from "lodash";

// 定义数据类型
export interface FundRecord {
  id: string;
  subProjectId: string;
  subProjectName: string;
  fundTypeId: string;
  fundTypeName: string;
  year: number;
  month: number;
  predicted: number | null;
  actualUser: number | null;
  actualFinance: number | null;
  status: string;
  remark: string;
}

export interface FundType {
  id: string;
  name: string;
  records: FundRecord[];
}

export interface SubProject {
  id: string;
  name: string;
  fundTypes: FundType[];
}

export interface Organization {
  id: string;
  name: string;
  code: string;
}

export interface ProjectData {
  id: string;
  name: string;
  status?: string;
  userStatus?: string;
  financeStatus?: string;
  organization: Organization;
  subProjects: SubProject[];
}

export interface MonthInfo {
  year: number;
  month: number;
}

export interface TempRecord {
  id: string;
  subProjectId: string;
  fundTypeId: string;
  year: number;
  month: number;
  value: number | null;
  remark: string;
}

export interface ProjectFilters {
  organization: string;
  department: string;
  project: string;
  status: string;
}

export interface ProjectMeta {
  organizations: { id: string; name: string; code: string }[];
  departments: { id: string; name: string }[];
}

// 获取当前月份的下一个月
export const getNextMonth = (): MonthInfo => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 2; // +1 是下个月，+1 是因为 getMonth() 从 0 开始
  return { year, month };
};

// 格式化金额
export const formatCurrency = (amount: number | null): string => {
  if (amount === null) return "";
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
  }).format(amount);
};

/**
 * 实际支付填报相关的Hook
 */
export function useFundingActual(isUserRole: boolean = true) {
  const { toast } = useToast();
  
  // 状态管理
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [records, setRecords] = useState<Record<string, number | null>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [originalRecords, setOriginalRecords] = useState<Record<string, number | null>>({});
  const [originalRemarks, setOriginalRemarks] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [nextMonth, setNextMonth] = useState<MonthInfo>(getNextMonth());
  const [meta, setMeta] = useState<ProjectMeta>({ organizations: [], departments: [] });
  
  // 保存各种状态的引用，避免在依赖项中引起循环
  const recordsRef = useRef(records);
  const remarksRef = useRef(remarks);
  const originalRecordsRef = useRef(originalRecords);
  const originalRemarksRef = useRef(originalRemarks);
  const hasChangesRef = useRef(hasChanges);
  const projectsRef = useRef(projects);
  const savingRef = useRef(saving);
  
  // 更新引用
  useEffect(() => { recordsRef.current = records; }, [records]);
  useEffect(() => { remarksRef.current = remarks; }, [remarks]);
  useEffect(() => { originalRecordsRef.current = originalRecords; }, [originalRecords]);
  useEffect(() => { originalRemarksRef.current = originalRemarks; }, [originalRemarks]);
  useEffect(() => { hasChangesRef.current = hasChanges; }, [hasChanges]);
  useEffect(() => { projectsRef.current = projects; }, [projects]);
  useEffect(() => { savingRef.current = saving; }, [saving]);
  
  // 检查是否有变更
  const checkForChanges = useCallback(() => {
    const currentRecords = recordsRef.current;
    const currentRemarks = remarksRef.current;
    const currentOriginalRecords = originalRecordsRef.current;
    const currentOriginalRemarks = originalRemarksRef.current;
    
    const hasRecordChanges = Object.keys(currentRecords).some(key => {
      const original = currentOriginalRecords[key] === null ? null : currentOriginalRecords[key];
      const current = currentRecords[key] === null ? null : currentRecords[key];
      return original !== current;
    });
    
    const hasRemarkChanges = Object.keys(currentRemarks).some(key => {
      return currentOriginalRemarks[key] !== currentRemarks[key];
    });
    
    return hasRecordChanges || hasRemarkChanges;
  }, []);
  
  // 获取临时记录列表
  const getTempRecords = useCallback((): TempRecord[] => {
    const tempRecords: TempRecord[] = [];
    
    for (const recordId in recordsRef.current) {
      if (recordId.startsWith('temp-')) {
        const [_, subProjectId, fundTypeId, year, month] = recordId.split('-');
        
        if (subProjectId && fundTypeId && year && month) {
          const amount = recordsRef.current[recordId];
          const remark = remarksRef.current[recordId] || "";
          
          if (amount !== null) {
            tempRecords.push({
              id: recordId,
              subProjectId,
              fundTypeId,
              year: parseInt(year),
              month: parseInt(month),
              value: amount,
              remark
            });
          }
        }
      }
    }
    
    return tempRecords;
  }, []);
  
  // 处理输入变化
  const handleInputChange = useCallback((recordId: string, value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    setRecords(prev => {
      // 避免不必要的更新
      if (prev[recordId] === numValue) return prev;
      return { ...prev, [recordId]: numValue };
    });
  }, []);
  
  // 处理备注变化
  const handleRemarkChange = useCallback((recordId: string, value: string) => {
    setRemarks(prev => {
      // 避免不必要的更新
      if (prev[recordId] === value) return prev;
      return { ...prev, [recordId]: value };
    });
  }, []);
  
  // 计算年度汇总
  const calculateYearTotal = useCallback((subProjectId: string, fundTypeId: string, year: number = nextMonth.year) => {
    let total = 0;
    const currentProjects = projectsRef.current;
    const currentRecords = recordsRef.current;
    
    currentProjects.forEach(project => {
      project.subProjects.forEach(subProject => {
        if (subProject.id === subProjectId) {
          subProject.fundTypes.forEach(fundType => {
            if (fundType.id === fundTypeId) {
              fundType.records.forEach(record => {
                // 根据角色获取相应的金额数据
                const amount = isUserRole ? record.actualUser : record.actualFinance;
                // 只计算有效的记录
                if (amount !== null) {
                  total += amount;
                } else if (record.predicted !== null) {
                  // 如果实际金额为空，但预测金额不为空，则使用预测金额
                  total += record.predicted;
                } else {
                  // 对于当前月份的临时记录，从currentRecords中获取值
                  const recordKey = record.id;
                  if (currentRecords[recordKey] !== null && currentRecords[recordKey] !== undefined) {
                    total += currentRecords[recordKey] as number;
                  }
                }
              });
            }
          });
        }
      });
    });
    
    return total;
  }, [nextMonth.year, isUserRole]);
  
  // 保存草稿函数
  const saveDraft = useCallback(async () => {
    // 先检查是否有变更
    const shouldSave = checkForChanges();
    if (!shouldSave || savingRef.current) return;
    
    try {
      setSaving(true);
      
      // 收集临时记录信息
      const tempRecords = getTempRecords();
      
      // 调用API保存
      const response = await fetch("/api/funding/actual/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: recordsRef.current,
          remarks: remarksRef.current,
          projectInfo: {
            tempRecords,
            nextMonth: nextMonth
          },
          isUserReport: isUserRole
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "保存草稿失败");
      }
      
      // 更新原始记录
      setOriginalRecords({...recordsRef.current});
      setOriginalRemarks({...remarksRef.current});
      setHasChanges(false);
      
      toast({
        title: "已保存",
        description: "草稿已自动保存",
      });
    } catch (error) {
      console.error("保存草稿失败", error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "保存草稿失败",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }, [toast, checkForChanges, nextMonth, getTempRecords]);
  
  // 创建防抖函数
  const debouncedSaveDraft = useRef(
    debounce(() => {
      saveDraft();
    }, 2000)
  ).current;
  
  // 保存更改
  const saveChanges = useCallback(async () => {
    if (!hasChangesRef.current) {
      toast({
        title: "信息",
        description: "没有需要保存的更改",
      });
      return;
    }
    
    if (savingRef.current) return;
    
    try {
      setSaving(true);
      savingRef.current = true;
      
      // 获取所有已修改的记录
      const changedRecords: Record<string, number | null> = {};
      const changedRemarks: Record<string, string> = {};
      
      Object.keys(recordsRef.current).forEach((key) => {
        if (recordsRef.current[key] !== originalRecordsRef.current[key]) {
          changedRecords[key] = recordsRef.current[key];
        }
      });
      
      Object.keys(remarksRef.current).forEach((key) => {
        if (remarksRef.current[key] !== originalRemarksRef.current[key]) {
          changedRemarks[key] = remarksRef.current[key];
        }
      });
      
      // 准备要提交的项目数据
      const projectInfo = {
        projectIds: projectsRef.current.map(p => p.id),
        nextMonth: nextMonth,
        tempRecords: getTempRecords(),
      };
      
      // 调用API保存更改
      const response = await fetch("/api/funding/actual/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: changedRecords,
          remarks: changedRemarks,
          projectInfo,
          isUserReport: isUserRole
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "保存失败");
      }
      
      const result = await response.json();
      
      // 更新原始记录，以便下次比较
      setOriginalRecords({...recordsRef.current});
      setOriginalRemarks({...remarksRef.current});
      originalRecordsRef.current = {...recordsRef.current};
      originalRemarksRef.current = {...remarksRef.current};
      
      // 重置变更标记
      setHasChanges(false);
      hasChangesRef.current = false;
      
      toast({
        title: "保存成功",
        description: `已保存 ${result.created + result.updated} 条记录`,
      });
      
      return result;
    } catch (error) {
      console.error("保存失败", error);
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "保存失败",
        variant: "destructive"
      });
      throw error;
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }, [nextMonth, toast, isUserRole, getTempRecords]);
  
  // 提交项目
  const submitProject = useCallback(async () => {
    // 先保存所有更改
    if (hasChangesRef.current) {
      await saveChanges();
    }
    
    try {
      setSubmitting(true);
      
      // 准备要提交的项目数据
      const projectInfo = {
        projectIds: projectsRef.current.map(p => p.id),
        nextMonth: nextMonth,
        tempRecords: getTempRecords(),
      };
      
      // 调用API提交实际支付
      const response = await fetch("/api/funding/actual/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: recordsRef.current,
          remarks: remarksRef.current,
          projectInfo,
          isUserReport: isUserRole
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "提交失败");
      }
      
      const result = await response.json();
      
      toast({
        title: "提交成功",
        description: `已提交 ${result.count} 条记录`,
      });
      
      return result;
    } catch (error) {
      console.error("提交失败", error);
      toast({
        title: "提交失败",
        description: error instanceof Error ? error.message : "提交失败",
        variant: "destructive"
      });
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, [saveChanges, nextMonth, getTempRecords, toast, isUserRole]);
  
  // 获取项目数据
  const fetchProjectData = useCallback(async (params: {
    id?: string;
    ids?: string;
    year?: string;
    month?: string;
    role?: string;
  }) => {
    try {
      setLoading(true);
      
      const { id, ids, year = new Date().getFullYear().toString(), month = (new Date().getMonth() + 2).toString(), role = isUserRole ? 'user' : 'finance' } = params;
      
      setNextMonth({
        year: parseInt(year),
        month: parseInt(month)
      });
      
      if (!ids && !id) {
        toast({
          title: "错误",
          description: "缺少必要的项目ID参数",
          variant: "destructive"
        });
        return null;
      }
      
      // 构造API请求URL
      const url = ids 
        ? `/api/funding/actual/batch?ids=${ids}&year=${year}&month=${month}&role=${role}` 
        : `/api/funding/actual/${id}?year=${year}&month=${month}&role=${role}`;
      
      // 获取项目数据
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("获取项目详情失败");
      }
      
      const data = await response.json();
      
      // 处理批量和单个项目的数据结构差异
      const projectsData = Array.isArray(data) ? data : [data];
      setProjects(projectsData);
      projectsRef.current = projectsData;
      
      // 初始化记录和备注
      const initialRecords: Record<string, number | null> = {};
      const initialRemarks: Record<string, string> = {};
      
      projectsData.forEach((project) => {
        project.subProjects.forEach((subProject) => {
          subProject.fundTypes.forEach((fundType) => {
            if (fundType.records.length === 0) {
              // 如果没有记录，创建临时记录
              const tempId = `temp-${subProject.id}-${fundType.id}-${year}-${month}`;
              initialRecords[tempId] = null;
              initialRemarks[tempId] = "";
            } else {
              fundType.records.forEach((record: FundRecord) => {
                // 根据角色获取对应的值
                initialRecords[record.id] = isUserRole ? record.actualUser : record.actualFinance;
                initialRemarks[record.id] = record.remark || "";
              });
            }
          });
        });
      });
      
      setRecords(initialRecords);
      setRemarks(initialRemarks);
      setOriginalRecords({...initialRecords});
      setOriginalRemarks({...initialRemarks});
      
      // 更新引用
      recordsRef.current = initialRecords;
      remarksRef.current = initialRemarks;
      originalRecordsRef.current = {...initialRecords};
      originalRemarksRef.current = {...initialRemarks};
      
      setLoading(false);
      return projectsData;
    } catch (error) {
      console.error("获取数据失败", error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "获取数据失败",
        variant: "destructive"
      });
      setLoading(false);
      return null;
    }
  }, [toast, isUserRole]);
  
  // 获取项目列表
  const fetchProjectList = useCallback(async (filters: ProjectFilters, forceRefresh = false) => {
    try {
      setLoading(true);
      
      // 获取下个月
      const nextMonthInfo = getNextMonth();
      setNextMonth(nextMonthInfo);
      
      // 构建查询参数
      const params = new URLSearchParams();
      params.append("year", nextMonthInfo.year.toString());
      params.append("month", nextMonthInfo.month.toString());
      
      if (filters.organization !== "all") {
        params.append("organizationId", filters.organization);
      }
      
      if (filters.department !== "all") {
        params.append("departmentId", filters.department);
      }
      
      if (filters.project) {
        params.append("projectName", filters.project);
      }
      
      if (filters.status !== "all") {
        params.append("status", filters.status);
      }
      
      // 添加缓存控制参数，避免浏览器缓存
      params.append("_t", Date.now().toString());
      
      // 调用API获取项目列表
      const response = await fetch(`/api/funding/actual?${params.toString()}`, {
        // 添加缓存控制头，避免浏览器缓存
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
      
      // 首次加载时，获取所有机构和部门（不受筛选影响）
      if (!meta.organizations.length || !meta.departments.length) {
        try {
          const metaResponse = await fetch(`/api/funding/actual/meta`, {
            // 添加缓存控制头，避免浏览器缓存
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            }
          });
          if (metaResponse.ok) {
            const metaData = await metaResponse.json();
            setMeta({
              organizations: metaData.organizations.map((org: any) => ({ 
                id: org.id, 
                name: org.name,
                code: org.code
              })),
              departments: metaData.departments.map((dep: any) => ({ 
                id: dep.id, 
                name: dep.name 
              }))
            });
          }
        } catch (error) {
          console.error("获取机构和部门列表失败", error);
        }
      }
      
      setLoading(false);
      return data;
    } catch (error) {
      console.error("获取项目列表失败", error);
      toast({
        title: "错误",
        description: "获取项目列表失败",
        variant: "destructive"
      });
      setLoading(false);
      return [];
    }
  }, [toast, meta.organizations.length, meta.departments.length]);
  
  // 监听记录和备注变化，检查是否有变更并更新hasChanges状态
  useEffect(() => {
    const hasChange = checkForChanges();
    
    // 只有在变化状态与当前不同时才更新状态
    if (hasChange !== hasChanges) {
      setHasChanges(hasChange);
    }
  }, [records, remarks, checkForChanges, hasChanges]);
  
  return {
    // 状态
    loading,
    saving,
    submitting,
    projects,
    records,
    remarks,
    hasChanges,
    nextMonth,
    meta,
    
    // 方法
    setNextMonth,
    handleInputChange,
    handleRemarkChange,
    calculateYearTotal,
    saveDraft,
    debouncedSaveDraft,
    saveChanges,
    submitProject,
    fetchProjectData,
    fetchProjectList,
    formatCurrency,
    getTempRecords
  };
}