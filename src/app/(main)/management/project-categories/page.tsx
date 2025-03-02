"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, Tag, FolderTree } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { DataTable } from "@/components/ui/data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { CategoryDialog } from "./components"

interface ProjectCategory {
  id: string
  name: string
  code?: string
  createdAt: Date
}

export default function ProjectCategoriesPage() {
  const [categories, setCategories] = useState<ProjectCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCategories: 0,
    totalProjects: 0
  })

  // 获取项目分类列表和统计数据
  const fetchCategories = async () => {
    try {
      setLoading(true)
      setStatsLoading(true)
      
      // 获取项目分类数据
      const response = await fetch('/api/project-categories')
      if (!response.ok) throw new Error('获取项目分类失败')
      const data = await response.json()
      
      // 处理响应数据
      const categoriesList = Array.isArray(data) ? 
        data : 
        (data.items || [])
      
      setCategories(categoriesList)
      
      // 获取与项目分类相关的统计数据
      const projectsResponse = await fetch('/api/projects')
      let totalProjects = 0
      
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        const projectsList = Array.isArray(projectsData) ? 
          projectsData : 
          (projectsData.items || [])
          
        totalProjects = projectsList.length
      }
      
      // 更新统计信息
      setStats({
        totalCategories: categoriesList.length,
        totalProjects
      })
    } catch (error) {
      console.error('获取项目分类列表失败:', error)
      toast.error(error instanceof Error ? error.message : "获取项目分类列表失败")
      setCategories([])
    } finally {
      setLoading(false)
      setStatsLoading(false)
    }
  }

  // 页面加载时获取数据
  useEffect(() => {
    fetchCategories()
  }, [])

  // 创建列定义
  const columns = [
    {
      accessorKey: "name",
      header: "分类名称",
    },
    {
      accessorKey: "code",
      header: "分类编码",
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }: { row: { original: ProjectCategory } }) => {
        const category = row.original
        
        return (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleEdit(category)}
            >
              编辑
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => handleDelete(category.id)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              删除
            </Button>
          </div>
        )
      },
    },
  ]

  // 编辑分类
  const handleEdit = (category: ProjectCategory) => {
    setSelectedCategory(category)
    setDialogOpen(true)
  }

  // 删除分类
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个项目分类吗？删除后相关项目将变为未分类状态。')) {
      return
    }

    try {
      const response = await fetch(`/api/project-categories/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '删除失败')
      }
      
      toast.success("项目分类已删除")
      fetchCategories()
    } catch (error: any) {
      console.error('删除项目分类失败:', error)
      toast.error(error.message || "删除失败")
    }
  }

  // 提交分类表单
  const handleSubmit = async (data: { name: string; code: string }) => {
    try {
      if (selectedCategory) {
        // 更新现有分类
        const response = await fetch(`/api/project-categories/${selectedCategory.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || '更新失败')
        }
        
        toast.success("项目分类已更新")
      } else {
        // 创建新分类
        const response = await fetch('/api/project-categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.message || '创建失败')
        }
        
        toast.success("新项目分类已创建")
      }
      
      setDialogOpen(false)
      setSelectedCategory(null)
      fetchCategories()
    } catch (error: any) {
      console.error('提交项目分类信息失败:', error)
      toast.error(error.message || (selectedCategory ? "更新失败" : "创建失败"))
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">项目分类管理</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          新增分类
        </Button>
      </div>
      
      {/* 统计卡片区域 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              分类总数
            </CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Spinner className="h-6 w-6" /> : stats.totalCategories}
            </div>
            <p className="text-xs text-muted-foreground">
              系统中所有项目分类的数量
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              项目总数
            </CardTitle>
            <FolderTree className="h-4 w-4 text-muted-foreground" />
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
      </div>

      {/* 数据表格 */}
      <Card>
        <CardHeader>
          <CardTitle>项目分类列表</CardTitle>
          <CardDescription>
            管理系统中的所有项目分类，用于对项目进行分组和管理
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={categories}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* 分类表单对话框 */}
      <CategoryDialog
        open={dialogOpen}
        onOpenChange={(open: boolean) => {
          setDialogOpen(open)
          if (!open) setSelectedCategory(null)
        }}
        category={selectedCategory}
        onSubmit={handleSubmit}
      />
    </div>
  )
} 