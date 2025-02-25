"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { PlusCircle } from "lucide-react"
import { createColumns, Organization } from "./components/columns"
import { OrganizationDialog } from "./components/organization-dialog"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { DepartmentDialog } from "./components/department-dialog"

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null)
  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false)

  // 获取机构列表
  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      const response = await apiClient.organizations.list()
      console.log('Organizations response:', response) // 添加日志
      setOrganizations(Array.isArray(response) ? response : response.items || [])
    } catch (error) {
      console.error('Fetch organizations error:', error) // 添加错误日志
      toast.error("获取机构列表失败")
    } finally {
      setLoading(false)
    }
  }

  // 删除机构
  const handleDelete = async (organization: Organization) => {
    if (!confirm("确定要删除该机构吗？此操作不可恢复。")) {
      return
    }

    try {
      await apiClient.organizations.delete(organization.id)
      toast.success("机构已删除")
      fetchOrganizations()
    } catch (error: any) {
      toast.error(error.message || "删除失败")
    }
  }

  // 编辑机构
  const handleEdit = (organization: Organization) => {
    setSelectedOrganization(organization)
    setDialogOpen(true)
  }

  // 管理部门
  const handleManageDepartments = (organization: Organization) => {
    setSelectedOrganization(organization)
    setDepartmentDialogOpen(true)
  }

  // 提交机构表单
  const handleSubmit = async (data: { name: string; code: string }) => {
    try {
      if (selectedOrganization) {
        await apiClient.organizations.update(selectedOrganization.id, data)
        toast.success("更新成功")
      } else {
        await apiClient.organizations.create(data)
        toast.success("创建成功")
      }
      setDialogOpen(false)
      setSelectedOrganization(null)
      fetchOrganizations()
    } catch (error: any) {
      console.error('Submit organization error:', error) // 添加错误日志
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
      toast.success("保存成功")
      fetchOrganizations()
    } catch (error: any) {
      console.error('Save departments error:', error) // 添加错误日志
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">机构管理</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          新增机构
        </Button>
      </div>

      <DataTable
        columns={tableColumns}
        data={organizations}
        loading={loading}
      />

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

