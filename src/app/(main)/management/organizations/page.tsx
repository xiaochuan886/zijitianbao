"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { PlusCircle } from "lucide-react"
import { columns, Organization } from "./columns"
import { OrganizationDialog } from "./components/organization-dialog"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState<Organization>()

  // 获取机构列表
  async function fetchOrganizations() {
    try {
      const result = await apiClient.organizations.list()
      setOrganizations(result.data.items || [])
    } catch (error) {
      toast.error("获取机构列表失败")
    } finally {
      setLoading(false)
    }
  }

  // 创建或更新机构
  async function handleSubmit(data: { name: string; code: string }) {
    try {
      if (selectedOrganization) {
        await apiClient.organizations.update(selectedOrganization.id, data)
      } else {
        await apiClient.organizations.create(data)
      }
      await fetchOrganizations()
      setDialogOpen(false)
      setSelectedOrganization(undefined)
    } catch (error: any) {
      toast.error(error.message || "操作失败")
    }
  }

  // 删除机构
  async function handleDelete(organization: Organization) {
    if (!confirm("确定要删除该机构吗？此操作不可恢复。")) {
      return
    }

    try {
      await apiClient.organizations.delete(organization.id)
      await fetchOrganizations()
      toast.success("机构已删除")
    } catch (error: any) {
      toast.error(error.message || "删除失败")
    }
  }

  // 编辑机构
  function handleEdit(organization: Organization) {
    setSelectedOrganization(organization)
    setDialogOpen(true)
  }

  useEffect(() => {
    fetchOrganizations()
  }, [])

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
        columns={columns}
        data={organizations}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <OrganizationDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setSelectedOrganization(undefined)
        }}
        organization={selectedOrganization}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

