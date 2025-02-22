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
import { ProjectForm } from "./project-form"

export type Project = {
  id: number
  name: string
  organization: string
  status: string
  budget: number
  startDate: string
}

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "name",
    header: "项目名称",
  },
  {
    accessorKey: "organization",
    header: "所属机构",
  },
  {
    accessorKey: "status",
    header: "状态",
  },
  {
    accessorKey: "budget",
    header: "预算",
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("budget"))
      const formatted = new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "CNY",
      }).format(amount)
      return <div className="font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "startDate",
    header: "开始日期",
  },
  {
    id: "actions",
    cell: ({ row, onEdit }) => {
      const project = row.original

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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(project.id.toString())}>
              复制项目ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <ProjectForm initialData={project} onSubmit={(data) => onEdit({ ...data, id: project.id })} />
            </DropdownMenuItem>
            <DropdownMenuItem>查看详情</DropdownMenuItem>
            <DropdownMenuItem>归档项目</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

