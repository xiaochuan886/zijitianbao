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

export type OrganizationWithRelations = Organization & {
  departments: { id: string; name: string }[]
  users: { id: string; name: string; role: Role }[]
  projects: { id: string; name: string; status: string }[]
}

interface ColumnsProps {
  onEdit: (organization: OrganizationWithRelations) => void
  onDelete: (organization: OrganizationWithRelations) => void
  onManageDepartments: (organization: OrganizationWithRelations) => void
}

export function createColumns({
  onEdit,
  onDelete,
  onManageDepartments,
}: ColumnsProps): ColumnDef<OrganizationWithRelations, any>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="机构名称" />
      ),
    },
    {
      accessorKey: "code",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="机构代码" />
      ),
    },
    {
      id: "departmentsCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="部门数量" />
      ),
      cell: ({ row }) => {
        const count = row.original.departments.length
        return (
          <div className="flex items-center justify-center gap-2">
            <span>{count}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onManageDepartments(row.original)}
            >
              <Building2 className="h-4 w-4" />
            </Button>
          </div>
        )
      },
    },
    {
      id: "projectsCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="项目数量" />
      ),
      cell: ({ row }) => {
        const count = row.original.projects.filter(p => p.status === 'active').length
        return <div className="text-center">{count}</div>
      },
    },
    {
      id: "reporters",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="填报人" />
      ),
      cell: ({ row }) => {
        const reporters = row.original.users
          .filter(u => u.role === 'REPORTER')
          .map(u => u.name)
          .join(', ')
        return <div className="max-w-[200px] truncate">{reporters || '-'}</div>
      },
    },
    {
      id: "finance",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="填报财务" />
      ),
      cell: ({ row }) => {
        const finance = row.original.users
          .filter(u => u.role === 'FINANCE')
          .map(u => u.name)
          .join(', ')
        return <div className="max-w-[200px] truncate">{finance || '-'}</div>
      },
    },
    {
      id: "auditor",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="审核财务" />
      ),
      cell: ({ row }) => {
        const auditor = row.original.users
          .filter(u => u.role === 'AUDITOR')
          .map(u => u.name)
          .join(', ')
        return <div className="max-w-[200px] truncate">{auditor || '-'}</div>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DataTableRowActions
          row={row}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ),
    },
  ]
} 