"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { FileEdit, Upload, RotateCcw } from "lucide-react"
import { columns, Prediction } from "./columns"
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
import { useToast } from "@/components/ui/use-toast"

export default function PredictPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Prediction[]>([])
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [filters, setFilters] = useState({
    organization: "all",
    department: "all",
    project: "",
    status: "all"
  })
  const [organizations, setOrganizations] = useState<{value: string, label: string}[]>([])
  const [departments, setDepartments] = useState<{value: string, label: string}[]>([])
  const [statuses] = useState([
    { value: "未填写", label: "未填写" },
    { value: "草稿", label: "草稿" },
    { value: "已提交", label: "已提交" }
  ])
  const [currentMonth, setCurrentMonth] = useState<{year: number, month: number}>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 2 // 下个月
  })
  const [submitting, setSubmitting] = useState(false)

  // 获取当前月份的下一个月
  const getNextMonth = useCallback(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 2 // +1 是下个月，+1 是因为 getMonth() 从 0 开始
    return { year, month }
  }, [])

  // 获取项目列表
  const fetchProjects = useCallback(async () => {
    try {
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
      
      // 调用API获取项目列表
      const response = await fetch(`/api/funding/predict?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error("获取项目列表失败")
      }
      
      const data = await response.json()
      
      // 首次加载时，获取所有机构和部门（不受筛选影响）
      if (!organizations.length || !departments.length) {
        try {
          const metaResponse = await fetch(`/api/funding/predict/meta`)
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
          console.error("获取机构和部门列表失败", error)
        }
      }
      
      setProjects(data)
      setLoading(false)
    } catch (error) {
      console.error("获取项目列表失败", error)
      toast({
        title: "错误",
        description: "获取项目列表失败",
        variant: "destructive"
      })
      setLoading(false)
    }
  }, [filters, getNextMonth, toast, organizations.length, departments.length])

  // 处理批量填报
  const handleBatchEdit = useCallback(() => {
    if (selectedProjects.length === 0) {
      toast({
        title: "提示",
        description: "请先选择项目",
      })
      return
    }
    
    // 将选中的项目ID作为查询参数传递
    const ids = selectedProjects.join(",")
    router.push(`/funding/predict/edit?ids=${ids}&year=${currentMonth.year}&month=${currentMonth.month}`)
  }, [selectedProjects, router, toast, currentMonth])

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
    const hasUnfilledProjects = selectedProjects.some(id => {
      const project = projects.find(p => p.id === id)
      return project && project.status === "未填写"
    })
    
    if (hasUnfilledProjects) {
      toast({
        title: "警告",
        description: "选中的项目中包含未填写的项目，请先填报后再提交",
        variant: "destructive"
      })
      return
    }
    
    try {
      setSubmitting(true)
      
      // 显示正在提交提示
      toast({
        title: "提示",
        description: "正在提交项目，请稍候...",
      })
      
      // 调用API批量提交
      const response = await fetch("/api/funding/predict/batch-submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectIds: selectedProjects,
          year: currentMonth.year,
          month: currentMonth.month,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "批量提交失败")
      }
      
      const result = await response.json()
      
      toast({
        title: "成功",
        description: `已提交 ${result.count} 个项目`,
      })
      
      // 刷新项目列表
      fetchProjects()
    } catch (error) {
      console.error("批量提交失败", error)
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "批量提交失败",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }, [selectedProjects, projects, currentMonth, fetchProjects, toast])

  // 初始化
  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  // 处理选中项目变化
  const handleSelectedRowsChange = useCallback((selectedRowIds: string[]) => {
    console.log('选中的项目IDs:', selectedRowIds); // 添加日志，帮助调试
    setSelectedProjects(prev => {
      // 使用深度比较，避免不必要的状态更新
      if (JSON.stringify(prev) === JSON.stringify(selectedRowIds)) {
        return prev;
      }
      return selectedRowIds;
    });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">资金需求预测填报</h1>
        <Button 
          variant="outline" 
          onClick={fetchProjects}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>
      
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
                onValueChange={(value) => setFilters({...filters, organization: value})}
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
                onValueChange={(value) => setFilters({...filters, department: value})}
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
                onChange={(e) => setFilters({...filters, project: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">状态</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({...filters, status: value})}
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
                setFilters({
                  organization: "all",
                  department: "all",
                  project: "",
                  status: "all"
                })
              }}
            >
              重置
            </Button>
            <Button 
              className="ml-2"
              onClick={fetchProjects}
            >
              查询
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <DataTable
        columns={columns as any}
        data={projects}
        loading={loading}
        onSelectedRowsChange={handleSelectedRowsChange}
      />
      
      <div className="flex justify-end gap-2 mt-4">
        <Button 
          variant="outline" 
          onClick={handleBatchEdit}
          disabled={selectedProjects.length === 0}
        >
          <FileEdit className="mr-2 h-4 w-4" />
          批量填报
        </Button>
        <Button 
          onClick={handleBatchSubmit}
          disabled={selectedProjects.length === 0 || submitting}
        >
          <Upload className="mr-2 h-4 w-4" />
          {submitting ? "提交中..." : "批量提交"}
        </Button>
      </div>
    </div>
  )
}

