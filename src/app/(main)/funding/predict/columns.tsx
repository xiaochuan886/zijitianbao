"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { FileEdit, Upload, RotateCcw, MoreHorizontal, Eye, X, XCircle, ChevronRight, ChevronDown } from "lucide-react"
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
  predictUserStatus?: string  // 添加专门用于子项目的用户状态字段
  status?: string  // 添加通用状态字段
  subProjectCount?: number
  remarks?: { subProject: string, content: string, period: string }[]
  remark?: string
  year: string
  projectId?: string
  subProjectId?: string
  subProject?: string
  fundType?: string  // 添加资金需求类型字段
  projectCategory?: string // 项目类型字段
  predictMonth?: string // 添加预测月份字段
  isGroupHeader?: boolean
  groupId?: string
  isGroupItem?: boolean
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
    cell: ({ row }) => {
      if (row.original.isGroupHeader) {
        return null;
      }
      
      return (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "organization",
    header: "机构",
    cell: ({ row }) => {
      if (row.original.isGroupHeader) {
        return (
          <div className="flex items-center font-medium">
            <ChevronRight className="h-4 w-4 mr-2" />
            {row.original.organization}
          </div>
        );
      }
      return null;
    }
  },
  {
    accessorKey: "department",
    header: "部门",
    cell: ({ row }) => {
      if (row.original.isGroupHeader) {
        return row.original.department;
      }
      return null;
    }
  },
  {
    accessorKey: "projectCategory",
    header: "项目类型",
    cell: ({ row }) => {
      if (row.original.isGroupHeader) {
        return row.original.projectCategory;
      }
      return null;
    }
  },
  {
    accessorKey: "project",
    header: "项目",
    cell: ({ row }) => {
      if (row.original.isGroupHeader) {
        return <span className="font-medium">{row.original.project}</span>;
      }
      return null;
    }
  },
  {
    accessorKey: "subProject",
    header: "子项目",
    cell: ({ row }) => {
      if (!row.original.isGroupHeader) {
        return (
          <div className="flex items-center">
            <span className="ml-6 font-medium">{row.original.subProject}</span>
          </div>
        );
      }
      return null;
    }
  },
  {
    accessorKey: "fundType",
    header: "资金需求类型",
    cell: ({ row }) => {
      if (!row.original.isGroupHeader && row.original.fundType) {
        return <span className="text-sm">{row.original.fundType}</span>;
      }
      return null;
    }
  },
  {
    accessorKey: "predictMonth",
    header: "预测月份",
    cell: ({ row }) => {
      if (!row.original.isGroupHeader) {
        return <span className="text-sm">{row.original.month || row.original.predictMonth}</span>;
      }
      return null;
    }
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({ row }) => {
      if (row.original.isGroupHeader) {
        return null;
      }
      
      // 优先使用 predictUserStatus 字段
      const prediction = row.original;
      const status = prediction.predictUserStatus || prediction.status || "未填写";
      
      let color = "";
      let text = "";
      
      switch (status) {
        case "未填写":
        case "unfilled":
          color = "bg-gray-200";
          text = "未填写";
          break;
        case "草稿":
        case "draft":
          color = "bg-yellow-200";
          text = "草稿";
          break;
        case "已提交":
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
    accessorKey: "remark",
    header: "备注",
    cell: ({ row }) => {
      if (row.original.isGroupHeader) {
        return null;
      }
      
      const prediction = row.original;
      const remark = prediction.remark;
      
      // 如果没有任何备注信息，显示占位符
      if (!remark) {
        return <span className="text-gray-400">-</span>;
      }
      
      // 显示备注内容
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
    },
  },
  {
    id: "actions",
    header: "操作",
    cell: ({ row }) => {
      if (row.original.isGroupHeader) {
        return null;
      }
      
      const router = useRouter()
      const { toast } = useToast()
      const prediction = row.original
      const [open, setOpen] = useState(false)
      const [cancelWithdrawalOpen, setCancelWithdrawalOpen] = useState(false)
      
      // 获取实际的项目ID和子项目ID
      const actualProjectId = prediction.projectId || prediction.id.split('_')[0];
      const actualSubProjectId = prediction.subProjectId || (prediction.id.includes('_sub_') ? prediction.id.split('_sub_')[0] : prediction.id);
      
      // 获取状态 - 优先使用 predictUserStatus
      const status = prediction.predictUserStatus || prediction.status || "未填写";
      
      // 提交项目的函数
      const handleSubmit = async () => {
        try {
          // 调用API提交预测
          const response = await fetch(`/api/funding/predict/submit-single/${actualProjectId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              year: prediction.year,
              month: prediction.month,
              subProjectId: actualSubProjectId
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
          {status !== "未填写" && status !== "草稿" && status !== "unfilled" && status !== "draft" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const year = new Date().getFullYear()
                const month = new Date().getMonth() + 2
                window.location.href = `/funding/predict/view?id=${actualProjectId}&year=${year}&month=${month}&subProjectId=${actualSubProjectId}`
              }}
              className="h-8 px-2 py-0"
            >
              <Eye className="h-4 w-4" />
              <span className="ml-1">查看</span>
            </Button>
          )}
          
          {/* 填报按钮 - 只对未填写和草稿状态可用 */}
          {(status === "未填写" || status === "草稿" || status === "unfilled" || status === "draft") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const year = new Date().getFullYear()
                const month = new Date().getMonth() + 2
                window.location.href = `/funding/predict/edit?id=${actualProjectId}&year=${year}&month=${month}&subProjectId=${actualSubProjectId}`
              }}
              className="h-8 px-2 py-0"
            >
              <FileEdit className="h-4 w-4" />
              <span className="ml-1">填报</span>
            </Button>
          )}
          
          {/* 提交按钮 - 对草稿状态可用 */}
          {(status === "草稿" || status === "draft") && (
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
          {(status === "已提交" || status === "submitted") && (
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
          {status === "pending_withdrawal" && (
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
            projectId={actualProjectId}
            projectName={prediction.project}
            subProjectId={actualSubProjectId}
            subProjectName={prediction.subProject}
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
            projectId={actualProjectId}
            projectName={prediction.project}
            subProjectId={actualSubProjectId}
            subProjectName={prediction.subProject}
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

interface WithdrawalRequestDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  projectId: string;
  projectName: string;
  subProjectId?: string;
  subProjectName?: string;
  onComplete?: () => void;
}

function WithdrawalRequestDialog({ 
  open, 
  setOpen, 
  projectId, 
  projectName,
  subProjectId,
  subProjectName,
  onComplete 
}: WithdrawalRequestDialogProps) {
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  
  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: "请输入撤回原因",
        variant: "destructive"
      })
      return
    }
    
    try {
      setSubmitting(true)
      
      // 调用API请求撤回
      const result = await submitWithdrawalRequest(projectId, subProjectId, reason)
      
      if (!result.success) {
        throw new Error("撤回请求失败")
      }
      
      setOpen(false)
      setReason("")
      
      if (onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error("撤回请求失败", error);
      toast({
        title: "撤回请求失败",
        description: error instanceof Error ? error.message : "请求失败",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }
  
  // 构建对话框标题
  const dialogTitle = subProjectName 
    ? `申请撤回项目"${projectName}"的子项目"${subProjectName}"`
    : `申请撤回项目"${projectName}"`;
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>申请撤回</DialogTitle>
          <DialogDescription>
            {dialogTitle}，请填写撤回原因
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">撤回原因</Label>
            <Textarea
              id="reason"
              placeholder="请输入撤回原因"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false)
              setReason("")
            }}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "提交中..." : "提交"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface CancelWithdrawalDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  projectId: string;
  projectName: string;
  subProjectId?: string;
  subProjectName?: string;
  onComplete?: () => void;
}

function CancelWithdrawalDialog({ 
  open, 
  setOpen, 
  projectId, 
  projectName,
  subProjectId,
  subProjectName,
  onComplete 
}: CancelWithdrawalDialogProps) {
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  
  const handleCancel = async () => {
    try {
      setSubmitting(true)
      
      // 调用API取消撤回请求
      const result = await cancelWithdrawalRequest(projectId, subProjectId)
      
      if (!result.success) {
        throw new Error("取消撤回请求失败")
      }
      
      setOpen(false)
      
      if (onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error("取消撤回请求失败", error)
      toast({
        title: "取消撤回请求失败",
        description: error instanceof Error ? error.message : "请求失败",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }
  
  // 构建对话框描述
  const dialogDescription = subProjectName 
    ? `您确定要取消项目"${projectName}"的子项目"${subProjectName}"的撤回申请吗？`
    : `您确定要取消项目"${projectName}"的撤回申请吗？`;
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>取消撤回申请</DialogTitle>
          <DialogDescription>
            {dialogDescription}
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
          >
            取消
          </Button>
          <Button
            onClick={handleCancel}
            disabled={submitting}
          >
            {submitting ? "提交中..." : "确认"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

