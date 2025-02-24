"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type Organization = {
  id: number
  name: string
  code: string
  departments: number
  projects: number
}

export const columns: ColumnDef<Organization>[] = [
  {
    accessorKey: "name",
    header: "机构名称",
  },
  {
    accessorKey: "code",
    header: "机构编码",
  },
  {
    accessorKey: "departments",
    header: "部门数量",
  },
  {
    accessorKey: "projects",
    header: "项目数量",
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
            <DropdownMenuLabel>操作</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(organization.id.toString())}>
              复制机构ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>编辑机构信息</DropdownMenuItem>
            <DropdownMenuItem>查看详情</DropdownMenuItem>
            <DropdownMenuItem>删除机构</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

