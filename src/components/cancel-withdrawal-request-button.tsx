"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";

type CancelWithdrawalRequestButtonProps = {
  recordId: string;
  recordType: "predict" | "actual_user" | "actual_fin" | "audit";
  disabled?: boolean;
  onSuccess?: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
};

export function CancelWithdrawalRequestButton({
  recordId,
  recordType,
  disabled = false,
  onSuccess,
  variant = "outline",
  size = "sm",
}: CancelWithdrawalRequestButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleCancel = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/withdrawal-request/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recordId,
          recordType,
        }),
      });

      const data = await response.json();
      console.log("取消撤回请求响应:", data);

      if (response.ok && data.success) {
        toast({
          title: "取消撤回申请成功",
          description: "您的记录已恢复到之前的状态",
          duration: 5000,
        });
        setIsDialogOpen(false);
        onSuccess?.();
      } else {
        let errorMessage = "取消撤回申请失败";
        let errorDescription = "";
        
        if (data.message) {
          errorMessage = data.message;
        }
        
        if (data.error) {
          if (typeof data.error === 'object' && data.error.type) {
            const errorType = data.error.type;
            
            if (errorType === "record_not_found") {
              errorMessage = "记录不存在或已被删除";
            } else if (errorType === "invalid_status") {
              errorMessage = "当前记录状态不允许取消撤回";
              errorDescription = `当前状态: ${data.error.currentStatus || "未知"}`;
            } else if (errorType === "no_pending_request") {
              errorMessage = "没有待处理的撤回请求";
            } else if (errorType === "permission_denied") {
              errorMessage = "您没有权限取消此撤回请求";
            }
          } else if (typeof data.error === 'string') {
            errorDescription = data.error;
          }
        }
        
        console.error("取消撤回申请失败:", errorMessage, errorDescription);
        
        toast({
          title: errorMessage,
          description: errorDescription,
          variant: "destructive",
          duration: 5000,
        });
        
        // 关闭对话框，即使出现错误
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("取消撤回申请出错:", error);
      toast({
        title: "取消撤回申请失败",
        description: "无法连接到服务器，请稍后再试",
        variant: "destructive",
        duration: 5000,
      });
      
      // 关闭对话框，即使出现错误
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
        <X className="mr-2 h-4 w-4" />
        取消撤回
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>取消撤回申请</DialogTitle>
            <DialogDescription>
              确定要取消您的撤回申请吗？取消后，记录将恢复到之前的状态。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              disabled={isSubmitting}
            >
              返回
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              {isSubmitting ? <Spinner className="mr-2" /> : null}
              确认取消
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 