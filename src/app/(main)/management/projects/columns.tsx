"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Edit, Eye, Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type Project = {
  id: string
  name: string
  organizations: string[]
  departments: string[]
  status: string
  startYear: number
  category?: {
    id: string
    name: string
    code?: string
  }
  subProjects: Array<{
    name: string
    fundingType: string
  }>
  createdAt: Date
}

// 扩展CellContext类型，添加onEdit属性
interface CellContextWithActions {
  row: {
    original: Project
  }
  onEdit?: (project: Project) => void
  onView?: (project: Project) => void
  onArchive?: (project: Project) => void
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
    accessorKey: "category",
    header: "项目分类",
    cell: ({ row }) => (
      <span className={row.original.category ? "px-2 py-1 rounded text-sm bg-purple-100 text-purple-800" : "text-gray-400"}>
        {row.original.category ? row.original.category.name : "未分类"}
      </span>
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
    cell: ({ row, onEdit, onView, onArchive }: CellContextWithActions) => {
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
            <DropdownMenuItem onClick={() => onEdit && onEdit(project)}>
              <Edit className="mr-2 h-4 w-4" />
              编辑项目
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onView && onView(project)}>
              <Eye className="mr-2 h-4 w-4" />
              查看详情
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onArchive && onArchive(project)}>
              <Archive className="mr-2 h-4 w-4" />
              归档项目
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

