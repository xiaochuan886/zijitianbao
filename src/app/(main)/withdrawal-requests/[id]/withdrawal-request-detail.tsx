"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

// 定义撤回请求类型
type WithdrawalRequest = {
  id: string;
  status: string;
  reason: string;
  createdAt: string;
  reviewedAt?: string;
  adminRemarks?: string;
  requester: {
    id: string;
    name: string;
    email: string;
  };
  admin?: {
    id: string;
    name: string;
    email: string;
  };
  predictRecord?: {
    id: string;
    status: string;
    year?: number;
    month?: number;
    amount?: number;
    submittedAt?: string;
    createdAt?: string;
  };
  actualUserRecord?: {
    id: string;
    status: string;
    submittedAt?: string;
    createdAt?: string;
  };
  actualFinRecord?: {
    id: string;
    status: string;
    submittedAt?: string;
    createdAt?: string;
  };
  auditRecord?: {
    id: string;
    status: string;
    submittedAt?: string;
    createdAt?: string;
  };
};

// 定义组件属性
type WithdrawalRequestDetailProps = {
  request: WithdrawalRequest;
  isAdmin: boolean;
};

export function WithdrawalRequestDetail({ request, isAdmin }: WithdrawalRequestDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  // 审批对话框状态
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected">("approved");
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 提交审批
  const handleSubmitReview = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/withdrawal-request/${request.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: reviewStatus,
          remarks: reviewRemarks,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "审批成功",
          description: `撤回请求已${reviewStatus === "approved" ? "批准" : "拒绝"}`,
        });
        
        // 刷新页面
        router.refresh();
        setIsReviewDialogOpen(false);
      } else {
        toast({
          title: "审批失败",
          description: data.error || "无法处理撤回请求",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to process withdrawal request:", error);
      toast({
        title: "审批失败",
        description: "无法处理撤回请求",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 获取记录信息
  const getRecordInfo = () => {
    if (request.predictRecord) {
      return {
        type: "预测填报",
        id: request.predictRecord.id,
        status: request.predictRecord.status,
        info: `${request.predictRecord.year}年${request.predictRecord.month}月 (${request.predictRecord.amount || 0}元)`,
        date: request.predictRecord.submittedAt || request.predictRecord.createdAt || "",
      };
    }
    if (request.actualUserRecord) {
      return {
        type: "实际填报(用户)",
        id: request.actualUserRecord.id,
        status: request.actualUserRecord.status,
        info: "用户实际填报记录",
        date: request.actualUserRecord.submittedAt || request.actualUserRecord.createdAt || "",
      };
    }
    if (request.actualFinRecord) {
      return {
        type: "实际填报(财务)",
        id: request.actualFinRecord.id,
        status: request.actualFinRecord.status,
        info: "财务实际填报记录",
        date: request.actualFinRecord.submittedAt || request.actualFinRecord.createdAt || "",
      };
    }
    if (request.auditRecord) {
      return {
        type: "审计填报",
        id: request.auditRecord.id,
        status: request.auditRecord.status,
        info: "审计填报记录",
        date: request.auditRecord.submittedAt || request.auditRecord.createdAt || "",
      };
    }
    return {
      type: "未知",
      id: "",
      status: "",
      info: "未知记录",
      date: "",
    };
  };

  // 获取状态标签
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">待处理</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">已批准</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">已拒绝</Badge>;
      case "withdrawn":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">已撤回</Badge>;
      case "submitted":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">已提交</Badge>;
      case "draft":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">草稿</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/withdrawal-requests">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回列表
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">撤回请求详情</h1>
        </div>
        
        {isAdmin && request.status === "pending" && (
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setReviewStatus("rejected");
                setIsReviewDialogOpen(true);
              }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              拒绝
            </Button>
            <Button 
              onClick={() => {
                setReviewStatus("approved");
                setIsReviewDialogOpen(true);
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              批准
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>申请信息</CardTitle>
            <CardDescription>撤回请求的基本信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">申请ID</p>
                <p>{request.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">申请状态</p>
                <div className="mt-1">{getStatusBadge(request.status)}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">申请人</p>
                <p>{request.requester.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">申请时间</p>
                <p>{formatDate(request.createdAt)}</p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">申请原因</p>
              <div className="mt-1 p-3 bg-muted rounded-md">{request.reason}</div>
            </div>
            
            {request.status !== "pending" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">处理人</p>
                    <p>{request.admin?.name || "系统自动处理"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">处理时间</p>
                    <p>{request.reviewedAt ? formatDate(request.reviewedAt) : "未知"}</p>
                  </div>
                </div>
                
                {request.adminRemarks && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">处理备注</p>
                    <div className="mt-1 p-3 bg-muted rounded-md">{request.adminRemarks}</div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>记录信息</CardTitle>
            <CardDescription>申请撤回的记录详情</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">记录类型</p>
                <p>{getRecordInfo().type}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">记录ID</p>
                <p>{getRecordInfo().id}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">记录状态</p>
                <div className="mt-1">{getStatusBadge(getRecordInfo().status)}</div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">提交时间</p>
                <p>{formatDate(getRecordInfo().date)}</p>
              </div>
            </div>
            
            {getRecordInfo().info && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">记录信息</p>
                <div className="mt-1 p-3 bg-muted rounded-md">{getRecordInfo().info}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 审批对话框 */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>审批撤回请求</DialogTitle>
            <DialogDescription>
              请确认是否{reviewStatus === "approved" ? "批准" : "拒绝"}此撤回申请
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm font-medium mb-1">审批结果</p>
              <div className="flex items-center space-x-2">
                {reviewStatus === "approved" ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">批准</Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">拒绝</Badge>
                )}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-1">审批备注</p>
              <Textarea
                placeholder="请输入审批备注（可选）"
                value={reviewRemarks}
                onChange={(e) => setReviewRemarks(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmitReview} disabled={isSubmitting}>
              {isSubmitting ? <Spinner className="mr-2" size="sm" /> : null}
              确认{reviewStatus === "approved" ? "批准" : "拒绝"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 