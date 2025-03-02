"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, Building2 } from "lucide-react"
import { createColumns, OrganizationWithRelations } from "./components/columns"
import { OrganizationDialog } from "./components/organization-dialog"
import { DepartmentDialog } from "./components/department-dialog"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { DataTable } from "@/components/ui/data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState<OrganizationWithRelations | null>(null)
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false)
  const [statsLoading, setStatsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalOrganizations: 0,
    totalDepartments: 0,
    totalProjects: 0
  })

  // 获取机构列表和统计数据
  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      setStatsLoading(true)
      
      // 通过API客户端获取数据，包含关联数据
      const orgs = await apiClient.organizations.list(true) as OrganizationWithRelations[]
      
      // 确保返回的数据格式正确
      if (Array.isArray(orgs)) {
        setOrganizations(orgs)
        
        // 计算基础统计数据
        const totalDepartments = orgs.reduce((sum, org) => 
          sum + (org.departments?.length || 0), 0
        )
        
        const totalProjects = orgs.reduce((sum, org) => 
          sum + (org.projects?.length || 0), 0
        )
        
        setStats({
          totalOrganizations: orgs.length,
          totalDepartments,
          totalProjects
        })
      } else {
        console.error('API返回的组织数据格式不正确:', orgs)
        toast.error("获取数据格式错误")
        setOrganizations([])
      }
    } catch (error) {
      console.error('获取机构列表失败:', error)
      toast.error(error instanceof Error ? error.message : "获取机构列表失败")
      setOrganizations([])
    } finally {
      setLoading(false)
      setStatsLoading(false)
    }
  }

  // 删除机构
  const handleDelete = async (organization: OrganizationWithRelations) => {
    if (!confirm(`确定要删除机构"${organization.name}"吗？此操作不可恢复，将同时删除该机构下的所有部门。`)) {
      return
    }

    try {
      await apiClient.organizations.delete(organization.id)
      toast.success("机构已删除")
      fetchOrganizations()
    } catch (error: any) {
      console.error('删除机构失败:', error)
      toast.error(error.message || "删除失败")
    }
  }

  // 编辑机构
  const handleEdit = (organization: OrganizationWithRelations) => {
    setSelectedOrganization(organization)
    setDialogOpen(true)
  }

  // 管理部门
  const handleManageDepartments = (organization: OrganizationWithRelations) => {
    setSelectedOrganization(organization)
    setDepartmentDialogOpen(true)
  }

  // 提交机构表单
  const handleSubmit = async (data: { name: string; code: string }) => {
    try {
      if (selectedOrganization) {
        await apiClient.organizations.update(selectedOrganization.id, data)
        toast.success("机构信息已更新")
      } else {
        await apiClient.organizations.create(data)
        toast.success("新机构已创建")
      }
      setDialogOpen(false)
      setSelectedOrganization(null)
      fetchOrganizations()
    } catch (error: any) {
      console.error('提交机构信息失败:', error)
      toast.error(error.message || (selectedOrganization ? "更新失败" : "创建失败"))
    }
  }

  // 保存部门更改
  const handleSaveDepartments = async (departments: {
    id?: string
    name: string
    isDeleted?: boolean
  }[]) => {
    if (!selectedOrganization) return

    try {
      await apiClient.organizations.departments.update(
        selectedOrganization.id,
        departments
      )
      toast.success("部门信息已更新")
      fetchOrganizations()
    } catch (error: any) {
      console.error('保存部门信息失败:', error)
      toast.error(error.message || "保存失败")
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const tableColumns = createColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onManageDepartments: handleManageDepartments,
  })

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">机构管理</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          新增机构
        </Button>
      </div>
      
      {/* 统计卡片区域 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              机构总数
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Spinner className="h-6 w-6" /> : stats.totalOrganizations}
            </div>
            <p className="text-xs text-muted-foreground">
              系统中所有机构的数量
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              部门总数
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Spinner className="h-6 w-6" /> : stats.totalDepartments}
            </div>
            <p className="text-xs text-muted-foreground">
              所有机构下的部门总数
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              项目总数
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
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Spinner className="h-6 w-6" /> : stats.totalProjects}
            </div>
            <p className="text-xs text-muted-foreground">
              所有机构下的项目总数
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 数据表格 */}
      <Card>
        <CardHeader>
          <CardTitle>机构列表</CardTitle>
          <CardDescription>
            管理系统中的所有机构及其关联的部门、用户和项目
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={tableColumns}
            data={organizations}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* 弹窗 */}
      <OrganizationDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setSelectedOrganization(null)
        }}
        organization={selectedOrganization}
        onSubmit={handleSubmit}
      />

      {selectedOrganization && (
        <DepartmentDialog
          open={departmentDialogOpen}
          onOpenChange={setDepartmentDialogOpen}
          organizationId={selectedOrganization.id}
          departments={selectedOrganization.departments}
          onSave={handleSaveDepartments}
        />
      )}
    </div>
  )
}

