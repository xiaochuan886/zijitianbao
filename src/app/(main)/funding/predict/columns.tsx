"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { FileEdit, Upload, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

export type Prediction = {
  id: string
  organization: string
  department: string
  project: string
  month: string
  status: string
  remark?: string
}

export const columns: ColumnDef<Prediction>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "organization",
    header: "机构",
  },
  {
    accessorKey: "department",
    header: "部门",
  },
  {
    accessorKey: "project",
    header: "项目",
  },
  {
    accessorKey: "month",
    header: "预测月份",
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      
      let variant: "default" | "outline" | "secondary" | "destructive" = "default"
      
      switch (status) {
        case "未填写":
          variant = "outline"
          break
        case "草稿":
          variant = "secondary"
          break
        case "已提交":
          variant = "default"
          break
        default:
          variant = "default"
      }
      
      return <Badge variant={variant}>{status}</Badge>
    },
  },
  {
    accessorKey: "remark",
    header: "备注",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const router = useRouter()
      const prediction = row.original

      return (
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push(`/funding/predict/edit?id=${prediction.id}`)}
          >
            <FileEdit className="h-4 w-4" />
            <span className="sr-only md:not-sr-only md:ml-2">填报</span>
          </Button>
          
          {prediction.status !== "已提交" && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // 这里应该调用 API 提交
                console.log("提交", prediction.id)
              }}
            >
              <Upload className="h-4 w-4" />
              <span className="sr-only md:not-sr-only md:ml-2">提交</span>
            </Button>
          )}
          
          {prediction.status === "已提交" && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // 这里应该调用 API 申请撤回
                console.log("申请撤回", prediction.id)
              }}
            >
              <RotateCcw className="h-4 w-4" />
              <span className="sr-only md:not-sr-only md:ml-2">申请撤回</span>
            </Button>
          )}
        </div>
      )
    },
  },
]

