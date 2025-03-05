"use client"

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
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
  XCircle,
  Wrench,
  Plus,
  History
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
import Link from "next/link"
import { CreateWithdrawalRequestButton } from "@/components/create-withdrawal-request-button"
import { CancelWithdrawalRequestButton } from "@/components/cancel-withdrawal-request-button"
import { cn } from "@/lib/utils"
import { RecordDetailDialog } from "@/components/record-detail-dialog"

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
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  )
}

// 状态标签组件
interface StatusTabsProps {
  statusCounts: Record<string, number>;
  activeStatus: string | null;
  onStatusChange: (status: string | null) => void;
}

const StatusTabs: React.FC<StatusTabsProps> = ({ statusCounts, activeStatus, onStatusChange }) => {
  // 状态显示名称映射
  const statusDisplayNames: Record<string, string> = {
    "unfilled": "未填写",
    "draft": "草稿",
    "submitted": "已提交",
    "approved": "已审批",
    "rejected": "已拒绝",
    "pending_withdrawal": "待撤回",
    "withdrawn": "已撤回"
  };
  
  // 状态颜色映射
  const statusColors: Record<string, string> = {
    "unfilled": "bg-gray-200 text-gray-800",
    "draft": "bg-blue-100 text-blue-800",
    "submitted": "bg-yellow-100 text-yellow-800",
    "approved": "bg-green-100 text-green-800",
    "rejected": "bg-red-100 text-red-800",
    "pending_withdrawal": "bg-purple-100 text-purple-800",
    "withdrawn": "bg-orange-100 text-orange-800"
  };
  
  // 计算总记录数
  const totalCount = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
  
  // 按照指定顺序排序状态
  const statusOrder = ["unfilled", "draft", "submitted", "approved", "rejected", "pending_withdrawal", "withdrawn"];
  const sortedStatuses = Object.keys(statusCounts).sort((a, b) => {
    const indexA = statusOrder.indexOf(a.toLowerCase());
    const indexB = statusOrder.indexOf(b.toLowerCase());
    return indexA - indexB;
  });
  
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Badge 
        variant="outline" 
        className={`cursor-pointer text-sm py-1 px-3 ${!activeStatus ? 'bg-primary/20 text-primary' : 'hover:bg-primary/10'}`}
        onClick={() => onStatusChange(null)}
      >
        全部 ({totalCount})
      </Badge>
      
      {sortedStatuses.map(status => {
        const count = statusCounts[status] || 0;
        if (count === 0) return null;
        
        const statusKey = status.toLowerCase();
        const displayName = statusDisplayNames[statusKey] || status;
        const colorClass = statusColors[statusKey] || "bg-gray-100 text-gray-800";
        const isActive = activeStatus === statusKey;
        
        return (
          <Badge 
            key={status}
            variant="outline"
            className={`cursor-pointer text-sm py-1 px-3 ${isActive ? 'ring-2 ring-primary/50 ' + colorClass : colorClass + ' hover:ring-1 hover:ring-primary/30'}`}
            onClick={() => onStatusChange(statusKey)}
          >
            {displayName} ({count})
          </Badge>
        );
      })}
    </div>
  );
};

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
  [RecordStatus.PENDING_WITHDRAWAL]: { label: "撤回审核中", variant: "secondary" },
  [ExtendedRecordStatus.APPROVED]: { label: "已审核通过", variant: "default" },
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
}

export default function PredictV2Page() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set())
  const [isCreateRecordsDialogOpen, setIsCreateRecordsDialogOpen] = useState(false)
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
  })
  const filterTimeout = useRef<NodeJS.Timeout | null>(null)
  const [activeStatus, setActiveStatus] = useState<string | null>(null)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [selectedRecord, setSelectedRecord] = useState<typeof records[0] | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [withdrawalConfigs, setWithdrawalConfigs] = useState<Record<string, string[]>>({});

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
    handlePageChange: apiHandlePageChange,
    handleReset,
    fetchRecords,
    getProjectsByCategory,
    getSubProjectsByProject,
    getAllFundTypes,
    handleMonthChange: apiHandleMonthChange,
    fetchStatusStats,
    filterRecordsByStatus,
  } = useFundingPredictV2()

  // 获取状态统计数据
  const loadStatusStats = useCallback(async () => {
    const stats = await fetchStatusStats();
    setStatusCounts(stats);
  }, [fetchStatusStats]);
  
  // 初始加载和筛选条件变化时获取状态统计
  useEffect(() => {
    loadStatusStats();
  }, [loadStatusStats, filters, currentMonth]);

  // 处理状态标签点击
  const handleStatusChange = useCallback((status: string | null) => {
    setActiveStatus(status);
    
    // 使用API筛选记录
    if (status) {
      console.log(`使用API筛选状态: ${status}`);
      filterRecordsByStatus(status);
    } else {
      console.log('重置状态筛选，获取所有记录');
      fetchRecords(true);
    }
  }, [filterRecordsByStatus, fetchRecords]);

  // 处理分页变化，保持状态筛选
  const handlePageChange = useCallback((newPage: number) => {
    if (activeStatus) {
      // 如果有状态筛选，使用状态筛选API并传递页码
      const params = new URLSearchParams();
      params.append("year", currentMonth.year.toString());
      params.append("month", currentMonth.month.toString());
      params.append("page", newPage.toString());
      params.append("pageSize", pagination.pageSize.toString());
      params.append("status", activeStatus);
      
      // 添加其他筛选条件
      Object.entries(apiFilters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          const paramKey = key === 'organization' ? 'organizationId' :
                          key === 'department' ? 'departmentId' :
                          key === 'category' ? 'categoryId' :
                          key === 'project' ? 'projectId' :
                          key === 'subProject' ? 'subProjectId' :
                          key === 'fundType' ? 'fundTypeId' : key;
          params.append(paramKey, value);
        }
      });
      
      // 更新分页状态
      setPagination(prev => ({ ...prev, page: newPage }));
      
      // 取消之前的请求
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      // 设置新的延迟请求，使用filterRecordsByStatus函数处理分页
      fetchTimeoutRef.current = setTimeout(() => {
        // 构建查询参数
        const queryParams = new URLSearchParams();
        queryParams.append("year", currentMonth.year.toString());
        queryParams.append("month", currentMonth.month.toString());
        queryParams.append("page", newPage.toString());
        queryParams.append("pageSize", pagination.pageSize.toString());
        queryParams.append("status", activeStatus);
        
        // 添加其他筛选条件
        Object.entries(apiFilters).forEach(([key, value]) => {
          if (value && value !== 'all') {
            const paramKey = key === 'organization' ? 'organizationId' :
                            key === 'department' ? 'departmentId' :
                            key === 'category' ? 'categoryId' :
                            key === 'project' ? 'projectId' :
                            key === 'subProject' ? 'subProjectId' :
                            key === 'fundType' ? 'fundTypeId' : key;
            queryParams.append(paramKey, value);
          }
        });
        
        // 使用filterRecordsByStatus函数，但传递页码参数
        filterRecordsByStatus(activeStatus, newPage);
      }, 300);
    } else {
      // 如果没有状态筛选，使用默认分页方法
      apiHandlePageChange(newPage);
    }
  }, [activeStatus, currentMonth, pagination.pageSize, apiFilters, setPagination, toast, apiHandlePageChange, filterRecordsByStatus]);

  // 处理查看记录详情
  const handleViewRecord = useCallback((record: typeof records[0]) => {
    setSelectedRecord(record);
    setIsDetailDialogOpen(true);
  }, []);

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
      setSelectedRecords(new Set(records.map(r => r.id)))
    } else {
      setSelectedRecords(new Set())
    }
  }, [records])

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
      return record && record.status.toLowerCase() !== RecordStatus.DRAFT.toLowerCase() && 
             record.status.toLowerCase() !== ExtendedRecordStatus.REJECTED.toLowerCase() &&
             record.status.toLowerCase() !== ExtendedRecordStatus.UNFILLED.toLowerCase()
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

  // 添加一个函数来获取撤回配置
  const fetchWithdrawalConfigs = useCallback(async () => {
    try {
      const response = await fetch('/api/withdrawal-config');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const configs: Record<string, string[]> = {};
          data.data.forEach((config: any) => {
            // 将状态值转换为小写，确保比较时不区分大小写
            const allowedStatuses = JSON.parse(config.allowedStatuses).map((status: string) => status.toLowerCase());
            configs[config.moduleType] = allowedStatuses;
          });
          console.log('获取到的撤回配置:', configs);
          setWithdrawalConfigs(configs);
        }
      }
    } catch (error) {
      console.error('获取撤回配置失败:', error);
    }
  }, []);

  // 在 useEffect 中调用获取撤回配置的函数
  useEffect(() => {
    fetchWithdrawalConfigs();
  }, [fetchWithdrawalConfigs]);

  // 添加一个函数来检查记录是否可以撤回
  const canWithdraw = useCallback((record: typeof records[0]) => {
    const predictConfig = withdrawalConfigs['predict'] || [];
    const recordStatus = record.status.toLowerCase();
    console.log('检查记录是否可以撤回:', {
      recordId: record.id,
      recordStatus,
      allowedStatuses: predictConfig,
      canWithdraw: predictConfig.includes(recordStatus)
    });
    return predictConfig.includes(recordStatus);
  }, [withdrawalConfigs]);

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
                    <div className="flex items-center justify-end gap-2">
                      {/* 撤回按钮 - 只有符合 WithdrawalConfig 表 allowedStatuses 设置的记录显示 */}
                      {canWithdraw(record) && (
                        <CreateWithdrawalRequestButton
                          recordId={record.id}
                          recordType="predict"
                          onSuccess={() => {
                            fetchRecords(true);
                            loadStatusStats();
                          }}
                        />
                      )}
                      
                      {/* 取消撤回按钮 - 只有状态为 PENDING_WITHDRAWAL 的记录显示 */}
                      {record.status.toLowerCase() === RecordStatus.PENDING_WITHDRAWAL.toLowerCase() && (
                        <CancelWithdrawalRequestButton
                          recordId={record.id}
                          recordType="predict"
                          onSuccess={() => {
                            fetchRecords(true);
                            loadStatusStats();
                          }}
                        />
                      )}
                      
                      {/* 填报按钮 - 只有状态为 UNFILLED、DRAFT、APPROVED 的记录显示 */}
                      {(record.status.toLowerCase() === ExtendedRecordStatus.UNFILLED.toLowerCase() || 
                        record.status.toLowerCase() === RecordStatus.DRAFT.toLowerCase() || 
                        record.status.toLowerCase() === ExtendedRecordStatus.APPROVED.toLowerCase()) && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/funding/predict-v2/edit?recordIds[]=${record.id}`)}
                          className="h-8 px-2 py-0"
                        >
                          <FileEdit className="h-4 w-4 mr-1" />
                          填报
                        </Button>
                      )}
                      
                      {/* 查看按钮 - 所有状态都显示 */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewRecord(record)}
                        className="h-8 px-2 py-0"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        查看
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    )
  }, [selectedRecords, handleRecordSelection, handleSelectAll, router, fetchRecords, loadStatusStats, handleViewRecord, canWithdraw])

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
                if (activeStatus) {
                  // 如果有状态筛选，使用状态筛选API
                  filterRecordsByStatus(activeStatus);
                } else {
                  // 否则使用默认方法
                  fetchRecords(true);
                }
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
  }, [pagination, handlePageChange, setPagination, activeStatus, filterRecordsByStatus, fetchRecords])

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
      // 处理项目分类筛选器
      if (newFilters.category !== filters.category) {
        apiHandleFilterChange('category', newFilters.category);
        
        // 如果选择了特定分类，更新项目列表
        if (newFilters.category !== 'all') {
          const categoryProjects = getProjectsByCategory(newFilters.category);
          console.log(`更新项目分类 ${newFilters.category} 的项目列表: ${categoryProjects.length} 个项目`);
          
          // 如果当前选择的项目不在这个分类下，重置项目选择
          if (newFilters.project !== 'all') {
            const projectInCategory = categoryProjects.some(p => p.id === newFilters.project);
            if (!projectInCategory) {
              newFilters.project = 'all';
              newFilters.subProject = 'all';
              console.log('重置项目和子项目选择，因为当前项目不在所选分类下');
            }
          }
        }
      }
      
      // 处理项目筛选器
      if (newFilters.project !== filters.project) {
        apiHandleFilterChange('project', newFilters.project);
        
        // 如果选择了特定项目，更新子项目列表
        if (newFilters.project !== 'all') {
          const projectSubProjects = getSubProjectsByProject(newFilters.project);
          console.log(`更新项目 ${newFilters.project} 的子项目列表: ${projectSubProjects.length} 个子项目`);
          
          // 如果当前选择的子项目不属于这个项目，重置子项目选择
          if (newFilters.subProject !== 'all') {
            const subProjectInProject = projectSubProjects.some(sp => sp.id === newFilters.subProject);
            if (!subProjectInProject) {
              newFilters.subProject = 'all';
              console.log('重置子项目选择，因为当前子项目不属于所选项目');
            }
          }
        }
      }
      
      // 处理其他筛选条件
      Object.entries(newFilters).forEach(([key, value]) => {
        if (key !== 'category' && key !== 'project') {
          apiHandleFilterChange(key as keyof ProjectFilters, value);
        }
      });
      
      // 添加延迟后刷新数据
      setTimeout(() => {
        fetchRecords(true);
      }, 100);
    }, 300);
  }, [apiHandleFilterChange, getProjectsByCategory, getSubProjectsByProject, fetchRecords, filters]);

  // 重置筛选条件
  const handleResetFilters = useCallback(() => {
    const initialFilters: LocalFilters = {
      organization: "all",
      department: "all",
      category: "all",
      project: "all",
      subProject: "all",
      fundType: "all",
    }
    
    setFilters(initialFilters)
    handleReset()
  }, [handleReset])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <SimplePageHeader 
          title="资金需求预测填报 V2" 
          description={`当前填报月份: ${currentMonth.year}年${currentMonth.month}月`}
        />
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={navigateToHistory}
            className="whitespace-nowrap"
          >
            <History className="h-4 w-4 mr-2" />
            提交历史
          </Button>
        </div>
      </div>
      
      <SimpleFilterCard>
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
      </SimpleFilterCard>
      
      <Card>
        <CardContent className="p-4">
          <StatusTabs 
            statusCounts={statusCounts} 
            activeStatus={activeStatus} 
            onStatusChange={handleStatusChange} 
          />
        </CardContent>
      </Card>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleBatchEdit}
            disabled={selectedRecords.size === 0}
            className="whitespace-nowrap"
          >
            <FileEdit className="h-4 w-4 mr-2" />
            批量填报
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchRecords(true)}
            disabled={loading}
          >
            <RotateCcw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>
      
      {renderRecordsTable(records)}
      {renderPagination()}
      
      <CreateRecordsDialog 
        open={isCreateRecordsDialogOpen} 
        setOpen={setIsCreateRecordsDialogOpen}
        onSuccess={() => fetchRecords(true)}
      />
      
      {/* 记录详情对话框 */}
      <RecordDetailDialog 
        record={selectedRecord} 
        open={isDetailDialogOpen} 
        onOpenChange={setIsDetailDialogOpen} 
      />
    </div>
  )
} 