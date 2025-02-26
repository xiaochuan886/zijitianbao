"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
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
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Check, X, Eye } from "lucide-react"

interface WithdrawalRequest {
  id: string;
  status: string;
  remark?: string | null;
  createdAt: string;
  updatedAt: string;
  subProject: {
    id: string;
    name: string;
    project: {
      id: string;
      name: string;
      organization: {
        id: string;
        name: string;
      };
    };
  };
  year: number;
  month: number;
  predicted?: number | null;
}

// 简单的日期格式化函数
function formatDate(date: Date | string): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
}

export default function WithdrawalsPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>("pending")
  const [statusOptions] = useState([
    { value: "pending", label: "待处理" },
    { value: "approved", label: "已批准" },
    { value: "rejected", label: "已拒绝" },
  ])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [detailsOpen, setDetailsOpen] = useState<WithdrawalRequest | null>(null)
  
  // 获取撤回申请列表
  const fetchWithdrawals = useCallback(async () => {
    try {
      setLoading(true)
      
      const response = await fetch(`/api/funding/predict/withdrawal?status=${selectedStatus}&page=${page}&limit=10`)
      
      if (!response.ok) {
        throw new Error("获取撤回申请列表失败")
      }
      
      const data = await response.json()
      
      setWithdrawals(data.data)
      setTotalPages(data.meta.pages)
      
      setLoading(false)
    } catch (error) {
      console.error("获取撤回申请列表失败", error)
      toast({
        title: "错误",
        description: "获取撤回申请列表失败",
        variant: "destructive"
      })
      setLoading(false)
    }
  }, [selectedStatus, page, toast])
  
  // 处理撤回申请
  const handleProcess = useCallback(async (recordId: string, action: "approve" | "reject", comment: string = "") => {
    try {
      const response = await fetch("/api/funding/predict/withdrawal/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          recordId,
          action,
          comment
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "处理撤回申请失败")
      }
      
      toast({
        title: "成功",
        description: action === "approve" ? "已批准撤回申请" : "已拒绝撤回申请"
      })
      
      // 刷新数据
      fetchWithdrawals()
    } catch (error) {
      console.error("处理撤回申请失败", error)
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "处理撤回申请失败",
        variant: "destructive"
      })
    }
  }, [fetchWithdrawals, toast])
  
  // 初始化
  useEffect(() => {
    fetchWithdrawals()
  }, [fetchWithdrawals])
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">撤回申请管理</h1>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>撤回申请列表</CardTitle>
            <Select
              value={selectedStatus}
              onValueChange={(value) => {
                setSelectedStatus(value)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">加载中...</div>
          ) : withdrawals.length === 0 ? (
            <div className="text-center py-8">暂无数据</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>项目</TableHead>
                    <TableHead>子项目</TableHead>
                    <TableHead>申请时间</TableHead>
                    <TableHead>撤回原因</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell className="font-medium">
                        {withdrawal.subProject?.name} / {withdrawal.subProject?.project?.name}
                      </TableCell>
                      <TableCell>{withdrawal.subProject?.project?.organization?.name}</TableCell>
                      <TableCell>{withdrawal.year}年{withdrawal.month}月</TableCell>
                      <TableCell>
                        {withdrawal.remark && withdrawal.remark.includes("撤回原因:") 
                          ? withdrawal.remark.split("撤回原因:")[1].split("|")[0].trim()
                          : "无原因"}
                      </TableCell>
                      <TableCell>
                        {withdrawal.status === "pending" && (
                          <Badge className="bg-yellow-200 text-yellow-800">待处理</Badge>
                        )}
                        {withdrawal.status === "approved" && (
                          <Badge className="bg-green-200 text-green-800">已批准</Badge>
                        )}
                        {withdrawal.status === "rejected" && (
                          <Badge className="bg-red-200 text-red-800">已拒绝</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ApprovalDialog 
                            withdrawal={withdrawal} 
                            onApprove={handleProcess} 
                          />
                          <RejectDialog 
                            withdrawal={withdrawal} 
                            onReject={handleProcess} 
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault()
                          if (page > 1) setPage(page - 1)
                        }} 
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <PaginationItem key={p}>
                        <PaginationLink 
                          href="#" 
                          isActive={page === p} 
                          onClick={(e) => {
                            e.preventDefault()
                            setPage(p)
                          }}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault()
                          if (page < totalPages) setPage(page + 1)
                        }} 
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* 详情对话框 */}
      <Dialog open={!!detailsOpen} onOpenChange={(open) => !open && setDetailsOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>撤回申请详情</DialogTitle>
          </DialogHeader>
          
          {detailsOpen && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">项目信息</h3>
                <p>机构: {detailsOpen.subProject?.project?.organization?.name}</p>
                <p>项目: {detailsOpen.subProject?.project?.name}</p>
                <p>子项目: {detailsOpen.subProject?.name}</p>
              </div>
              
              <div>
                <h3 className="font-medium">申请信息</h3>
                <p>申请时间: {formatDate(new Date(detailsOpen.createdAt))}</p>
                <p>状态: {
                  detailsOpen.status === "pending" ? "待处理" :
                  detailsOpen.status === "approved" ? "已批准" :
                  detailsOpen.status === "rejected" ? "已拒绝" : detailsOpen.status
                }</p>
              </div>
              
              <div>
                <h3 className="font-medium">撤回原因</h3>
                <p className="whitespace-pre-line">{detailsOpen.remark || "无原因"}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">关闭</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 批准对话框组件
function ApprovalDialog({ 
  withdrawal, 
  onApprove 
}: { 
  withdrawal: WithdrawalRequest,
  onApprove: (recordId: string, action: "approve" | "reject", comment: string) => Promise<void>
}) {
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  
  const handleApprove = async () => {
    try {
      setSubmitting(true)
      await onApprove(withdrawal.id, "approve", comment)
    } finally {
      setSubmitting(false)
    }
  }
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Check className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>批准撤回申请</DialogTitle>
          <DialogDescription>
            批准后，该记录将恢复为草稿状态，用户可以重新编辑。
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="comment">管理员备注（可选）</Label>
            <Textarea
              id="comment"
              placeholder="请输入备注信息..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">取消</Button>
          </DialogClose>
          <Button 
            onClick={handleApprove}
            disabled={submitting}
          >
            {submitting ? "处理中..." : "确认批准"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// 拒绝对话框组件
function RejectDialog({ 
  withdrawal, 
  onReject 
}: { 
  withdrawal: WithdrawalRequest,
  onReject: (recordId: string, action: "approve" | "reject", comment: string) => Promise<void>
}) {
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  
  const handleReject = async () => {
    try {
      setSubmitting(true)
      await onReject(withdrawal.id, "reject", comment)
    } finally {
      setSubmitting(false)
    }
  }
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <X className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>拒绝撤回申请</DialogTitle>
          <DialogDescription>
            拒绝后，该记录将不再恢复为草稿状态，用户无法重新编辑。
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="comment">管理员备注（可选）</Label>
            <Textarea
              id="comment"
              placeholder="请输入拒绝理由..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">取消</Button>
          </DialogClose>
          <Button 
            onClick={handleReject}
            disabled={submitting}
          >
            {submitting ? "处理中..." : "确认拒绝"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 