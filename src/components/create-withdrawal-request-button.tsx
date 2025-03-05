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
import { useToast } from "@/components/ui/use-toast";
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
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: "请输入撤回原因",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
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
        toast({
          title: "撤回申请已提交",
          description: "您的撤回申请已成功提交，请等待审核",
        });
        setIsDialogOpen(false);
        setReason("");
        onSuccess?.();
      } else {
        // 根据不同错误类型显示不同的错误提示
        let errorMessage = "提交撤回申请失败";
        
        if (data.error?.type === "time_limit_exceeded") {
          errorMessage = "撤回时间已超过限制（提交后24小时内可撤回）";
        } else if (data.error?.type === "max_attempts_exceeded") {
          errorMessage = "已达到最大撤回次数限制";
        } else if (data.error?.type === "invalid_status") {
          errorMessage = "当前记录状态不允许撤回";
        } else if (data.error?.type === "record_not_found") {
          errorMessage = "记录不存在或已被删除";
        } else if (data.error?.type === "already_pending") {
          errorMessage = "已有待处理的撤回请求";
        } else if (data.message) {
          errorMessage = data.message;
        }
        
        toast({
          title: "撤回申请失败",
          description: errorMessage,
          variant: "destructive",
        });
        // 在错误情况下也关闭对话框
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("撤回申请出错:", error);
      toast({
        title: "撤回申请失败",
        description: "无法连接到服务器，请稍后再试",
        variant: "destructive",
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>申请撤回</DialogTitle>
            <DialogDescription>
              请填写撤回原因，管理员将审核您的撤回请求。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium mb-2">撤回原因</p>
              <Textarea
                placeholder="请详细说明您申请撤回的原因..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <Spinner className="mr-2" size="sm" /> : null}
              提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 