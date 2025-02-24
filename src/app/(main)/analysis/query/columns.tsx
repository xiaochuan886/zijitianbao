"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { QueryResult } from "./page"

export const columns: ColumnDef<QueryResult>[] = [
  {
    accessorKey: "project",
    header: "项目名称",
  },
  {
    accessorKey: "type",
    header: "类型",
  },
  {
    accessorKey: "month",
    header: "月份",
  },
  {
    accessorKey: "amount",
    header: "金额",
    cell: ({ row }) => {
      const amount = Number.parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "CNY",
      }).format(amount)
      return <div className="font-medium">{formatted}</div>
    },
  },
]

