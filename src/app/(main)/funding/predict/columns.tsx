"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { FileEdit, Upload, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export type Prediction = {
  id: string
  organization: string
  department: string
  project: string
  month: string
  status: string
  subProjectCount?: number
  remarks?: { subProject: string, content: string, period: string }[]
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
    cell: ({ row }) => {
      const prediction = row.original;
      const remarks = prediction.remarks || [];
      const subProjectCount = prediction.subProjectCount || 0;
      
      // 如果没有子项目信息或备注，显示普通文本
      if (!remarks.length && prediction.remark) {
        return <span className="text-gray-500">{prediction.remark}</span>;
      }
      
      if (!remarks.length && !prediction.remark) {
        return <span className="text-gray-400">-</span>;
      }
      
      return (
        <div className="flex flex-col gap-2">
          {subProjectCount > 0 && (
            <span className="text-xs text-gray-500">共 {subProjectCount} 个子项目</span>
          )}
          <div className="flex flex-wrap gap-1">
            {remarks.map((item, index) => (
              <TooltipProvider key={index}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="outline" className="cursor-help">
                      {`${item.subProject.substring(0, 6)}${item.subProject.length > 6 ? '...' : ''} - ${item.content.substring(0, 8)}${item.content.length > 8 ? '...' : ''} - ${item.period}`}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-xs">
                      <p className="font-semibold">{item.subProject} ({item.period})</p>
                      <p className="text-sm mt-1">{item.content}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            {prediction.remark && !remarks.length && (
              <Badge variant="outline">{prediction.remark}</Badge>
            )}
          </div>
        </div>
      );
    },
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

