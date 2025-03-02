import { Row } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Trash2, Edit, Copy, Building2 } from "lucide-react"
import { OrganizationWithRelations } from "./columns"
import { toast } from "sonner"

interface DataTableRowActionsProps {
  row: Row<OrganizationWithRelations>
  onEdit: (organization: OrganizationWithRelations) => void
  onDelete: (organization: OrganizationWithRelations) => void
  onManageDepartments?: (organization: OrganizationWithRelations) => void
}

export function DataTableRowActions({
  row,
  onEdit,
  onDelete,
  onManageDepartments,
}: DataTableRowActionsProps) {
  const organization = row.original

  const handleCopyId = () => {
    navigator.clipboard.writeText(organization.id)
    toast.success("机构ID已复制到剪贴板")
  }

  const handleDelete = () => {
    onDelete(organization)
  }

  const handleEdit = () => {
    onEdit(organization)
  }

  const handleManageDepartments = () => {
    if (onManageDepartments) {
      onManageDepartments(organization)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">打开菜单</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuLabel>机构操作</DropdownMenuLabel>
        <DropdownMenuItem onClick={handleCopyId}>
          <Copy className="mr-2 h-4 w-4" />
          复制机构ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          编辑机构信息
        </DropdownMenuItem>
        {onManageDepartments && (
          <DropdownMenuItem onClick={handleManageDepartments}>
            <Building2 className="mr-2 h-4 w-4" />
            管理部门
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={handleDelete}
          className="text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-950"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          删除机构
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 