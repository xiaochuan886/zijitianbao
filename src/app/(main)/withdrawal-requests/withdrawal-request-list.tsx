"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

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
  };
  actualUserRecord?: {
    id: string;
    status: string;
  };
  actualFinRecord?: {
    id: string;
    status: string;
  };
  auditRecord?: {
    id: string;
    status: string;
  };
};

// 定义分页类型
type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

// 定义组件属性
type WithdrawalRequestListProps = {
  initialData: {
    requests: WithdrawalRequest[];
    pagination: Pagination;
  };
  isAdmin: boolean;
};

export function WithdrawalRequestList({ initialData, isAdmin }: WithdrawalRequestListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // 状态
  const [requests, setRequests] = useState<WithdrawalRequest[]>(initialData.requests);
  const [pagination, setPagination] = useState<Pagination>(initialData.pagination);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get("status") || "all");
  const [moduleTypeFilter, setModuleTypeFilter] = useState<string>(searchParams.get("moduleType") || "all");
  
  // 审批对话框状态
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [reviewStatus, setReviewStatus] = useState<"approved" | "rejected">("approved");
  const [reviewRemarks, setReviewRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 加载数据
  const loadData = async (page = 1, status = statusFilter, moduleType = moduleTypeFilter) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.append("page", page.toString());
      queryParams.append("pageSize", pagination.pageSize.toString());
      
      if (status) {
        queryParams.append("status", status);
      }
      
      if (moduleType) {
        queryParams.append("moduleType", moduleType);
      }
      
      const response = await fetch(`/api/withdrawal-request?${queryParams.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRequests(data.data.requests);
        setPagination(data.data.pagination);
      } else {
        toast({
          title: "加载失败",
          description: data.error || "无法加载撤回请求数据",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to load withdrawal requests:", error);
      toast({
        title: "加载失败",
        description: "无法加载撤回请求数据",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // 处理页面变化
  const handlePageChange = (page: number) => {
    loadData(page, statusFilter, moduleTypeFilter);
  };

  // 处理状态筛选变化
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    // 如果选择"all"，则传递空字符串给API
    loadData(1, value === "all" ? "" : value, moduleTypeFilter);
  };

  // 处理模块类型筛选变化
  const handleModuleTypeFilterChange = (value: string) => {
    setModuleTypeFilter(value);
    // 如果选择"all"，则传递空字符串给API
    loadData(1, statusFilter, value === "all" ? "" : value);
  };

  // 打开审批对话框
  const openReviewDialog = (request: WithdrawalRequest) => {
    setSelectedRequest(request);
    setReviewStatus("approved");
    setReviewRemarks("");
    setIsReviewDialogOpen(true);
  };

  // 提交审批
  const handleSubmitReview = async () => {
    if (!selectedRequest) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/withdrawal-request/${selectedRequest.id}`, {
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
        
        // 更新列表
        loadData(pagination.page, statusFilter, moduleTypeFilter);
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

  // 获取记录类型显示名称
  const getRecordTypeName = (request: WithdrawalRequest) => {
    if (request.predictRecord) return "预测填报";
    if (request.actualUserRecord) return "实际填报(用户)";
    if (request.actualFinRecord) return "实际填报(财务)";
    if (request.auditRecord) return "审计填报";
    return "未知";
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
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // 查看详情
  const viewDetails = (id: string) => {
    router.push(`/withdrawal-requests/${id}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>撤回请求列表</CardTitle>
        <CardDescription>查看和管理系统中的撤回请求</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="w-full md:w-1/3">
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="按状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待处理</SelectItem>
                <SelectItem value="approved">已批准</SelectItem>
                <SelectItem value="rejected">已拒绝</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-1/3">
            <Select value={moduleTypeFilter} onValueChange={handleModuleTypeFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="按模块筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部模块</SelectItem>
                <SelectItem value="predict">预测填报</SelectItem>
                <SelectItem value="actual_user">实际填报(用户)</SelectItem>
                <SelectItem value="actual_fin">实际填报(财务)</SelectItem>
                <SelectItem value="audit">审计填报</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Spinner size="lg" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            没有找到符合条件的撤回请求
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>申请人</TableHead>
                  <TableHead>记录类型</TableHead>
                  <TableHead>申请原因</TableHead>
                  <TableHead>申请时间</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.requester.name}</TableCell>
                    <TableCell>{getRecordTypeName(request)}</TableCell>
                    <TableCell className="max-w-xs truncate">{request.reason}</TableCell>
                    <TableCell>{formatDate(request.createdAt)}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => viewDetails(request.id)}>
                          详情
                        </Button>
                        {isAdmin && request.status === "pending" && (
                          <Button variant="default" size="sm" onClick={() => openReviewDialog(request)}>
                            审批
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <div className="w-full flex justify-center">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </CardFooter>

      {/* 审批对话框 */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>审批撤回请求</DialogTitle>
            <DialogDescription>
              请审核此撤回请求并选择批准或拒绝
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">申请人</p>
                  <p className="text-sm">{selectedRequest.requester.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">申请时间</p>
                  <p className="text-sm">{formatDate(selectedRequest.createdAt)}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-1">申请原因</p>
                <p className="text-sm border rounded-md p-2 bg-muted/50">{selectedRequest.reason}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-1">审批结果</p>
                <Select value={reviewStatus} onValueChange={(value: "approved" | "rejected") => setReviewStatus(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">批准</SelectItem>
                    <SelectItem value="rejected">拒绝</SelectItem>
                  </SelectContent>
                </Select>
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
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmitReview} disabled={isSubmitting}>
              {isSubmitting ? <Spinner className="mr-2" size="sm" /> : null}
              提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
} 