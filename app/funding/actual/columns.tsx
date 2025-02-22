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
import { ActualPaymentForm } from "./actual-payment-form"

export type ActualPayment = {
  id: number
  project: string
  amount: number
  date: string
  status: string
}

export const columns: ColumnDef<ActualPayment>[] = [
  {
    accessorKey: "project",
    header: "项目名称",
  },
  {
    accessorKey: "amount",
    header: "支付金额",
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
    accessorKey: "date",
    header: "支付日期",
  },
  {
    accessorKey: "status",
    header: "状态",
  },
  {
    id: "actions",
    cell: ({ row, onEdit }) => {
      const payment = row.original

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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(payment.id.toString())}>
              复制支付ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <ActualPaymentForm initialData={payment} onSubmit={(data) => onEdit({ ...data, id: payment.id })} />
            </DropdownMenuItem>
            <DropdownMenuItem>查看详情</DropdownMenuItem>
            <DropdownMenuItem>取消支付</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

