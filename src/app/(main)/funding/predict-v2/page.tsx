"use client"

import { useState, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  HistoryIcon, 
  PlusIcon, 
  Filter, 
  RefreshCw, 
  RotateCcw,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Upload,
  Building2,
  FileEdit,
  Eye,
  XCircle
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useFundingPredictV2, ProjectFilters } from "@/hooks/use-funding-predict-v2"
import { RecordStatus, Role } from "@/lib/enums"
import { Combobox, ComboboxOption } from "@/components/ui/combobox"
import { useCurrentUser } from "@/hooks/use-current-user"
import { FilterCard } from "@/components/funding/filter-card"

// 自定义组件，简化版的 FilterCard
function SimpleFilterCard({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        {children}
      </CardContent>
    </Card>
  )
}

// 自定义组件，简化版的 PageHeader
function SimplePageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col space-y-2">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {description && <p className="text-muted-foreground">{description}</p>}
    </div>
  )
}

// 自定义组件，创建填报记录对话框
function CreateRecordsDialog({ 
  open, 
  setOpen, 
  onSuccess 
}: { 
  open: boolean; 
  setOpen: (open: boolean) => void; 
  onSuccess: () => void; 
}) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 2 > 12 ? 1 : new Date().getMonth() + 2)
  
  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      
      // 调用API创建填报记录
      const response = await fetch('/api/funding/predict-v2/create-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year,
          month
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '创建填报记录失败')
      }
      
      const result = await response.json()
      
      toast({
        title: '创建成功',
        description: result.message || `成功创建 ${result.created} 条填报记录`,
      })
      
      setOpen(false)
      onSuccess()
    } catch (error) {
      console.error('创建填报记录失败', error)
      toast({
        title: '创建失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>创建填报记录</DialogTitle>
          <DialogDescription>
            根据资金需求明细创建填报记录
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="year" className="text-sm font-medium">年份</label>
              <Select
                value={year.toString()}
                onValueChange={(value) => setYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择年份" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(5)].map((_, i) => {
                    const yearValue = new Date().getFullYear() + i
                    return (
                      <SelectItem key={yearValue} value={yearValue.toString()}>
                        {yearValue}年
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="month" className="text-sm font-medium">月份</label>
              <Select
                value={month.toString()}
                onValueChange={(value) => setMonth(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择月份" />
                </SelectTrigger>
                <SelectContent>
                  {[...Array(12)].map((_, i) => {
                    const monthValue = i + 1
                    return (
                      <SelectItem key={monthValue} value={monthValue.toString()}>
                        {monthValue}月
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            将根据资金需求明细表和选择的年月创建填报记录。如果记录已存在，将不会重复创建。
          </p>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '创建中...' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// 自定义组件，操作按钮
function ActionButtonsGroup({ 
  onEdit, 
  onSubmit, 
  editDisabled, 
  submitDisabled 
}: { 
  onEdit: () => void; 
  onSubmit: () => void; 
  editDisabled: boolean; 
  submitDisabled: boolean; 
}) {
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="sm"
        onClick={onEdit}
        disabled={editDisabled}
      >
        <PlusIcon className="h-4 w-4 mr-2" />
        批量填报
      </Button>
      <Button
        size="sm"
        onClick={onSubmit}
        disabled={submitDisabled}
      >
        <Upload className="h-4 w-4 mr-2" />
        批量提交
      </Button>
    </div>
  )
}

// 扩展 RecordStatus 枚举，添加缺少的状态
const ExtendedRecordStatus = {
  ...RecordStatus,
  APPROVED: "approved",
  REJECTED: "rejected",
  UNFILLED: "unfilled"
}

// 状态映射
const statusMap: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive" }> = {
  [RecordStatus.DRAFT]: { label: "草稿", variant: "outline" },
  [RecordStatus.SUBMITTED]: { label: "已提交", variant: "secondary" },
  [RecordStatus.PENDING_WITHDRAWAL]: { label: "待撤回", variant: "secondary" },
  [ExtendedRecordStatus.APPROVED]: { label: "已审核", variant: "default" },
  [ExtendedRecordStatus.REJECTED]: { label: "已拒绝", variant: "destructive" },
  [ExtendedRecordStatus.UNFILLED]: { label: "未填写", variant: "outline" },
}

// 本地筛选器状态类型
interface LocalFilters {
  organization: string;
  department: string;
  category: string;
  project: string;
  subProject: string;
  fundType: string;
  status: string;
}

export default function PredictV2Page() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("pending")
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set())
  const [withdrawalRecord, setWithdrawalRecord] = useState<string | null>(null)
  const [withdrawalReason, setWithdrawalReason] = useState("")
  const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] = useState(false)
  const [isCreateRecordsDialogOpen, setIsCreateRecordsDialogOpen] = useState(false)
  const [submitRecord, setSubmitRecord] = useState<string | null>(null)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [isBatchSubmitDialogOpen, setIsBatchSubmitDialogOpen] = useState(false)
  const { user, isLoading: userLoading } = useCurrentUser()
  const isAdmin = user?.role === Role.ADMIN
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [filters, setFilters] = useState<LocalFilters>({
    organization: "all",
    department: "all",
    category: "all",
    project: "all",
    subProject: "all",
    fundType: "all",
    status: "all",
  })
  const filterTimeout = useRef<NodeJS.Timeout | null>(null)

  // 使用新的预测填报钩子
  const {
    loading,
    records,
    filters: apiFilters,
    pagination,
    setPagination,
    organizations,
    departments,
    projectCategories,
    projects,
    subProjects,
    fundTypes,
    currentMonth,
    handleFilterChange: apiHandleFilterChange,
    handlePageChange,
    handleReset,
    fetchRecords,
    requestWithdrawal,
    getProjectsByCategory,
    getSubProjectsByProject,
    getAllFundTypes
  } = useFundingPredictV2()

  // 分离待处理和已处理的记录
  const pendingRecords = useMemo(() => {
    // 记录一下状态枚举值，以便调试
    console.log('状态枚举值:', {
      DRAFT: RecordStatus.DRAFT,
      SUBMITTED: RecordStatus.SUBMITTED,
      PENDING_WITHDRAWAL: RecordStatus.PENDING_WITHDRAWAL,
      APPROVED: ExtendedRecordStatus.APPROVED,
      REJECTED: ExtendedRecordStatus.REJECTED,
      UNFILLED: ExtendedRecordStatus.UNFILLED
    });
    
    return records.filter(r => {
      // 确保比较时不区分大小写
      const recordStatus = r.status.toLowerCase();
      
      return recordStatus === RecordStatus.DRAFT.toLowerCase() || 
             recordStatus === ExtendedRecordStatus.REJECTED.toLowerCase() ||
             recordStatus === ExtendedRecordStatus.UNFILLED.toLowerCase();
    });
  }, [records]);
  
  const processedRecords = useMemo(() => {
    return records.filter(r => {
      // 确保比较时不区分大小写
      const recordStatus = r.status.toLowerCase();
      
      return recordStatus === RecordStatus.SUBMITTED.toLowerCase() || 
             recordStatus === ExtendedRecordStatus.APPROVED.toLowerCase() || 
             recordStatus === RecordStatus.PENDING_WITHDRAWAL.toLowerCase();
    });
  }, [records]);

  // 处理选中记录变化
  const handleRecordSelection = useCallback((recordId: string) => {
    setSelectedRecords(prev => {
      const newSelection = new Set(prev)
      if (newSelection.has(recordId)) {
        newSelection.delete(recordId)
      } else {
        newSelection.add(recordId)
      }
      return newSelection
    })
  }, [])

  // 处理全选/取消全选
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      const recordsToSelect = activeTab === "pending" ? pendingRecords : processedRecords
      setSelectedRecords(new Set(recordsToSelect.map(r => r.id)))
    } else {
      setSelectedRecords(new Set())
    }
  }, [activeTab, pendingRecords, processedRecords])

  // 处理批量填报
  const handleBatchEdit = useCallback(() => {
    if (selectedRecords.size === 0) {
      toast({
        title: "提示",
        description: "请先选择记录",
      })
      return
    }
    
    // 检查是否所有选中的记录都可编辑（草稿、已拒绝或未填写状态）
    const hasNonEditableRecords = Array.from(selectedRecords).some(id => {
      const record = records.find(r => r.id === id)
      return record && record.status !== RecordStatus.DRAFT && 
             record.status !== ExtendedRecordStatus.REJECTED &&
             record.status !== ExtendedRecordStatus.UNFILLED
    })
    
    if (hasNonEditableRecords) {
      toast({
        title: "警告",
        description: "只有草稿、已拒绝和未填写状态的记录才能编辑",
        variant: "destructive"
      })
      return
    }
    
    // 构建查询参数
    const queryParams = new URLSearchParams()
    
    // 添加记录ID
    Array.from(selectedRecords).forEach(id => {
      queryParams.append("recordIds[]", id)
    })
    
    // 跳转到批量编辑页面
    router.push(`/funding/predict-v2/edit?${queryParams.toString()}`)
  }, [selectedRecords, records, router, toast])

  // 处理批量提交
  const handleBatchSubmitClick = useCallback(() => {
    if (selectedRecords.size === 0) {
      toast({
        title: "提示",
        description: "请先选择记录",
      })
      return
    }
    
    // 检查是否所有选中的记录都可提交（草稿、已拒绝或未填写状态）
    const hasNonSubmittableRecords = Array.from(selectedRecords).some(id => {
      const record = records.find(r => r.id === id)
      return record && record.status !== RecordStatus.DRAFT && 
             record.status !== ExtendedRecordStatus.REJECTED &&
             record.status !== ExtendedRecordStatus.UNFILLED
    })
    
    if (hasNonSubmittableRecords) {
      toast({
        title: "警告",
        description: "只有草稿、已拒绝和未填写状态的记录才能提交",
        variant: "destructive"
      })
      return
    }
    
    // 打开确认对话框
    setIsBatchSubmitDialogOpen(true)
  }, [selectedRecords, records, toast])
  
  const handleBatchSubmit = useCallback(async () => {
    try {
      // 准备要提交的记录
      const recordsToSubmit = Array.from(selectedRecords).map(id => ({ id }))
      
      // 调用API提交记录
      const response = await fetch('/api/funding/predict-v2/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ records: recordsToSubmit })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '批量提交失败')
      }
      
      const result = await response.json()
      
      toast({
        title: "提交成功",
        description: result.message || `成功提交${result.count}条记录`,
      })
      
      // 刷新记录列表
      fetchRecords(true)
      
      // 关闭对话框
      setIsBatchSubmitDialogOpen(false)
      // 清空选中记录
      setSelectedRecords(new Set())
    } catch (error) {
      console.error("批量提交失败", error)
      toast({
        title: "提交失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive"
      })
    }
  }, [selectedRecords, toast, fetchRecords])

  // 处理申请撤回
  const handleWithdrawalRequest = useCallback(async () => {
    if (!withdrawalRecord || !withdrawalReason.trim()) {
      toast({
        title: "提示",
        description: "请填写撤回原因",
      })
      return
    }
    
    const success = await requestWithdrawal(withdrawalRecord, withdrawalReason)
    
    if (success) {
      setWithdrawalRecord(null)
      setWithdrawalReason("")
      setIsWithdrawalDialogOpen(false)
    }
  }, [withdrawalRecord, withdrawalReason, requestWithdrawal, toast])

  // 打开撤回对话框
  const openWithdrawalDialog = useCallback((recordId: string) => {
    setWithdrawalRecord(recordId)
    setWithdrawalReason("")
    setIsWithdrawalDialogOpen(true)
  }, [])

  // 跳转到提交历史页面
  const navigateToHistory = useCallback(() => {
    router.push("/funding/predict-v2/history")
  }, [router])

  // 创建项目-组织关联
  const handleCreateProjectOrgLinks = useCallback(async () => {
    try {
      toast({
        title: "正在处理",
        description: "正在创建项目与组织的关联关系...",
      });
      
      const response = await fetch('/api/admin/create-project-org-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          forceUpdate: true,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API响应错误: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      
      toast({
        title: "操作成功",
        description: `创建了 ${result.created} 个新关联，${result.updated} 个已存在关联被更新`,
        duration: 5000,
      });
      
      // 操作成功后，自动刷新记录列表
      console.log("项目-组织关联创建成功，正在刷新数据...");
      
      // 短暂延迟，确保后端数据已更新
      setTimeout(() => {
        // 刷新记录列表
        fetchRecords(true);
        
        // 如果当前有组织筛选，提示用户
        if (apiFilters.organization && apiFilters.organization !== 'all') {
          const selectedOrg = organizations.find(org => org.id === apiFilters.organization);
          const orgName = selectedOrg ? selectedOrg.name : '所选组织';
          
          toast({
            title: "请重新应用筛选",
            description: `已为项目建立与"${orgName}"的关联关系，请点击"筛选"按钮查看结果`,
            variant: "default",
            duration: 10000,
          });
        }
      }, 1000);
    } catch (error) {
      console.error("创建项目-组织关联失败", error);
      toast({
        title: "操作失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    }
  }, [toast, fetchRecords, apiFilters, organizations]);

  // 打开提交确认对话框
  const openSubmitDialog = useCallback((recordId: string) => {
    setSubmitRecord(recordId)
    setIsSubmitDialogOpen(true)
  }, [])

  // 处理单条记录提交
  const handleSingleSubmit = useCallback(async () => {
    if (!submitRecord) return
    
    try {
      // 调用API提交预测
      const response = await fetch(`/api/funding/predict-v2/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: [{ id: submitRecord }]
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "提交失败");
      }
      
      // 显示成功提示
      toast({
        title: "提交成功",
        description: "记录已成功提交",
      });
      
      // 刷新页面
      fetchRecords(true);
      
      // 关闭对话框
      setIsSubmitDialogOpen(false)
      setSubmitRecord(null)
    } catch (error) {
      console.error("提交失败", error);
      toast({
        title: "提交失败",
        description: error instanceof Error ? error.message : "提交失败",
        variant: "destructive"
      });
    }
  }, [submitRecord, toast, fetchRecords])

  // 渲染记录表格
  const renderRecordsTable = useCallback((recordsToRender: typeof records) => {
    const isAllSelected = recordsToRender.length > 0 && 
      recordsToRender.every(r => selectedRecords.has(r.id))
    
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </TableHead>
              <TableHead>项目</TableHead>
              <TableHead>子项目</TableHead>
              <TableHead>资金需求类型</TableHead>
              <TableHead>年月</TableHead>
              <TableHead>金额</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>备注</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recordsToRender.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              recordsToRender.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300"
                      checked={selectedRecords.has(record.id)}
                      onChange={() => handleRecordSelection(record.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">
                        {record.detailedFundNeed?.organization?.name || '未知机构'} - 
                        {record.detailedFundNeed?.department?.name || '未知部门'} - 
                        {record.detailedFundNeed?.subProject?.project?.category?.name || '未知类型'}
                      </span>
                      <span className="font-medium">
                        {record.detailedFundNeed?.subProject?.project?.name || '未知项目'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {record.detailedFundNeed?.subProject?.name || '未知子项目'}
                  </TableCell>
                  <TableCell>{record.detailedFundNeed?.fundType?.name || '-'}</TableCell>
                  <TableCell>{`${record.year}年${record.month}月`}</TableCell>
                  <TableCell>
                    {record.amount !== null 
                      ? new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(record.amount) 
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusMap[record.status.toLowerCase()]?.variant || "default"}>
                      {statusMap[record.status.toLowerCase()]?.label || record.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={record.remark || ""}>
                    {record.remark || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {record.status.toLowerCase() === RecordStatus.DRAFT.toLowerCase() || 
                     record.status.toLowerCase() === ExtendedRecordStatus.REJECTED.toLowerCase() || 
                     record.status.toLowerCase() === ExtendedRecordStatus.UNFILLED.toLowerCase() ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/funding/predict-v2/edit?recordIds[]=${record.id}`)}
                          className="h-8 px-2 py-0"
                        >
                          <FileEdit className="h-4 w-4 mr-1" />
                          填报
                        </Button>
                        {record.status.toLowerCase() === RecordStatus.DRAFT.toLowerCase() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openSubmitDialog(record.id)}
                            className="h-8 px-2 py-0"
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            提交
                          </Button>
                        )}
                      </div>
                    ) : record.status.toLowerCase() === RecordStatus.SUBMITTED.toLowerCase() ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/funding/predict-v2/detail/${record.id}`)}
                          className="h-8 px-2 py-0"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          查看
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openWithdrawalDialog(record.id)}
                          className="h-8 px-2 py-0"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          撤回
                        </Button>
                      </div>
                    ) : record.status.toLowerCase() === RecordStatus.PENDING_WITHDRAWAL.toLowerCase() ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/funding/predict-v2/detail/${record.id}`)}
                          className="h-8 px-2 py-0"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          查看
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            try {
                              // 调用API取消撤回
                              const response = await fetch(`/api/funding/predict-v2/cancel-withdrawal/${record.id}`, {
                                method: "POST",
                                headers: {
                                  "Content-Type": "application/json",
                                }
                              });
                              
                              if (!response.ok) {
                                const errorData = await response.json();
                                throw new Error(errorData.error || "取消撤回失败");
                              }
                              
                              // 显示成功提示
                              toast({
                                title: "取消撤回成功",
                                description: "已取消撤回申请",
                              });
                              
                              // 刷新页面
                              fetchRecords(true);
                            } catch (error) {
                              console.error("取消撤回失败", error);
                              toast({
                                title: "取消撤回失败",
                                description: error instanceof Error ? error.message : "取消撤回失败",
                                variant: "destructive"
                              });
                            }
                          }}
                          className="h-8 px-2 py-0"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          取消撤回
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/funding/predict-v2/detail/${record.id}`)}
                        className="h-8 px-2 py-0"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        查看
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    )
  }, [selectedRecords, handleRecordSelection, handleSelectAll, router, openWithdrawalDialog, openSubmitDialog])

  // 渲染分页控件
  const renderPagination = useCallback(() => {
    return (
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          共 {pagination.total} 条记录，第 {pagination.page} / {pagination.totalPages} 页
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(1)}
            disabled={pagination.page <= 1}
          >
            首页
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            上一页
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
          >
            下一页
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.totalPages)}
            disabled={pagination.page >= pagination.totalPages}
          >
            末页
          </Button>
          <Select
            value={pagination.pageSize.toString()}
            onValueChange={(value) => {
              // 更新每页显示数量
              const newPageSize = parseInt(value);
              setPagination((prev: typeof pagination) => ({ ...prev, pageSize: newPageSize, page: 1 }));
              
              // 取消之前的请求
              if (fetchTimeoutRef.current) {
                clearTimeout(fetchTimeoutRef.current);
              }
              
              // 设置新的延迟请求
              fetchTimeoutRef.current = setTimeout(() => {
                fetchRecords(true);
              }, 300);
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="每页显示" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 条/页</SelectItem>
              <SelectItem value="20">20 条/页</SelectItem>
              <SelectItem value="50">50 条/页</SelectItem>
              <SelectItem value="100">100 条/页</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }, [pagination, handlePageChange])

  // 检查组织筛选条件
  const checkOrganizationFilter = useCallback(() => {
    if (apiFilters.organization && apiFilters.organization !== 'all') {
      const selectedOrg = organizations.find(org => org.id === apiFilters.organization);
      const orgName = selectedOrg ? selectedOrg.name : '所选组织';
      
      toast({
        title: "提示",
        description: `当前正在查看 ${orgName} 的记录`,
      })
    }
  }, [apiFilters.organization, organizations, toast])

  // 处理筛选条件变更
  const handleFilterChange = useCallback((newFilters: LocalFilters) => {
    // 清除之前的超时
    if (filterTimeout.current) {
      clearTimeout(filterTimeout.current);
    }

    // 更新本地状态
    setFilters(newFilters);

    // 设置超时，防止频繁更新
    filterTimeout.current = setTimeout(() => {
      // 遍历所有筛选条件并逐个更新
      Object.entries(newFilters).forEach(([key, value]) => {
        // 状态筛选直接使用原始值，不做额外处理
        if (key === 'status') {
          console.log(`应用状态筛选: ${value}`);
          apiHandleFilterChange(key as keyof ProjectFilters, value);
        } 
        // 处理项目分类筛选器
        else if (key === 'category') {
          apiHandleFilterChange('category', value);
          
          // 如果选择了特定分类，更新项目列表
          if (value !== 'all') {
            const categoryProjects = getProjectsByCategory(value);
            console.log(`更新项目分类 ${value} 的项目列表: ${categoryProjects.length}`);
          }
        }
        // 处理项目筛选器 
        else if (key === 'project') {
          apiHandleFilterChange('project', value);
          
          // 如果选择了特定项目，更新子项目列表
          if (value !== 'all') {
            const projectSubProjects = getSubProjectsByProject(value);
            console.log(`更新项目 ${value} 的子项目列表: ${projectSubProjects.length}`);
          }
        }
        else {
          apiHandleFilterChange(key as keyof ProjectFilters, value);
        }
      });
    }, 300);
  }, [apiHandleFilterChange, getProjectsByCategory, getSubProjectsByProject]);

  // 重置筛选条件
  const handleResetFilters = useCallback(() => {
    const initialFilters: LocalFilters = {
      organization: "all",
      department: "all",
      category: "all",
      project: "all",
      subProject: "all",
      fundType: "all",
      status: "all",
    }
    
    setFilters(initialFilters)
    handleReset()
  }, [handleReset])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <SimplePageHeader 
          title="资金需求预测填报 V2" 
          description={`当前填报月份: ${currentMonth.label}`} 
        />
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => setIsCreateRecordsDialogOpen(true)}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            创建填报记录
          </Button>
          <Button
            variant="outline"
            onClick={navigateToHistory}
          >
            <HistoryIcon className="h-4 w-4 mr-2" />
            提交历史
          </Button>
        </div>
      </div>
      
      <FilterCard
        filters={filters}
        organizations={organizations}
        departments={departments}
        categories={projectCategories}
        projects={projects}
        subProjects={subProjects}
        fundTypes={fundTypes}
        loading={loading}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        onSearch={() => fetchRecords(true)}
      />
      
      <Card>
        <CardHeader className="p-4 pb-0">
          <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="pending">
                  待处理
                  {pendingRecords.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {pagination.total > 0 && activeTab === "pending" ? pagination.total : pendingRecords.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="processed">
                  已处理
                  {processedRecords.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {pagination.total > 0 && activeTab === "processed" ? pagination.total : processedRecords.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => fetchRecords(true)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  刷新
                </Button>
              </div>
            </div>
            
            <TabsContent value="pending" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <CardTitle>待处理记录</CardTitle>
                <ActionButtonsGroup
                  onEdit={handleBatchEdit}
                  onSubmit={handleBatchSubmitClick}
                  editDisabled={selectedRecords.size === 0}
                  submitDisabled={selectedRecords.size === 0}
                />
              </div>
              
              <ScrollArea className="h-[calc(100vh-400px)]">
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <p>加载中...</p>
                  </div>
                ) : (
                  renderRecordsTable(pendingRecords)
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="processed" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <CardTitle>已处理记录</CardTitle>
              </div>
              
              <ScrollArea className="h-[calc(100vh-400px)]">
                {loading ? (
                  <div className="flex justify-center items-center h-32">
                    <p>加载中...</p>
                  </div>
                ) : (
                  renderRecordsTable(processedRecords)
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardHeader>
        
        <CardContent className="p-4">
          {renderPagination()}
        </CardContent>
      </Card>
      
      {/* 批量提交确认对话框 */}
      <Dialog open={isBatchSubmitDialogOpen} onOpenChange={setIsBatchSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认批量提交</DialogTitle>
            <DialogDescription>
              提交后记录将不能再修改。确定要提交选中的 {selectedRecords.size} 条记录吗？
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBatchSubmitDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleBatchSubmit}
            >
              确认提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 提交确认对话框 */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认提交</DialogTitle>
            <DialogDescription>
              提交后记录将不能再修改。确定要提交吗？
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsSubmitDialogOpen(false)
                setSubmitRecord(null)
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleSingleSubmit}
            >
              确认提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 撤回对话框 */}
      <Dialog open={isWithdrawalDialogOpen} onOpenChange={setIsWithdrawalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>申请撤回</DialogTitle>
            <DialogDescription>
              请填写撤回原因
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="请输入撤回原因"
              value={withdrawalReason}
              onChange={(e) => setWithdrawalReason(e.target.value)}
            />
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsWithdrawalDialogOpen(false)
                setWithdrawalReason("")
              }}
            >
              取消
            </Button>
            <Button
              onClick={handleWithdrawalRequest}
            >
              提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 创建填报记录对话框 */}
      <CreateRecordsDialog
        open={isCreateRecordsDialogOpen}
        setOpen={setIsCreateRecordsDialogOpen}
        onSuccess={() => fetchRecords(true)}
      />
    </div>
  )
} 