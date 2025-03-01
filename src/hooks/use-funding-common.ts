"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"

// 通用的筛选条件类型
export type ProjectFilters = {
  organization: string
  department: string
  project: string
  status: string
}

// 通用的元数据类型
export type ProjectMeta = {
  organizations: { id: string; name: string; code: string }[]
  departments: { id: string; name: string }[]
}

// 通用的月份信息类型
export type MonthInfo = {
  year: number
  month: number
}

// 获取当前月份的下一个月
export const getNextMonth = (): MonthInfo => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 2 // +1 是下个月，+1 是因为 getMonth() 从 0 开始
  return { year, month }
}

// 通用的资金管理钩子参数
export interface UseFundingParams {
  apiEndpoint: string // API 端点，如 'actual' 或 'predict'
  initialFilters?: ProjectFilters // 初始筛选条件
}

// 通用的资金管理钩子
export function useFundingCommon<T>({
  apiEndpoint,
  initialFilters = {
    organization: "all",
    department: "all",
    project: "",
    status: "all"
  }
}: UseFundingParams) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<T[]>([])
  const [filters, setFilters] = useState<ProjectFilters>(initialFilters)
  const [organizations, setOrganizations] = useState<{value: string, label: string}[]>([])
  const [departments, setDepartments] = useState<{value: string, label: string}[]>([])
  const [currentMonth, setCurrentMonth] = useState<MonthInfo>(getNextMonth())
  const [debouncedFetch, setDebouncedFetch] = useState(false)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 获取元数据（机构和部门列表）
  const fetchMetadata = useCallback(async () => {
    try {
      const metaResponse = await fetch(`/api/funding/${apiEndpoint}/meta`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      if (metaResponse.ok) {
        const metaData = await metaResponse.json()
        setOrganizations(metaData.organizations.map((org: any) => ({ 
          value: org.id, 
          label: `${org.name} (${org.code})` 
        })))
        setDepartments(metaData.departments.map((dep: any) => ({ 
          value: dep.id, 
          label: dep.name 
        })))
      }
    } catch (error) {
      console.error(`获取${apiEndpoint}机构和部门列表失败`, error)
    }
  }, [apiEndpoint])

  // 获取项目列表
  const fetchProjects = useCallback(async (forceRefresh = false) => {
    try {
      // 取消之前的请求
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
        fetchTimeoutRef.current = null
      }
      
      setLoading(true)
      
      // 获取下个月
      const nextMonth = getNextMonth()
      setCurrentMonth(nextMonth)
      
      // 构建查询参数
      const params = new URLSearchParams()
      params.append("year", nextMonth.year.toString())
      params.append("month", nextMonth.month.toString())
      
      if (filters.organization !== "all") {
        params.append("organizationId", filters.organization)
      }
      
      if (filters.department !== "all") {
        params.append("departmentId", filters.department)
      }
      
      if (filters.project) {
        params.append("projectName", filters.project)
      }
      
      if (filters.status !== "all") {
        params.append("status", filters.status)
      }
      
      // 添加缓存控制参数
      params.append("_t", Date.now().toString())
      
      // 调用API获取项目列表
      const response = await fetch(`/api/funding/${apiEndpoint}?${params.toString()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      if (!response.ok) {
        throw new Error(`获取${apiEndpoint}项目列表失败`)
      }
      
      const data = await response.json()
      
      // 首次加载时，获取所有机构和部门
      if (!organizations.length || !departments.length) {
        await fetchMetadata()
      }
      
      setProjects(data)
    } catch (error) {
      console.error(`获取${apiEndpoint}项目列表失败`, error)
      toast({
        title: "错误",
        description: `获取${apiEndpoint}项目列表失败`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [filters, toast, organizations.length, departments.length, apiEndpoint, fetchMetadata])

  // 处理筛选条件变化 - 添加防抖处理
  const handleFilterChange = useCallback((newFilters: ProjectFilters) => {
    setFilters(newFilters)
    
    // 设置防抖标志
    setDebouncedFetch(true)
    
    // 清除之前的定时器
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
    }
    
    // 设置新的定时器，延迟500ms执行查询
    fetchTimeoutRef.current = setTimeout(() => {
      setDebouncedFetch(false)
      fetchProjects(true)
    }, 500)
  }, [fetchProjects])

  // 批量提交项目
  const batchSubmitProjects = useCallback(async (items: any[]) => {
    try {
      // 显示正在提交提示
      const submittingToast = toast({
        title: "提交中",
        description: `正在提交 ${items.length} 个子项目，请稍候...`,
      })
      
      // 调用API批量提交
      const response = await fetch(`/api/funding/${apiEndpoint}/batch-submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items,
          year: currentMonth.year,
          month: currentMonth.month,
        }),
      })
      
      // 关闭提交中的提示
      submittingToast.dismiss()
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "批量提交失败")
      }
      
      const result = await response.json()
      
      // 显示成功提示
      toast({
        title: "提交成功",
        description: `已成功提交 ${result.count} 个项目`,
      })
      
      // 刷新项目列表
      fetchProjects(true)
      
      return true
    } catch (error) {
      console.error("批量提交失败", error)
      toast({
        title: "提交失败",
        description: error instanceof Error ? error.message : "批量提交失败",
        variant: "destructive"
      })
      return false
    }
  }, [apiEndpoint, currentMonth, fetchProjects, toast])

  // 初始化
  useEffect(() => {
    fetchProjects(true)
    
    // 清理函数
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [fetchProjects])

  return {
    loading,
    debouncedFetch,
    projects,
    setProjects,
    filters,
    setFilters,
    handleFilterChange,
    organizations,
    departments,
    currentMonth,
    fetchProjects,
    batchSubmitProjects
  }
}

// 通用的状态选项
export const commonStatusOptions = [
  { value: "未填写", label: "未填写" },
  { value: "草稿", label: "草稿" },
  { value: "已提交", label: "已提交" },
  { value: "pending_withdrawal", label: "撤回审核中" }
]

// 检查项目是否可编辑
export const isProjectEditable = (status?: string): boolean => {
  return status === "草稿" || status === "未填写" || status === "draft" || status === "unfilled"
} 