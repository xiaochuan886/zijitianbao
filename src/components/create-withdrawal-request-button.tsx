"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Undo2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

type CreateWithdrawalRequestButtonProps = {
  recordId: string;
  recordType: "predict" | "actual_user" | "actual_fin" | "audit";
  disabled?: boolean;
  onSuccess?: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
};

export function CreateWithdrawalRequestButton({
  recordId,
  recordType,
  disabled = false,
  onSuccess,
  variant = "outline",
  size = "sm",
}: CreateWithdrawalRequestButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("请输入撤回原因", {
        duration: 5000,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log("提交撤回请求:", { recordId, recordType, reason });
      
      const response = await fetch("/api/withdrawal-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recordId,
          recordType,
          reason,
        }),
      });

      const data = await response.json();
      console.log("撤回请求响应:", data);

      if (response.ok && data.success) {
        toast.success("撤回申请已提交", {
          description: "您的撤回申请已成功提交，请等待审核",
          duration: 5000,
        });
        setIsDialogOpen(false);
        setReason("");
        onSuccess?.();
      } else {
        // 提取错误信息
        let errorMessage = "提交撤回申请失败";
        let errorDescription = "";
        
        // 直接使用后端返回的message字段（如果存在）
        if (data.message) {
          errorMessage = data.message;
        }
        
        // 如果有error对象且包含type字段，根据类型提供更具体的错误信息
        if (data.error) {
          if (typeof data.error === 'object' && data.error.type) {
            const errorType = data.error.type;
            
            if (errorType === "time_limit_exceeded") {
              const timeLimit = data.error.timeLimit || 24;
              const hoursPassed = data.error.hoursSinceSubmission ? Math.floor(data.error.hoursSinceSubmission) : "未知";
              errorMessage = "撤回时间已超过限制";
              errorDescription = `提交后${timeLimit}小时内可撤回，已过${hoursPassed}小时`;
            } else if (errorType === "max_attempts_exceeded") {
              errorMessage = "已达到最大撤回次数限制";
              errorDescription = `最多可撤回${data.error.maxAttempts || 3}次`;
            } else if (errorType === "invalid_status") {
              errorMessage = "当前记录状态不允许撤回";
              errorDescription = `当前状态: ${data.error.currentStatus || "未知"}`;
            } else if (errorType === "record_not_found") {
              errorMessage = "记录不存在或已被删除";
            } else if (errorType === "already_pending") {
              errorMessage = "已有待处理的撤回请求";
              errorDescription = "请等待管理员处理您之前的撤回申请";
            }
          } else if (typeof data.error === 'string') {
            errorDescription = data.error;
          }
        }
        
        // 确保显示错误提示
        console.error("撤回申请失败:", errorMessage, errorDescription);
        
        toast.error(errorMessage, {
          description: errorDescription,
          duration: 5000, // 确保显示足够长的时间
        });
        
        // 在错误情况下也关闭对话框
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("撤回申请出错:", error);
      toast.error("撤回申请失败", {
        description: "无法连接到服务器，请稍后再试",
        duration: 5000, // 确保显示足够长的时间
      });
      // 在错误情况下也关闭对话框
      setIsDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsDialogOpen(true)}
        disabled={disabled}
      >
        <Undo2 className="mr-2 h-4 w-4" />
        申请撤回
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>申请撤回</DialogTitle>
            <DialogDescription>
              请输入您申请撤回的原因，管理员审核后将决定是否允许撤回。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Textarea
              id="reason"
              placeholder="请输入撤回原因..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner className="mr-2" /> : null}
              提交申请
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 