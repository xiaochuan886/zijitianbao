import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Building2, Trash2, Edit } from "lucide-react"

export interface Organization {
  id: string
  name: string
  code: string
  departments: { id: string; name: string }[]
  createdAt: string
  updatedAt: string
}

interface ColumnsProps {
  onEdit: (organization: Organization) => void
  onDelete: (organization: Organization) => void
  onManageDepartments: (organization: Organization) => void
}

export function createColumns({
  onEdit,
  onDelete,
  onManageDepartments,
}: ColumnsProps): ColumnDef<Organization, any>[] {
  return [
    {
      accessorKey: "name",
      header: "机构名称",
    },
    {
      accessorKey: "code",
      header: "机构代码",
    },
    {
      accessorKey: "departments",
      header: "部门数量",
      cell: ({ row }) => row.original.departments.length,
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const organization = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">打开菜单</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(organization)}>
                <Edit className="mr-2 h-4 w-4" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onManageDepartments(organization)}>
                <Building2 className="mr-2 h-4 w-4" />
                管理部门
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete(organization)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
} 