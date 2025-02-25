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
  id: string
  name: string
  organizations: string[]
  departments: string[]
  status: string
  startYear: number
  subProjects: Array<{
    name: string
    fundingType: string
  }>
  createdAt: Date
}

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "name",
    header: "项目名称",
  },
  {
    accessorKey: "organizations",
    header: "关联机构",
    cell: ({ row }) => (
      <div className="space-x-1">
        {row.original.organizations.map((org, index) => (
          <span key={index} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
            {org}
          </span>
        ))}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({ row }) => (
      <span className={`px-2 py-1 rounded text-sm ${
        row.original.status === "规划中" ? "bg-blue-100 text-blue-800" :
        row.original.status === "进行中" ? "bg-green-100 text-green-800" :
        row.original.status === "已完成" ? "bg-gray-100 text-gray-800" :
        "bg-yellow-100 text-yellow-800"
      }`}>
        {row.original.status}
      </span>
    ),
  },
  {
    accessorKey: "startYear",
    header: "开始年份",
  },
  {
    accessorKey: "subProjects",
    header: "子项目数量",
    cell: ({ row }) => row.original.subProjects.length,
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

