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

  // 获取当前月份的下一个月
  const getNextMonth = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 2 // +1 是下个月，+1 是因为 getMonth() 从 0 开始
    return `${year}-${month.toString().padStart(2, '0')}`
  }

  // 获取项目列表
  const fetchProjects = async () => {
    try {
      setLoading(true)
      // 这里应该调用 API 获取项目列表
      // 模拟数据
      const data: Prediction[] = [
        { 
          id: "1", 
          organization: "机构A (A001)", 
          department: "部门1", 
          project: "智慧城市项目 (SC001)", 
          month: getNextMonth(), 
          status: "未填写",
          remark: ""
        },
        { 
          id: "2", 
          organization: "机构A (A001)", 
          department: "部门2", 
          project: "5G网络建设 (5G001)", 
          month: getNextMonth(), 
          status: "草稿",
          remark: "上月预测金额较大，本月可能会减少"
        },
        { 
          id: "3", 
          organization: "机构B (B001)", 
          department: "部门1", 
          project: "数据中心扩建 (DC001)", 
          month: getNextMonth(), 
          status: "已提交",
          remark: "按计划执行"
        },
        { 
          id: "4", 
          organization: "机构B (B001)", 
          department: "部门3", 
          project: "AI研发项目 (AI001)", 
          month: getNextMonth(), 
          status: "未填写",
          remark: ""
        },
      ]
      
      // 提取组织和部门列表
      const orgs = Array.from(new Set(data.map(item => item.organization)))
      const deps = Array.from(new Set(data.map(item => item.department)))
      
      setProjects(data)
      setOrganizations(orgs.map(org => ({ value: org, label: org })))
      setDepartments(deps.map(dep => ({ value: dep, label: dep })))
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
  }

  // 筛选项目
  const filteredProjects = projects.filter(project => {
    return (
      (filters.organization === "all" || project.organization === filters.organization) &&
      (filters.department === "all" || project.department === filters.department) &&
      (filters.project === "" || project.project.includes(filters.project)) &&
      (filters.status === "all" || project.status === filters.status)
    )
  })

  // 处理批量填报
  const handleBatchEdit = () => {
    if (selectedProjects.length === 0) {
      toast({
        title: "提示",
        description: "请先选择项目",
      })
      return
    }
    
    // 将选中的项目ID作为查询参数传递
    const ids = selectedProjects.join(",")
    router.push(`/funding/predict/edit?ids=${ids}`)
  }

  // 处理批量提交
  const handleBatchSubmit = () => {
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
    
    // 这里应该调用 API 批量提交
    toast({
      title: "成功",
      description: `已提交 ${selectedProjects.length} 个项目`,
    })
  }

  // 初始化
  useEffect(() => {
    fetchProjects()
  }, [])

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
        </CardContent>
      </Card>
      
      <DataTable
        columns={columns as any}
        data={filteredProjects}
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
          disabled={selectedProjects.length === 0}
        >
          <Upload className="mr-2 h-4 w-4" />
          批量提交
        </Button>
      </div>
    </div>
  )
}

