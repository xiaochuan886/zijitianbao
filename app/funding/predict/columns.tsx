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

export type Prediction = {
  id: number
  project: string
  month: string
  amount: number
  status: string
}

export const columns: ColumnDef<Prediction>[] = [
  {
    accessorKey: "project",
    header: "项目名称",
  },
  {
    accessorKey: "month",
    header: "预测月份",
  },
  {
    accessorKey: "amount",
    header: "预测金额",
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "CNY",
      }).format(amount)
      return <div className="font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "status",
    header: "状态",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const prediction = row.original

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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(prediction.id.toString())}>
              复制预测ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>编辑预测</DropdownMenuItem>
            <DropdownMenuItem>提交审核</DropdownMenuItem>
            <DropdownMenuItem>删除预测</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

