import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Building2, Trash2, Edit } from "lucide-react"
import { Organization } from "@prisma/client"
import { Role } from "@/lib/enums"
import { DataTableColumnHeader } from "./data-table-column-header"
import { DataTableRowActions } from "./data-table-row-actions"
import { Badge } from "@/components/ui/badge"
import { UsersIcon } from "lucide-react"

// 组织类型定义(包含关联数据)
export interface OrganizationWithRelations {
  id: string
  name: string
  code: string
  departments: { id: string; name: string }[]
  users: { id: string; name: string; email?: string; role: string }[]
  projects: { id: string; name: string; status: string }[]
  createdAt: Date
  updatedAt: Date
}

interface ColumnOptions {
  onEdit: (organization: OrganizationWithRelations) => void
  onDelete: (organization: OrganizationWithRelations) => void
  onManageDepartments: (organization: OrganizationWithRelations) => void
}

// 创建表格列配置
export function createColumns({
  onEdit,
  onDelete,
  onManageDepartments,
}: ColumnOptions): ColumnDef<OrganizationWithRelations>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="机构名称" />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex flex-col">
            <div className="font-medium">{row.getValue("name")}</div>
            <div className="text-xs text-muted-foreground">{row.original.code}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "departments",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="部门数量" />
      ),
      cell: ({ row }) => {
        const departments = row.original.departments || []
        return (
          <div className="flex items-center">
            <Badge variant="outline" className="rounded-sm">
              {departments.length}
            </Badge>
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: "users",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="用户数量" />
      ),
      cell: ({ row }) => {
        const users = row.original.users || []
        return (
          <div className="flex items-center">
            <Badge variant="outline" className="rounded-sm">
              {users.length}
            </Badge>
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: "projects",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="项目数量" />
      ),
      cell: ({ row }) => {
        const projects = row.original.projects || []
        return (
          <div className="flex items-center">
            <Badge variant="outline" className="rounded-sm">
              {projects.length}
            </Badge>
          </div>
        )
      },
      enableSorting: false,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="创建时间" />
      ),
      cell: ({ row }) => {
        const date = row.original.createdAt instanceof Date
          ? row.original.createdAt
          : new Date(row.original.createdAt)
        
        return <div>{date.toLocaleDateString()}</div>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DataTableRowActions 
          row={row}
          onEdit={onEdit}
          onDelete={onDelete}
          onManageDepartments={onManageDepartments}
        />
      ),
    },
  ]
} 