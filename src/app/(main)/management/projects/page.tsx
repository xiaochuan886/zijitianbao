"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, FileText, Folder, Archive, Tag } from "lucide-react"
import { columns } from "./columns"
import { ProjectDialog } from "./components"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { DataTable } from "@/components/ui/data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

export type Project = {
  id: string
  name: string
  code: string
  status: "ACTIVE" | "ARCHIVED"
  startYear: number
  category?: {
    id: string
    name: string
    code?: string
  }
  subProjects: Array<{
    id: string
    name: string
    detailedFundNeeds: Array<{
      id: string
      department: {
        id: string
        name: string
      }
      fundType: {
        id: string
        name: string
      }
      organizationId: string
      organization?: {
        id: string
        name: string
        code?: string
      }
    }>
  }>
  createdAt: Date
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    archivedProjects: 0,
    totalSubProjects: 0
  })

  // 获取项目列表和统计数据
  const fetchProjects = async () => {
    try {
      setLoading(true)
      setStatsLoading(true)
      
      // 直接使用fetch代替apiClient
      const response = await fetch('/api/projects')
      if (!response.ok) {
        throw new Error(`获取数据失败: ${response.status}`)
      }
      
      const responseData = await response.json()
      
      // 处理返回数据结构
      let data = Array.isArray(responseData) ? responseData : (responseData.items || [])
      
      // 确保返回的数据格式正确
      if (Array.isArray(data)) {
        setProjects(data)
        
        // 计算基础统计数据
        const activeProjects = data.filter(p => p.status === "ACTIVE").length
        const archivedProjects = data.filter(p => p.status === "ARCHIVED").length
        const totalSubProjects = data.reduce((sum, p) => 
          sum + (p.subProjects?.length || 0), 0
        )
        
        setStats({
          totalProjects: data.length,
          activeProjects,
          archivedProjects,
          totalSubProjects
        })
      } else {
        console.error('API返回的项目数据格式不正确:', data)
        toast.error("获取数据格式错误")
        setProjects([])
      }
    } catch (error) {
      console.error('获取项目列表失败:', error)
      toast.error(error instanceof Error ? error.message : "获取项目列表失败")
      setProjects([])
    } finally {
      setLoading(false)
      setStatsLoading(false)
    }
  }

  // 归档项目
  const handleArchive = async (project: Project) => {
    if (!confirm(`确定要${project.status === "ACTIVE" ? "归档" : "激活"}项目"${project.name}"吗？`)) {
      return
    }

    try {
      // TODO: 实现实际的API调用
      // await apiClient.projects.archive(project.id)
      
      // 临时模拟API调用
      const response = await fetch(`/api/projects/${project.id}/archive`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('操作失败')
      }
      
      toast.success(project.status === "ACTIVE" ? "项目已归档" : "项目已激活")
      fetchProjects()
    } catch (error: any) {
      console.error('操作失败:', error)
      toast.error(error.message || "操作失败")
    }
  }

  // 编辑项目
  const handleEdit = (project: Project) => {
    setSelectedProject(project)
    setDialogOpen(true)
  }

  // 查看项目详情
  const handleView = (project: Project) => {
    // TODO: 实现项目详情查看
    toast.info(`查看项目 ${project.name} 的详情`)
  }

  // 提交项目表单
  const handleSubmit = async (data: any) => {
    try {
      if (selectedProject) {
        // TODO: 实现实际的API调用
        // await apiClient.projects.update(selectedProject.id, data)
        
        // 临时模拟API调用
        const response = await fetch(`/api/projects/${selectedProject.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })
        
        if (!response.ok) {
          throw new Error('更新失败')
        }
        
        toast.success("项目信息已更新")
      } else {
        // TODO: 实现实际的API调用
        // await apiClient.projects.create(data)
        
        // 临时模拟API调用
        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })
        
        if (!response.ok) {
          throw new Error('创建失败')
        }
        
        toast.success("新项目已创建")
      }
      
      setDialogOpen(false)
      setSelectedProject(null)
      fetchProjects()
    } catch (error: any) {
      console.error('提交项目信息失败:', error)
      toast.error(error.message || (selectedProject ? "更新失败" : "创建失败"))
    }
  }

  // 页面加载时获取数据
  useEffect(() => {
    fetchProjects()
  }, [])

  // 表格列配置
  const tableColumns = columns({
    onEdit: handleEdit,
    onView: handleView,
    onArchive: handleArchive,
  })

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">项目管理</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.href = "/management/project-categories"}>
            <Tag className="mr-2 h-4 w-4" />
            项目分类管理
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            新增项目
          </Button>
        </div>
      </div>
      
      {/* 统计卡片区域 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="backdrop-blur-sm bg-card dark:bg-card/90">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              项目总数
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Spinner className="h-6 w-6" /> : stats.totalProjects}
            </div>
            <p className="text-xs text-muted-foreground">
              系统中所有项目的数量
            </p>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-sm bg-card dark:bg-card/90">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              活跃项目
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Spinner className="h-6 w-6" /> : stats.activeProjects}
            </div>
            <p className="text-xs text-muted-foreground">
              当前活跃状态的项目数量
            </p>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-sm bg-card dark:bg-card/90">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              归档项目
            </CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Spinner className="h-6 w-6" /> : stats.archivedProjects}
            </div>
            <p className="text-xs text-muted-foreground">
              已归档的项目数量
            </p>
          </CardContent>
        </Card>
        <Card className="backdrop-blur-sm bg-card dark:bg-card/90">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              子项目总数
            </CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Spinner className="h-6 w-6" /> : stats.totalSubProjects}
            </div>
            <p className="text-xs text-muted-foreground">
              所有项目下的子项目总数
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 数据表格 */}
      <Card className="backdrop-blur-sm bg-card dark:bg-card/90">
        <CardHeader>
          <CardTitle>项目列表</CardTitle>
          <CardDescription>
            管理系统中的所有项目及其子项目和资金需求信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={tableColumns}
            data={projects}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* 项目表单对话框 */}
      {dialogOpen && (
        <ProjectDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) setSelectedProject(null)
          }}
          project={selectedProject}
          onSubmit={handleSubmit}
          onSuccess={fetchProjects}
        />
      )}
    </div>
  )
}