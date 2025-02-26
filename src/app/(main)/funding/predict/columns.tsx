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
import { submitWithdrawalRequest, cancelWithdrawalRequest } from "./client-api"

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
  year: string
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
      const status = row.getValue("status") as string;
      
      let color = "";
      let text = "";
      
      switch (status) {
        case "未填写":
          color = "bg-gray-200";
          text = "未填写";
          break;
        case "草稿":
          color = "bg-yellow-200";
          text = "草稿";
          break;
        case "已提交":
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
    accessorKey: "remark",
    header: "备注",
    cell: ({ row }) => {
      const prediction = row.original;
      const remarks = prediction.remarks || [];
      const subProjectCount = prediction.subProjectCount || 0;
      
      // 如果没有任何备注信息，显示占位符
      if (!remarks.length && !prediction.remark) {
        return <span className="text-gray-400">-</span>;
      }
      
      // 如果只有主备注，没有子项目备注，显示主备注
      if (!remarks.length && prediction.remark) {
        return (
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <span 
                  className="text-gray-500 cursor-help truncate max-w-[200px] inline-block hover:bg-accent hover:text-accent-foreground rounded px-1"
                  title={prediction.remark}
                >
                  {prediction.remark.length > 15 ? `${prediction.remark.substring(0, 15)}...` : prediction.remark}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" align="start" sideOffset={5} className="bg-popover text-popover-foreground p-3 shadow-lg border rounded-md z-50">
                <div className="max-w-xs">
                  <p className="text-sm">{prediction.remark}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
      
      // 如果有子项目备注，只显示子项目备注，不显示主备注
      return (
        <div className="flex flex-col gap-2">
          {subProjectCount > 0 && (
            <span className="text-xs text-gray-500">共 {subProjectCount} 个子项目</span>
          )}
          <div className="flex flex-wrap gap-1">
            {remarks.map((item, index) => (
              <TooltipProvider key={index}>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Badge 
                      variant="outline" 
                      className="cursor-help hover:bg-accent hover:text-accent-foreground"
                      title={`${item.subProject} (${item.period}): ${item.content}`}
                    >
                      {`${item.subProject.substring(0, 6)}${item.subProject.length > 6 ? '...' : ''} - ${item.content.substring(0, 8)}${item.content.length > 8 ? '...' : ''} - ${item.period}`}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top" align="start" sideOffset={5} className="bg-popover text-popover-foreground p-3 shadow-lg border rounded-md z-50">
                    <div className="max-w-xs">
                      <p className="font-semibold">{item.subProject} ({item.period})</p>
                      <p className="text-sm mt-1">{item.content}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "操作",
    cell: ({ row }) => {
      const router = useRouter()
      const { toast } = useToast()
      const prediction = row.original
      const [open, setOpen] = useState(false)
      const [cancelWithdrawalOpen, setCancelWithdrawalOpen] = useState(false)
      
      // 提交项目的函数
      const handleSubmit = async () => {
        try {
          // 调用API提交预测
          const response = await fetch(`/api/funding/predict/submit-single/${prediction.id}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              year: prediction.year,
              month: prediction.month,
            }),
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "提交失败");
          }
          
          // 显示成功提示
          toast({
            title: "提交成功",
            description: "项目已成功提交",
          });
          
          // 刷新页面
          router.refresh();
        } catch (error) {
          console.error("提交失败", error);
          toast({
            title: "提交失败",
            description: error instanceof Error ? error.message : "提交失败",
            variant: "destructive"
          });
        }
      };
      
      return (
        <div className="flex items-center gap-2">
          {/* 查看详情按钮 - 除了未填写和草稿状态外都显示 */}
          {prediction.status !== "未填写" && prediction.status !== "草稿" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const year = new Date().getFullYear()
                const month = new Date().getMonth() + 2
                window.location.href = `/funding/predict/view?id=${prediction.id}&year=${year}&month=${month}`
              }}
              className="h-8 px-2 py-0"
            >
              <Eye className="h-4 w-4" />
              <span className="ml-1">查看</span>
            </Button>
          )}
          
          {/* 填报按钮 - 只对未填写和草稿状态可用 */}
          {(prediction.status === "未填写" || prediction.status === "草稿") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const year = new Date().getFullYear()
                const month = new Date().getMonth() + 2
                window.location.href = `/funding/predict/edit?id=${prediction.id}&year=${year}&month=${month}`
              }}
              className="h-8 px-2 py-0"
            >
              <FileEdit className="h-4 w-4" />
              <span className="ml-1">填报</span>
            </Button>
          )}
          
          {/* 提交按钮 - 对草稿状态可用 */}
          {prediction.status === "草稿" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSubmit}
              className="h-8 px-2 py-0"
            >
              <Upload className="h-4 w-4" />
              <span className="ml-1">提交</span>
            </Button>
          )}
          
          {/* 撤回申请按钮 - 只对已提交状态可用 */}
          {prediction.status === "已提交" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(true)}
              className="h-8 px-2 py-0"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="ml-1">撤回</span>
            </Button>
          )}
          
          {/* 取消撤回申请按钮 - 只对撤回审核中状态可用 */}
          {prediction.status === "pending_withdrawal" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCancelWithdrawalOpen(true)}
              className="h-8 px-2 py-0"
            >
              <XCircle className="h-4 w-4" />
              <span className="ml-1">取消撤回</span>
            </Button>
          )}
          
          <WithdrawalRequestDialog
            open={open}
            setOpen={setOpen}
            projectId={prediction.id}
            projectName={prediction.project}
            onComplete={() => {
              // 刷新数据
              router.refresh()
              // 提示用户刷新页面
              toast({
                title: "撤回申请已提交",
                description: "状态已更新为「撤回申请待审批」"
              })
            }}
          />
          
          <CancelWithdrawalDialog
            open={cancelWithdrawalOpen}
            setOpen={setCancelWithdrawalOpen}
            projectId={prediction.id}
            projectName={prediction.project}
            onComplete={() => {
              // 刷新数据
              router.refresh()
              // 提示用户刷新页面
              toast({
                title: "已取消撤回申请",
                description: "状态已更新为「已提交」"
              })
            }}
          />
        </div>
      )
    },
  },
]

// 添加撤回申请按钮组件
function WithdrawalRequestDialog({ 
  open, 
  setOpen, 
  projectId, 
  projectName, 
  onComplete 
}: { 
  open: boolean;
  setOpen: (open: boolean) => void;
  projectId: string;
  projectName: string;
  onComplete?: () => void;
}) {
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  
  const handleSubmit = async () => {
    if (reason.trim().length < 5) {
      toast({
        title: "错误",
        description: "撤回原因至少需要5个字符",
        variant: "destructive"
      })
      return
    }
    
    try {
      setSubmitting(true)
      
      // 使用客户端API函数提交撤回申请
      const result = await submitWithdrawalRequest(projectId, reason);
      
      // 无论成功或失败，都关闭对话框
      setOpen(false);
      
      // 如果成功，通知父组件刷新
      if (result.success && onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("提交撤回申请失败", error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "提交撤回申请失败",
        variant: "destructive"
      });
      // 即使出错也关闭对话框
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>提交撤回申请</DialogTitle>
          <DialogDescription>
            项目: {projectName}
            <br />
            请填写撤回原因，管理员审核通过后将允许重新编辑。
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">撤回原因</Label>
            <Textarea
              id="reason"
              placeholder="请详细说明撤回原因..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
          >
            取消
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={submitting || reason.trim().length < 5}
          >
            {submitting ? "提交中..." : "提交申请"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// 添加取消撤回申请对话框组件
function CancelWithdrawalDialog({ 
  open, 
  setOpen, 
  projectId, 
  projectName, 
  onComplete 
}: { 
  open: boolean;
  setOpen: (open: boolean) => void;
  projectId: string;
  projectName: string;
  onComplete?: () => void;
}) {
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  
  const handleCancel = async () => {
    try {
      setSubmitting(true)
      
      // 使用客户端API函数取消撤回申请
      const result = await cancelWithdrawalRequest(projectId);
      
      // 无论成功或失败，都关闭对话框
      setOpen(false);
      
      // 如果成功，通知父组件刷新
      if (result.success && onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error("取消撤回申请失败", error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "取消撤回申请失败",
        variant: "destructive"
      });
      // 即使出错也关闭对话框
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>取消撤回申请</DialogTitle>
          <DialogDescription>
            项目: {projectName}
            <br />
            确定要取消撤回申请吗？取消后项目状态将恢复为「已提交」。
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
          >
            返回
          </Button>
          <Button 
            onClick={handleCancel}
            disabled={submitting}
            variant="destructive"
          >
            {submitting ? "处理中..." : "确认取消撤回申请"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

