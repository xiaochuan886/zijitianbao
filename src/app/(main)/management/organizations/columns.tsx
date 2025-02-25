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
  id: string
  name: string
  code: string
  departments: {
    id: string
    name: string
  }[]
  users: {
    id: string
    name: string
  }[]
  projects: {
    id: string
    name: string
  }[]
  createdAt: Date
  updatedAt: Date
}

interface DataTableProps {
  onEdit?: (organization: Organization) => void
  onDelete?: (organization: Organization) => Promise<void>
}

export const columns = ({ onEdit, onDelete }: DataTableProps): ColumnDef<Organization>[] => [
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
    cell: ({ row }) => row.original.departments.length,
  },
  {
    accessorKey: "users",
    header: "用户数量",
    cell: ({ row }) => row.original.users.length,
  },
  {
    accessorKey: "projects",
    header: "项目数量",
    cell: ({ row }) => row.original.projects.length,
  },
  {
    accessorKey: "createdAt",
    header: "创建时间",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(organization.id)}>
              复制机构ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit?.(organization)}>
              编辑机构信息
            </DropdownMenuItem>
            <DropdownMenuItem>
              管理部门
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete?.(organization)}>
              删除机构
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

