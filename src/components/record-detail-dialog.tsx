"use client"

import { useState, useEffect } from "react"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RecordStatus } from "@/lib/enums"
import { PredictRecord } from "@/hooks/use-funding-predict-v2"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"

// 状态映射
const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "草稿", variant: "default" },
  submitted: { label: "已提交", variant: "secondary" },
  pending_withdrawal: { label: "待撤回", variant: "outline" },
  approved: { label: "已批准", variant: "secondary" },
  rejected: { label: "已拒绝", variant: "destructive" },
  unfilled: { label: "未填写", variant: "outline" },
}

interface RecordDetailDialogProps {
  record: PredictRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecordDetailDialog({ record, open, onOpenChange }: RecordDetailDialogProps) {
  const [submitterName, setSubmitterName] = useState<string>("-");
  
  useEffect(() => {
    // 当记录变化或对话框打开时，获取提交人信息
    if (record && record.submittedBy && open) {
      fetchSubmitterName(record.submittedBy);
    } else {
      setSubmitterName("-");
    }
  }, [record, open]);
  
  // 获取提交人姓名
  const fetchSubmitterName = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (response.ok) {
        const userData = await response.json();
        setSubmitterName(userData.name || "-");
      } else {
        console.error("获取用户信息失败");
        setSubmitterName("-");
      }
    } catch (error) {
      console.error("获取用户信息出错:", error);
      setSubmitterName("-");
    }
  };

  if (!record) return null;

  // 格式化金额
  const formatCurrency = (amount: number | null): string => {
    if (amount === null) return "-";
    return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(amount);
  }

  // 格式化日期时间
  const formatDateTime = (date: Date | null): string => {
    if (!date) return "-";
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-semibold">记录详情</DialogTitle>
          <DialogDescription>
            查看填报记录的详细信息
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 gap-6">
            {/* 基本信息卡片 */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-base font-medium mb-3">基本信息</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">组织机构</h4>
                    <p className="text-sm">{record.detailedFundNeed?.organization?.name || '未知机构'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">部门</h4>
                    <p className="text-sm">{record.detailedFundNeed?.department?.name || '未知部门'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">项目分类</h4>
                    <p className="text-sm">{record.detailedFundNeed?.subProject?.project?.category?.name || '未知类型'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">项目</h4>
                    <p className="text-sm">{record.detailedFundNeed?.subProject?.project?.name || '未知项目'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">子项目</h4>
                    <p className="text-sm">{record.detailedFundNeed?.subProject?.name || '未知子项目'}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">资金类型</h4>
                    <p className="text-sm">{record.detailedFundNeed?.fundType?.name || '-'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* 填报信息卡片 */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-base font-medium mb-3">填报信息</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">年份</h4>
                    <p className="text-sm">{record.year}年</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">月份</h4>
                    <p className="text-sm">{record.month}月</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">金额</h4>
                    <p className="text-sm font-semibold">{formatCurrency(record.amount)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">状态</h4>
                    <Badge variant={statusMap[record.status.toLowerCase()]?.variant || "default"}>
                      {statusMap[record.status.toLowerCase()]?.label || record.status}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <h4 className="text-sm font-medium text-muted-foreground">备注</h4>
                    <p className="text-sm whitespace-pre-wrap">{record.remark || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* 时间信息卡片 */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-base font-medium mb-3">时间信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">提交人</h4>
                    <p className="text-sm">{submitterName}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">提交时间</h4>
                    <p className="text-sm">{formatDateTime(record.submittedAt)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">创建时间</h4>
                    <p className="text-sm">{formatDateTime(record.createdAt)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">更新时间</h4>
                    <p className="text-sm">{formatDateTime(record.updatedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <DialogFooter className="px-6 py-4 border-t">
          <Button onClick={() => onOpenChange(false)}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 