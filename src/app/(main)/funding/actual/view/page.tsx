"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ArrowLeft, FileEdit, Upload, RotateCcw, X } from "lucide-react"
import { submitWithdrawalRequest } from "../client-api"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// 定义数据类型
interface FundRecord {
  id: string
  subProjectId: string
  subProjectName: string
  fundTypeId: string
  fundTypeName: string
  year: number
  month: number
  predicted: number | null
  actualUser: number | null
  actualFinance: number | null
  status: string
  remark: string
}

interface ProjectData {
  id: string
  name: string
  status: string
  userStatus?: string
  financeStatus?: string
  organization: {
    id: string
    name: string
    code: string
  }
  subProjects: {
    id: string
    name: string
    fundTypes: {
      id: string
      name: string
      records: FundRecord[]
    }[]
  }[]
}

export default function ActualViewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  // 获取角色参数，默认为user
  const role = searchParams.get('role') || 'user'
  const isUserRole = role === 'user'
  
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<ProjectData | null>(null)
  const [records, setRecords] = useState<Record<string, number | null>>({})
  const [remarks, setRemarks] = useState<Record<string, string>>({})
  const [nextMonth, setNextMonth] = useState<{year: number, month: number}>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 2 // 下个月
  })
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false)
  
  // 格式化金额
  const formatCurrency = useCallback((amount: number | null) => {
    if (amount === null) return ""
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
    }).format(amount)
  }, []);
  
  // 计算年度汇总
  const calculateYearTotal = useCallback((subProjectId: string, fundTypeId: string) => {
    if (!project) return 0;
    
    let total = 0;
    
    project.subProjects.forEach(subProject => {
      if (subProject.id === subProjectId) {
        subProject.fundTypes.forEach(fundType => {
          if (fundType.id === fundTypeId) {
            fundType.records.forEach(record => {
              // 根据角色获取相应的金额数据
              const amount = isUserRole ? record.actualUser : record.actualFinance;
              // 只计算有效的记录
              if (amount !== null) {
                total += amount;
              }
            });
          }
        });
      }
    });
    
    return total;
  }, [project, isUserRole]);
  
  // 提交项目
  const handleSubmit = useCallback(async () => {
    if (!project) return;
    
    try {
      setSubmitting(true);
      
      // 调用API提交实际支付
      const response = await fetch(`/api/funding/actual/submit-single/${project.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year: nextMonth.year,
          month: nextMonth.month,
          isUserReport: isUserRole
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
      
      // 返回列表页
      router.push("/funding/actual");
    } catch (error) {
      console.error("提交失败", error);
      toast({
        title: "提交失败",
        description: error instanceof Error ? error.message : "提交失败",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  }, [project, nextMonth, router, toast, isUserRole]);
  
  // 提交撤回申请
  const handleWithdrawalRequest = useCallback(async () => {
    if (!project) return;
    
    if (reason.trim().length < 5) {
      toast({
        title: "错误",
        description: "撤回原因至少需要5个字符",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      // 使用客户端API函数提交撤回申请
      const result = await submitWithdrawalRequest(project.id, reason);
      
      // 关闭对话框
      setWithdrawalDialogOpen(false);
      
      if (result.success) {
        toast({
          title: "撤回申请已提交",
          description: "状态已更新为「撤回申请待审批」"
        });
        
        // 返回列表页
        router.push("/funding/actual");
      }
    } catch (error) {
      console.error("提交撤回申请失败", error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "提交撤回申请失败",
        variant: "destructive"
      });
      // 即使出错也关闭对话框
      setWithdrawalDialogOpen(false);
    } finally {
      setSubmitting(false);
    }
  }, [project, reason, router, toast]);
  
  // 取消撤回申请
  const handleCancelWithdrawal = useCallback(async () => {
    if (!project) return;
    
    try {
      setSubmitting(true);
      
      // 实现取消撤回申请的API调用
      const response = await fetch(`/api/funding/actual/withdrawal/cancel/${project.id}`, {
        method: "POST"
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "取消撤回申请失败");
      }
      
      toast({
        title: "成功",
        description: "已取消撤回申请"
      });
      
      // 返回列表页
      router.push("/funding/actual");
    } catch (error) {
      console.error("取消撤回申请失败", error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "取消撤回申请失败",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  }, [project, router, toast]);
  
  // 获取项目数据
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 获取查询参数
      const id = searchParams.get("id");
      const year = searchParams.get("year") || new Date().getFullYear().toString();
      const month = searchParams.get("month") || (new Date().getMonth() + 2).toString();
      
      setNextMonth({
        year: parseInt(year),
        month: parseInt(month)
      });
      
      if (!id) {
        toast({
          title: "错误",
          description: "缺少必要的项目ID参数",
          variant: "destructive"
        });
        router.push("/funding/actual");
        return;
      }
      
      // 获取项目数据
      const response = await fetch(`/api/funding/actual/${id}?year=${year}&month=${month}&role=${role}`);
      
      if (!response.ok) {
        throw new Error("获取项目详情失败");
      }
      
      const projectData = await response.json();
      
      setProject(projectData);
      
      // 初始化记录和备注
      const initialRecords: Record<string, number | null> = {};
      const initialRemarks: Record<string, string> = {};
      
      projectData.subProjects.forEach((subProject: any) => {
        subProject.fundTypes.forEach((fundType: any) => {
          fundType.records.forEach((record: FundRecord) => {
            // 根据角色选择不同的字段
            initialRecords[record.id] = isUserRole ? record.actualUser : record.actualFinance;
            initialRemarks[record.id] = record.remark || "";
          });
        });
      });
      
      setRecords(initialRecords);
      setRemarks(initialRemarks);
      setLoading(false);
    } catch (error) {
      console.error("获取数据失败", error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "获取数据失败",
        variant: "destructive"
      });
      setLoading(false);
      router.push("/funding/actual");
    }
  }, [searchParams, toast, router, role, isUserRole]);
  
  // 初始化
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // 获取当前角色下的状态
  const getCurrentStatus = useCallback(() => {
    if (!project) return "";
    
    // 根据角色返回不同的状态
    if (isUserRole) {
      return project.userStatus || project.status;
    } else {
      return project.financeStatus || project.status;
    }
  }, [project, isUserRole]);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/funding/actual")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">实际支付详情 ({isUserRole ? "填报人视图" : "财务视图"})</h1>
        </div>
      </div>
      
      <div className="space-y-8">
        {loading ? (
          <div className="text-center py-8">加载中...</div>
        ) : project ? (
          <Card className="overflow-hidden">
            <CardHeader className="bg-muted">
              <CardTitle>
                {project.organization.name} ({project.organization.code}) - {project.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">子项目</TableHead>
                      <TableHead className="w-[150px]">资金需求类型</TableHead>
                      <TableHead className="w-[150px]">年度汇总</TableHead>
                      {/* 历史月份 */}
                      {[1, 2, 3].filter(month => month < nextMonth.month).map(month => (
                        <TableHead key={month} className="w-[150px]">
                          {`${nextMonth.year}-${month.toString().padStart(2, '0')}`}
                        </TableHead>
                      ))}
                      {/* 当前月份 */}
                      <TableHead className="w-[150px]">
                        {`${nextMonth.year}-${nextMonth.month.toString().padStart(2, '0')}`}
                      </TableHead>
                      <TableHead className="w-[200px]">备注</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.subProjects.map(subProject => (
                      subProject.fundTypes.map(fundType => (
                        <TableRow key={`${subProject.id}-${fundType.id}`}>
                          <TableCell>{subProject.name}</TableCell>
                          <TableCell>{fundType.name}</TableCell>
                          <TableCell className="font-medium">
                            {formatCurrency(calculateYearTotal(subProject.id, fundType.id))}
                          </TableCell>
                          {/* 历史月份数据 */}
                          {[1, 2, 3].filter(month => month < nextMonth.month).map(month => {
                            const record = fundType.records.find(r => r.month === month && r.year === nextMonth.year);
                            // 根据角色显示不同的数据
                            const amount = record ? (isUserRole ? record.actualUser : record.actualFinance) : null;
                            return (
                              <TableCell key={month}>
                                {amount !== null ? formatCurrency(amount) : ""}
                              </TableCell>
                            );
                          })}
                          {/* 当前月份数据 */}
                          <TableCell>
                            {fundType.records
                              .filter(record => record.year === nextMonth.year && record.month === nextMonth.month)
                              .map(record => {
                                // 根据角色显示不同的数据
                                const amount = isUserRole ? record.actualUser : record.actualFinance;
                                return (
                                  <Input
                                    key={record.id}
                                    type="text"
                                    value={amount !== null ? formatCurrency(amount) : ""}
                                    readOnly
                                    className="w-full bg-muted cursor-not-allowed"
                                  />
                                );
                              })}
                          </TableCell>
                          {/* 备注 */}
                          <TableCell>
                            {fundType.records
                              .filter(record => record.year === nextMonth.year && record.month === nextMonth.month)
                              .map(record => (
                                <TooltipProvider key={record.id}>
                                  <Tooltip delayDuration={0}>
                                    <TooltipTrigger asChild>
                                      <Textarea
                                        key={record.id}
                                        value={record.remark || ""}
                                        readOnly
                                        className="w-full resize-none bg-muted cursor-help hover:bg-accent/20"
                                        rows={2}
                                        title={record.remark || ""}
                                      />
                                    </TooltipTrigger>
                                    {record.remark && (
                                      <TooltipContent side="top" align="start" sideOffset={5} className="bg-popover text-popover-foreground p-3 shadow-lg border rounded-md z-50 max-w-md">
                                        <div>
                                          <p className="text-sm whitespace-pre-wrap">{record.remark}</p>
                                        </div>
                                      </TooltipContent>
                                    )}
                                  </Tooltip>
                                </TooltipProvider>
                              ))}
                          </TableCell>
                        </TableRow>
                      ))
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2 p-4 bg-muted/50">
              {/* 填报按钮 - 只对未填写和草稿状态可用 */}
              {(getCurrentStatus() === "未填写" || getCurrentStatus() === "草稿") && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/funding/actual/edit?id=${project.id}&year=${nextMonth.year}&month=${nextMonth.month}&role=${role}`)}
                  className="h-8 px-2 py-0"
                >
                  <FileEdit className="h-4 w-4" />
                  <span className="ml-1">填报</span>
                </Button>
              )}
              
              {/* 提交按钮 - 对草稿状态可用 */}
              {getCurrentStatus() === "草稿" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 py-0"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="ml-1">提交</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认提交</AlertDialogTitle>
                      <AlertDialogDescription>
                        提交后数据将被锁定，不能再次修改。确定要提交吗？
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSubmit}>确认提交</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              
              {/* 撤回申请按钮 - 对已提交状态可用 */}
              {getCurrentStatus() === "已提交" && (
                <Dialog open={withdrawalDialogOpen} onOpenChange={setWithdrawalDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 py-0"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span className="ml-1">撤回</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>提交撤回申请</DialogTitle>
                      <DialogDescription>
                        项目: {project.name}
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
                        onClick={() => setWithdrawalDialogOpen(false)}
                      >
                        取消
                      </Button>
                      <Button 
                        onClick={handleWithdrawalRequest}
                        disabled={submitting || reason.trim().length < 5}
                      >
                        {submitting ? "提交中..." : "提交申请"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
              
              {/* 取消撤回申请按钮 - 对待审核状态可用 */}
              {getCurrentStatus() === "pending_withdrawal" && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline"
                      size="sm"
                      className="h-8 px-2 py-0"
                    >
                      <X className="h-4 w-4" />
                      <span className="ml-1">取消撤回</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>确认取消撤回申请</AlertDialogTitle>
                      <AlertDialogDescription>
                        确定要取消撤回申请吗？取消后状态将恢复为"已提交"。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancelWithdrawal}>确认取消撤回申请</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </CardFooter>
          </Card>
        ) : (
          <div className="text-center py-8">未找到项目数据</div>
        )}
      </div>
    </div>
  )
}