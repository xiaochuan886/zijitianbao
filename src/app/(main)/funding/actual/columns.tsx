"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { FileEdit, Upload, RotateCcw, MoreHorizontal, Eye, X, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

export type ActualPayment = {
  id: string
  organization?: {
    name: string;
  }
  department?: {
    name: string;
  }
  name: string
  year: number
  month: number
  status?: string
  actualUser?: number | null
  actualFinance?: number | null
  remark?: string
}

export const columns: ColumnDef<ActualPayment>[] = [
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
    cell: ({ row }) => {
      const orgObj = row.original.organization;
      return orgObj ? orgObj.name : '-';
    }
  },
  {
    accessorKey: "department",
    header: "部门",
    cell: ({ row }) => {
      const deptObj = row.original.department;
      return deptObj ? deptObj.name : '-';
    }
  },
  {
    accessorKey: "name",
    header: "项目",
  },
  {
    accessorKey: "period",
    header: "报表月份",
    cell: ({ row }) => {
      return `${row.original.year}年${row.original.month}月`
    }
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({ row }) => {
      const status = row.getValue("status") as string || "draft";
      
      let color = "";
      let text = "";
      
      switch (status) {
        case "draft":
          color = "bg-yellow-200";
          text = "草稿";
          break;
        case "submitted":
          color = "bg-green-200";
          text = "已提交";
          break;
        case "pending_withdrawal":
          color = "bg-blue-200";
          text = "撤回审核中";
          break;
        default:
          color = "bg-gray-200";
          text = status;
      }
      
      return (
        <Badge className={`${color} text-gray-900`}>{text}</Badge>
      );
    },
  },
  {
    id: "amount",
    header: "实际金额",
    cell: ({ row }) => {
      const payment = row.original;
      const amount = payment.actualUser !== null && payment.actualUser !== undefined
        ? payment.actualUser
        : payment.actualFinance !== null && payment.actualFinance !== undefined
          ? payment.actualFinance
          : null;
      
      if (amount === null) {
        return <span className="text-gray-400">-</span>;
      }
      
      const formatted = new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "CNY",
      }).format(amount);
      
      return <div className="font-medium">{formatted}</div>;
    }
  },
  {
    accessorKey: "remark",
    header: "备注",
    cell: ({ row }) => {
      const remark = row.getValue("remark") as string;
      
      if (!remark) {
        return <span className="text-gray-400">-</span>;
      }
      
      return (
        <TooltipProvider>
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <span 
                className="text-gray-500 cursor-help truncate max-w-[200px] inline-block hover:bg-accent hover:text-accent-foreground rounded px-1"
                title={remark}
              >
                {remark.length > 15 ? `${remark.substring(0, 15)}...` : remark}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" align="start" sideOffset={5} className="bg-popover text-popover-foreground p-3 shadow-lg border rounded-md z-50">
              <div className="max-w-xs">
                <p className="text-sm">{remark}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
  },
  {
    id: "actions",
    header: "操作",
    cell: ({ row }) => {
      const router = useRouter()
      const payment = row.original;
      const status = payment.status || "draft";
      
      const canEdit = ["draft", "pending_withdrawal"].includes(status);
      
      const handleEdit = () => {
        router.push(`/funding/actual/edit/${payment.id}?year=${payment.year}&month=${payment.month}`)
      };
      
      const handleView = () => {
        router.push(`/funding/actual/view/${payment.id}?year=${payment.year}&month=${payment.month}`)
      };
      
      return (
        <div className="flex items-center gap-2">
          {/* 查看详情按钮 - 除了草稿状态外都显示 */}
          {status !== "draft" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleView}
              className="h-8 w-8 p-0"
              title="查看详情"
            >
              <Eye className="h-4 w-4" />
              <span className="sr-only">查看</span>
            </Button>
          )}
          
          {/* 编辑按钮 - 只有草稿和待撤回状态可编辑 */}
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleEdit}
              className="h-8 w-8 p-0"
              title="编辑"
            >
              <FileEdit className="h-4 w-4" />
              <span className="sr-only">编辑</span>
            </Button>
          )}
          
          {/* 更多操作下拉菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">打开菜单</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>操作</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(payment.id)}>
                复制ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canEdit && (
                <DropdownMenuItem onClick={handleEdit}>
                  <FileEdit className="h-4 w-4 mr-2" />
                  编辑
                </DropdownMenuItem>
              )}
              {status !== "draft" && (
                <DropdownMenuItem onClick={handleView}>
                  <Eye className="h-4 w-4 mr-2" />
                  查看详情
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]

