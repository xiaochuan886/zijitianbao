import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/components/ui/use-toast"
import { useDebounce } from "@/hooks/use-debounce"
import { getCurrentMonth } from "@/lib/utils"

// 定义项目筛选条件类型
export interface ProjectFilters {
  organization: string
  department: string
  project: string
  status: string
}

// 定义实际资金记录类型
export interface ActualUserRecord {
  id: string
  projectId: string
  subProjectId: string
  projectName: string
  subProjectName: string
  organizationName: string
  departmentName: string
  amount: number
  status: string
  year: number
  month: number
  createdAt: string
  updatedAt: string
}

// 定义组织类型
export interface Organization {
  id: string
  name: string
}

// 定义部门类型
export interface Department {
  id: string
  name: string
}

// 定义钩子返回类型
export interface UseFundingActualV2Return {
  loading: boolean
  projects: ActualUserRecord[]
  setProjects: React.Dispatch<React.SetStateAction<ActualUserRecord[]>>
  filters: ProjectFilters
  handleFilterChange: (newFilters: Partial<ProjectFilters>) => void
  handleReset: () => void
  organizations: Organization[]
  departments: Department[]
  currentMonth: { year: number; month: number }
  fetchProjects: (immediate?: boolean) => Promise<void>
  debouncedFetch: (immediate?: boolean) => void
  batchSubmitProjects: (recordIds: string[]) => Promise<boolean>
}

export function useFundingActualV2(): UseFundingActualV2Return {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<ActualUserRecord[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const currentMonth = getCurrentMonth()

  // 初始化筛选条件
  const [filters, setFilters] = useState<ProjectFilters>({
    organization: "all",
    department: "all",
    project: "",
    status: "all"
  })

  // 处理筛选条件变化
  const handleFilterChange = useCallback((newFilters: Partial<ProjectFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // 重置筛选条件
  const handleReset = useCallback(() => {
    setFilters({
      organization: "all",
      department: "all",
      project: "",
      status: "all"
    })
  }, [])

  // 获取项目列表
  const fetchProjects = useCallback(async (immediate = false) => {
    try {
      if (immediate) setLoading(true)

      // 构建查询参数
      const params = new URLSearchParams()
      if (filters.organization !== "all") params.append("organizationId", filters.organization)
      if (filters.department !== "all") params.append("departmentId", filters.department)
      if (filters.project) params.append("projectName", filters.project)
      if (filters.status !== "all") params.append("status", filters.status)
      params.append("year", currentMonth.year.toString())
      params.append("month", currentMonth.month.toString())

      // 发起请求
      const response = await fetch(`/api/funding/actual-v2?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "获取项目列表失败")
      }

      const data = await response.json()
      setProjects(data.items || [])
    } catch (error) {
      console.error("获取项目列表失败", error)
      toast({
        title: "获取项目列表失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [filters, currentMonth, toast])

  // 使用防抖处理搜索
  const debouncedFetch = useDebounce(fetchProjects, 500)

  // 批量提交项目
  const batchSubmitProjects = useCallback(async (recordIds: string[]): Promise<boolean> => {
    try {
      // 显示提交中提示
      const submittingToast = toast({
        title: "提交中",
        description: `正在提交 ${recordIds.length} 个记录，请稍候...`,
      })

      // 调用API批量提交
      const response = await fetch("/api/funding/actual-v2/batch-submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recordIds,
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
        description: `已成功提交 ${result.count || recordIds.length} 个记录`,
      })

      // 刷新项目列表
      await fetchProjects(true)
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
  }, [currentMonth, fetchProjects, toast])

  // 获取组织和部门列表
  const fetchOrganizationsAndDepartments = useCallback(async () => {
    try {
      // 获取组织列表
      const orgResponse = await fetch("/api/organizations")
      if (!orgResponse.ok) {
        throw new Error("获取组织列表失败")
      }
      const orgData = await orgResponse.json()
      setOrganizations(orgData.items || [])

      // 获取部门列表
      const deptResponse = await fetch("/api/departments")
      if (!deptResponse.ok) {
        throw new Error("获取部门列表失败")
      }
      const deptData = await deptResponse.json()
      setDepartments(deptData.items || [])
    } catch (error) {
      console.error("获取组织和部门列表失败", error)
      toast({
        title: "获取组织和部门列表失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive"
      })
    }
  }, [toast])

  // 初始化时获取组织和部门列表
  useEffect(() => {
    fetchOrganizationsAndDepartments()
  }, [fetchOrganizationsAndDepartments])

  // 初始化时获取项目列表
  useEffect(() => {
    fetchProjects(true)
  }, [fetchProjects])

  return {
    loading,
    projects,
    setProjects,
    filters,
    handleFilterChange,
    handleReset,
    organizations,
    departments,
    currentMonth,
    fetchProjects,
    debouncedFetch,
    batchSubmitProjects
  }
} 