"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { FileEdit, Upload, RotateCcw } from "lucide-react"
import { columns } from "./columns"
import type { ActualPayment } from "./columns"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { fetchActualPaymentMetadata, batchSubmitActualPayments } from "./client-api"
import type { ColumnDef } from "@tanstack/react-table"

// 定义类型
interface Project extends ActualPayment {
  budget?: number;
}

interface ApiError {
  message: string;
}

// DataTable所需的Column类型
interface Column {
  accessorKey?: string
  id?: string
  header: string
  cell?: (props: { row: any }) => React.ReactNode
}

export default function ActualPaymentPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [filters, setFilters] = useState({
    organization: "all",
    department: "all",
    project: "",
    status: "all",
    isUserReport: true // 默认为填报人视角
  })
  const prevFiltersRef = useRef(filters)
  const [organizations, setOrganizations] = useState<{value: string, label: string}[]>([])
  const [departments, setDepartments] = useState<{value: string, label: string}[]>([])
  const [statuses] = useState([
    { value: "draft", label: "草稿" },
    { value: "submitted", label: "已提交" },
    { value: "pending_withdrawal", label: "待撤回" }
  ])
  const [currentMonth, setCurrentMonth] = useState<{year: number, month: number}>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() // 当前月
  })
  const [submitting, setSubmitting] = useState(false)
  const [debouncedFetch, setDebouncedFetch] = useState(false)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [activeTab, setActiveTab] = useState("user") // "user" 或 "finance"

  // 获取可填报月份（当前月往前推3个月）
  const getAvailableMonth = useCallback(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() // getMonth() 从 0 开始
    return { year, month: month + 1 } // 转换为1-12月格式
  }, [])

  // 将列定义转换为DataTable所需的格式
  const tableColumns = useMemo(() => {
    return columns.map(col => ({
      id: col.id,
      header: typeof col.header === 'string' ? col.header : col.id || '',
      accessorKey: 'accessorKey' in col ? (col as any).accessorKey : undefined,
      cell: col.cell as ((props: { row: any }) => React.ReactNode)
    }));
  }, []);

  // 获取项目列表
  const fetchProjects = useCallback(async (forceRefresh = false) => {
    try {
      // 如果正在加载中，取消之前的请求
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
        fetchTimeoutRef.current = null
      }
      
      // 如果不是强制刷新，且筛选条件没有变化，则不重新加载数据
      if (!forceRefresh && 
          JSON.stringify(filters) === JSON.stringify(prevFiltersRef.current) && 
          projects.length > 0) {
        return
      }
      
      // 更新上一次的筛选条件
      prevFiltersRef.current = {...filters}
      
      setLoading(true)
      
      // 获取当前可填报月份
      const availableMonth = getAvailableMonth()
      setCurrentMonth(availableMonth)
      
      // 构建查询参数
      const params = new URLSearchParams()
      params.append("year", availableMonth.year.toString())
      params.append("month", availableMonth.month.toString())
      
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
      
      // 是否为用户报表
      params.append("isUserReport", String(filters.isUserReport))
      
      // 添加缓存控制参数，避免浏览器缓存
      params.append("_t", Date.now().toString())
      
      // 调用API获取项目列表
      const response = await fetch(`/api/funding/actual?${params.toString()}`, {
        // 添加缓存控制头，避免浏览器缓存
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      if (!response.ok) {
        throw new Error("获取项目列表失败")
      }
      
      const data = await response.json()
      
      // 首次加载时，获取所有机构和部门
      if (!organizations.length || !departments.length) {
        try {
          const metaResult = await fetchActualPaymentMetadata()
          if (metaResult.success) {
            setOrganizations(metaResult.data.organizations.map((org: any) => ({ 
              value: org.id, 
              label: `${org.name} ${org.code ? `(${org.code})` : ''}` 
            })))
            setDepartments(metaResult.data.departments.map((dep: any) => ({ 
              value: dep.id, 
              label: dep.name 
            })))
          }
        } catch (error) {
          console.error("获取机构和部门列表失败", error)
        }
      }
      
      // 更新项目列表
      setProjects(data.projects || [])
      setLoading(false)
    } catch (error) {
      console.error("获取项目列表失败", error)
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "获取项目列表失败",
        variant: "destructive"
      })
      setLoading(false)
    }
  }, [filters, getAvailableMonth, toast, organizations.length, departments.length, projects.length])

  // 处理筛选条件变化 - 添加防抖处理
  const handleFilterChange = useCallback((newFilters: typeof filters) => {
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

  // 处理角色切换
  const handleRoleChange = useCallback((role: string) => {
    setActiveTab(role)
    handleFilterChange({...filters, isUserReport: role === "user"})
  }, [filters, handleFilterChange])

  // 处理批量填报
  const handleBatchEdit = useCallback(() => {
    if (selectedProjects.length === 0) {
      toast({
        title: "提示",
        description: "请先选择项目",
      })
      return
    }
    
    // 检查是否所有选中的项目都可编辑（草稿或待撤回状态）
    const hasNonEditableProjects = selectedProjects.some(id => {
      const project = projects.find(p => p.id === id)
      return project && project.status !== "draft" && project.status !== "pending_withdrawal"
    })
    
    if (hasNonEditableProjects) {
      toast({
        title: "警告",
        description: "只有草稿和待撤回状态的项目才能编辑",
        variant: "destructive"
      })
      return
    }
    
    // 将选中的项目ID作为查询参数传递
    const ids = selectedProjects.join(",")
    router.push(`/funding/actual/edit/batch-edit?ids=${ids}&year=${currentMonth.year}&month=${currentMonth.month}&isUserReport=${filters.isUserReport}`)
  }, [selectedProjects, router, toast, currentMonth, projects, filters.isUserReport])

  // 处理单个编辑
  const handleSingleEdit = useCallback((projectId: string) => {
    router.push(`/funding/actual/edit/${projectId}?year=${currentMonth.year}&month=${currentMonth.month}&isUserReport=${filters.isUserReport}`)
  }, [router, currentMonth, filters.isUserReport])

  // 处理批量提交
  const handleBatchSubmit = useCallback(async () => {
    if (selectedProjects.length === 0) {
      toast({
        title: "提示",
        description: "请先选择项目",
      })
      return
    }
    
    // 检查是否有未填写的项目
    const hasInvalidProjects = selectedProjects.some(id => {
      const project = projects.find(p => p.id === id)
      return project && project.status !== "draft" && project.status !== "pending_withdrawal"
    })
    
    if (hasInvalidProjects) {
      toast({
        title: "警告",
        description: "只有草稿和待撤回状态的项目才能提交",
        variant: "destructive"
      })
      return
    }
    
    try {
      setSubmitting(true)
      
      // 显示正在提交提示
      toast({
        title: "提交中",
        description: `正在提交 ${selectedProjects.length} 个项目，请稍候...`,
      })
      
      // 调用API批量提交
      const result = await batchSubmitActualPayments(
        selectedProjects,
        currentMonth.year,
        currentMonth.month,
        filters.isUserReport
      )
      
      if (result.success) {
        // 显示成功提示
        toast({
          title: "提交成功",
          description: `已成功提交 ${result.data.submittedRecords || 0} 个项目`,
        })
        
        // 刷新项目列表
        fetchProjects(true)
      } else {
        toast({
          title: "提交失败",
          description: result.error && typeof result.error === 'object' && 'message' in result.error 
            ? String(result.error.message) 
            : "批量提交失败",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("批量提交失败", error)
      toast({
        title: "提交失败",
        description: error instanceof Error ? error.message : "批量提交失败",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }, [selectedProjects, projects, currentMonth, fetchProjects, toast, filters.isUserReport])

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

  // 处理选中项目变化
  const handleSelectedRowsChange = useCallback((selectedRowIds: string[]) => {
    setSelectedProjects(selectedRowIds)
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">实际支付填报</h1>
        <Button 
          variant="outline" 
          onClick={() => fetchProjects(true)}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="animate-spin mr-2">⟳</span>
              加载中...
            </>
          ) : (
            <>
              <RotateCcw className="mr-2 h-4 w-4" />
              刷新
            </>
          )}
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={handleRoleChange} className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="user">填报人</TabsTrigger>
          <TabsTrigger value="finance">财务</TabsTrigger>
        </TabsList>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">机构</label>
              <Select
                value={filters.organization}
                onValueChange={(value) => handleFilterChange({...filters, organization: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择机构" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  {organizations.map((org) => (
                    <SelectItem key={org.value} value={org.value}>
                      {org.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">部门</label>
              <Select
                value={filters.department}
                onValueChange={(value) => handleFilterChange({...filters, department: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择部门" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  {departments.map((dep) => (
                    <SelectItem key={dep.value} value={dep.value}>
                      {dep.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">项目</label>
              <Input
                placeholder="输入项目名称或编码"
                value={filters.project}
                onChange={(e) => handleFilterChange({...filters, project: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">状态</label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange({...filters, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                const resetFilters = {
                  organization: "all",
                  department: "all",
                  project: "",
                  status: "all",
                  isUserReport: filters.isUserReport // 保持角色不变
                }
                setFilters(resetFilters)
                // 重置后立即刷新
                setTimeout(() => fetchProjects(true), 0)
              }}
              disabled={loading || debouncedFetch}
            >
              重置
            </Button>
            <Button 
              className="ml-2"
              onClick={() => fetchProjects(true)}
              disabled={loading || debouncedFetch}
            >
              {(loading || debouncedFetch) ? "加载中..." : "查询"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <DataTable
        columns={tableColumns}
        data={projects}
        loading={loading}
        onSelectedRowsChange={handleSelectedRowsChange}
      />
      
      <div className="flex justify-end gap-2 mt-4">
        <Button 
          variant="outline" 
          onClick={handleBatchEdit}
          disabled={
            selectedProjects.length === 0 || 
            loading ||
            selectedProjects.some(id => {
              const project = projects.find(p => p.id === id)
              return project && project.status !== "draft" && project.status !== "pending_withdrawal"
            })
          }
        >
          <FileEdit className="mr-2 h-4 w-4" />
          批量填报
        </Button>
        <Button 
          onClick={handleBatchSubmit}
          disabled={
            selectedProjects.length === 0 || 
            submitting || 
            loading ||
            selectedProjects.some(id => {
              const project = projects.find(p => p.id === id)
              return project && project.status !== "draft" && project.status !== "pending_withdrawal"
            })
          }
        >
          <Upload className="mr-2 h-4 w-4" />
          {submitting ? "提交中..." : "批量提交"}
        </Button>
      </div>
    </div>
  )
}

