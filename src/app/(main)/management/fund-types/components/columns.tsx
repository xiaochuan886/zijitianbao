import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

// 资金需求类型数据接口
export interface FundType {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  _count?: {
    detailedFundNeeds: number
  }
}

// 创建表格列配置
export const createColumns = ({
  onEdit,
  onDelete,
}: {
  onEdit: (fundType: FundType) => void
  onDelete: (fundType: FundType) => void
}) => {
  const columns: ColumnDef<FundType>[] = [
    {
      accessorKey: "name",
      header: "类型名称",
    },
    {
      accessorKey: "_count.detailedFundNeeds",
      header: "关联资金需求数",
      cell: ({ row }) => {
        const count = row.original._count?.detailedFundNeeds || 0
        return (
          <Badge variant={count > 0 ? "default" : "outline"} className="font-normal">
            {count}
          </Badge>
        )
      },
    },
    {
      accessorKey: "createdAt",
      header: "创建日期",
      cell: ({ row }) => {
        return <div>{new Date(row.original.createdAt).toLocaleDateString()}</div>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const fundType = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">打开菜单</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>操作</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit(fundType)}>
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(fundType)}
                className="text-destructive focus:text-destructive"
              >
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return columns
} 