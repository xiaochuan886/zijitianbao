"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
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
  ArrowLeft,
  Check,
  Clock,
  AlertCircle
} from "lucide-react"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer"
import { DateRangeFilter } from "@/components/funding/date-range-filter"
import { 
  HistoryTableView, 
  HistoryRecord 
} from "@/components/funding/history-table-view"
import { 
  HistoryGroupedView, 
  processGroupedData, 
  getMonthColumns 
} from "@/components/funding/history-grouped-view"
import { useMediaQuery } from "@/hooks/use-media-query"
import { Combobox, ComboboxOption } from "@/components/ui/combobox"
import { FilterCard } from "@/components/funding/filter-card"
import { CreateWithdrawalRequestButton } from "@/components/create-withdrawal-request-button"
import { CancelWithdrawalRequestButton } from "@/components/cancel-withdrawal-request-button"

// 筛选器类型
interface Filters {
  organization: string;
  department: string;
  category: string;
  project: string;
  subProject: string;
  fundType: string;
  status: string;
}

// 状态选项
const statusOptions = [
  { id: "all", name: "全部状态" },
  { id: "DRAFT", name: "草稿" },
  { id: "SUBMITTED", name: "已提交" },
  { id: "APPROVED", name: "已审核" },
  { id: "REJECTED", name: "已拒绝" },
  { id: "UNFILLED", name: "未填写" }
];

// 获取状态图标
const getStatusIcon = (status: string) => {
  switch (status) {
    case "DRAFT":
      return <FileEdit className="h-4 w-4" />;
    case "SUBMITTED":
      return <Upload className="h-4 w-4" />;
    case "APPROVED":
      return <Check className="h-4 w-4" />;
    case "REJECTED":
      return <XCircle className="h-4 w-4" />;
    case "UNFILLED":
      return <Clock className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

// 获取状态变体
const getStatusVariant = (status: string) => {
  switch (status) {
    case "DRAFT":
      return "outline";
    case "SUBMITTED":
      return "secondary";
    case "APPROVED":
      return "default";
    case "REJECTED":
      return "destructive";
    case "UNFILLED":
      return "outline";
    default:
      return "outline";
  }
};

// 日期范围类型
interface DateRange {
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;
}

// 扩展HistoryRecord接口
interface ExtendedHistoryRecord extends HistoryRecord {
  rawStatus?: string;
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

export default function PredictHistoryPageV2() {
  const router = useRouter()
  const { toast } = useToast()
  const isDesktop = useMediaQuery("(min-width: 768px)")
  
  // 视图模式
  const [viewMode, setViewMode] = useState<"table" | "group">("table")
  
  // 记录类型
  const [recordType, setRecordType] = useState<"user" | "fin">("user")
  
  // 筛选器状态
  const [filters, setFilters] = useState<Filters>({
    organization: "all",
    department: "all",
    category: "all",
    project: "all",
    subProject: "all",
    fundType: "all",
    status: "all"
  })
  
  // 日期范围状态
  const getCurrentDateInfo = () => {
    const now = new Date()
    return {
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1
    }
  }
  
  const { currentYear, currentMonth } = getCurrentDateInfo()
  
  // 计算12个月前的日期
  const getStartDate = (year: number, month: number) => {
    let startMonth = month
    let startYear = year
    
    startMonth -= 11 // 减去11个月，加上当前月，总共12个月
    
    if (startMonth <= 0) {
      startMonth += 12
      startYear -= 1
    }
    
    return { startYear, startMonth }
  }
  
  const { startYear: defaultStartYear, startMonth: defaultStartMonth } = getStartDate(currentYear, currentMonth)
  
  const [dateRange, setDateRange] = useState<DateRange>({
    startYear: defaultStartYear,
    startMonth: defaultStartMonth,
    endYear: currentYear,
    endMonth: currentMonth
  })
  
  // 分页状态
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [total, setTotal] = useState<number>(0)
  
  // 数据状态
  const [records, setRecords] = useState<ExtendedHistoryRecord[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  
  // 对话框状态
  const [selectedRecord, setSelectedRecord] = useState<ExtendedHistoryRecord | null>(null)
  const [dialogOpen, setDialogOpen] = useState<boolean>(false)
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState<boolean>(false)
  
  // 选项数据
  const [organizations, setOrganizations] = useState<{ id: string; name: string }[]>([])
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string; categoryId?: string }[]>([])
  const [subProjects, setSubProjects] = useState<{ id: string; name: string; projectId: string }[]>([])
  const [fundTypes, setFundTypes] = useState<{ id: string; name: string }[]>([])
  
  // 获取元数据
  const fetchMetadata = useCallback(async () => {
    try {
      const response = await fetch('/api/funding/actual/meta')
      if (!response.ok) {
        throw new Error('获取元数据失败')
      }
      
      const data = await response.json()
      
      if (data.organizations) {
        setOrganizations(data.organizations)
      }
      
      if (data.departments) {
        setDepartments(data.departments)
      }
      
      if (data.categories) {
        setCategories(data.categories)
      }
      
      if (data.projects) {
        setProjects(data.projects)
      }
      
      if (data.subProjects) {
        setSubProjects(data.subProjects)
      }
      
      if (data.fundTypes) {
        setFundTypes(data.fundTypes)
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "获取元数据失败",
        variant: "destructive"
      })
    }
  }, [toast])
  
  // 处理筛选器变化
  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters)
    setPage(1) // 重置页码
  }
  
  // 格式化金额
  const formatCurrency = (amount: number | null): string => {
    if (amount === null) return "-"
    return amount.toLocaleString("zh-CN", {
      style: "currency",
      currency: "CNY",
      minimumFractionDigits: 2
    })
  }
  
  // 获取历史记录
  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      // 构建查询参数
      const params = new URLSearchParams()
      
      // 添加筛选条件
      if (filters.organization !== "all") params.append("organizationId", filters.organization)
      if (filters.department !== "all") params.append("departmentId", filters.department)
      if (filters.category !== "all") params.append("categoryId", filters.category)
      if (filters.project !== "all") params.append("projectId", filters.project)
      if (filters.subProject !== "all") params.append("subProjectId", filters.subProject)
      if (filters.fundType !== "all") params.append("fundTypeId", filters.fundType)
      if (filters.status !== "all") params.append("status", filters.status)
      
      // 添加日期范围
      params.append("startYear", dateRange.startYear.toString())
      params.append("startMonth", dateRange.startMonth.toString())
      params.append("endYear", dateRange.endYear.toString())
      params.append("endMonth", dateRange.endMonth.toString())
      
      // 添加分页参数
      params.append("page", page.toString())
      params.append("pageSize", pageSize.toString())
      
      // 添加记录类型
      params.append("recordType", recordType)
      
      // 输出日志，便于调试
      console.log("发送请求参数:", {
        filters,
        dateRange,
        page,
        pageSize,
        recordType,
        url: `/api/funding/actual/history?${params.toString()}`
      });
      
      // 发送请求
      const response = await fetch(`/api/funding/actual/history?${params.toString()}`, {
        // 添加缓存控制头，确保不使用缓存
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      if (!response.ok) {
        throw new Error("获取历史记录失败")
      }
      
      const data = await response.json()
      console.log("获取到的数据:", {
        recordsCount: data.records?.length || 0,
        total: data.total || 0,
        firstRecord: data.records?.length > 0 ? {
          id: data.records[0].id,
          year: data.records[0].year,
          month: data.records[0].month
        } : null
      });
      
      // 转换记录格式
      const formattedRecords = data.records?.map((record: any) => ({
        id: record.id,
        organization: record.organization,
        department: record.department,
        category: record.category,
        project: record.project,
        subProject: record.subProject,
        fundType: record.fundType,
        year: record.year,
        month: record.month,
        amount: record.amount,
        status: formatStatus(record.status),
        rawStatus: record.status || record.status,
        submittedAt: record.submittedAt,
        remark: record.remark || "",
        canWithdraw: record.canWithdraw,
      })) || [];
      
      setRecords(formattedRecords)
      setTotal(data.total || 0)
    } catch (error) {
      console.error(error)
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "获取历史记录失败",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [filters, dateRange, page, pageSize, recordType, toast])
  
  // 处理日期范围变化
  const handleDateRangeChange = useCallback((range: DateRange) => {
    console.log("日期范围变化:", range);
    setDateRange(range);
    setPage(1); // 重置页码
    
    // 不再自动调用fetchHistory，由用户点击搜索按钮触发
  }, []);
  
  // 重置筛选器
  const handleResetFilters = useCallback(() => {
    setFilters({
      organization: "all",
      department: "all",
      category: "all",
      project: "all",
      subProject: "all",
      fundType: "all",
      status: "all"
    });
    
    // 重置为最近12个月
    const { currentYear, currentMonth } = getCurrentDateInfo();
    const { startYear: defaultStartYear, startMonth: defaultStartMonth } = getStartDate(currentYear, currentMonth);
    
    setDateRange({
      startYear: defaultStartYear,
      startMonth: defaultStartMonth,
      endYear: currentYear,
      endMonth: currentMonth
    });
    
    setPage(1); // 重置页码
    
    // 重置后自动获取数据
    setTimeout(() => {
      fetchHistory();
    }, 0);
  }, [fetchHistory, getCurrentDateInfo, getStartDate]);
  
  // 处理查看记录
  const handleViewRecord = (record: ExtendedHistoryRecord) => {
    setSelectedRecord(record)
    setDialogOpen(true)
  }
  
  // 处理撤回申请
  const handleWithdrawalRequest = (record: ExtendedHistoryRecord) => {
    setSelectedRecord(record)
    setWithdrawalDialogOpen(true)
  }
  
  // 提交撤回申请
  const handleSubmitWithdrawal = async () => {
    if (!selectedRecord) return
    
    try {
      // 发送撤回请求
      const response = await fetch(`/api/funding/actual/submit/${selectedRecord.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          action: "withdrawal",
          reason: "申请撤回"
        })
      })
      
      if (!response.ok) {
        throw new Error("撤回申请失败")
      }
      
      toast({
        title: "成功",
        description: "撤回申请已提交",
      })
      setWithdrawalDialogOpen(false)
      fetchHistory() // 刷新数据
    } catch (error) {
      console.error(error)
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "撤回申请失败",
        variant: "destructive"
      })
    }
  }
  
  // 处理页码变化
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }
  
  // 计算分组数据
  const groupedHistory = useMemo(() => {
    return processGroupedData(records)
  }, [records])
  
  // 计算月份列
  const monthColumns = useMemo(() => {
    return getMonthColumns(
      dateRange.startYear,
      dateRange.startMonth,
      dateRange.endYear,
      dateRange.endMonth
    )
  }, [dateRange])
  
  // 页面加载时获取数据
  useEffect(() => {
    fetchMetadata();
    // 初始加载数据
    fetchHistory();
  }, [fetchMetadata, fetchHistory]);
  
  // 当视图模式或记录类型改变时，重置页码
  useEffect(() => {
    setPage(1);
  }, [viewMode, recordType]);
  
  // 获取状态中文名称
  const formatStatus = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "草稿";
      case "SUBMITTED":
        return "已提交";
      case "APPROVED":
        return "已审核";
      case "REJECTED":
        return "已拒绝";
      case "UNFILLED":
        return "未填写";
      case "PENDING_WITHDRAWAL":
        return "待撤回";
      default:
        return status;
    }
  };
  
  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/funding/actual")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">实际支出历史记录</h1>
        </div>
        
        {/* 记录类型切换 */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">记录类型:</span>
          <Tabs value={recordType} onValueChange={(value) => setRecordType(value as "user" | "fin")}>
            <TabsList className="grid w-[200px] grid-cols-2">
              <TabsTrigger value="user">用户填报</TabsTrigger>
              <TabsTrigger value="fin">财务填报</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* 筛选器 */}
      <FilterCard
        filters={filters}
        organizations={organizations}
        departments={departments}
        categories={categories}
        projects={projects}
        subProjects={subProjects}
        fundTypes={fundTypes}
        statusOptions={statusOptions}
        loading={loading}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        onSearch={fetchHistory}
        showStatus={true}
      />
      
      {/* 日期范围筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle>日期范围</CardTitle>
        </CardHeader>
        <CardContent>
          <DateRangeFilter
            startYear={dateRange.startYear}
            startMonth={dateRange.startMonth}
            endYear={dateRange.endYear}
            endMonth={dateRange.endMonth}
            onChange={handleDateRangeChange}
            onReset={handleResetFilters}
            onSearch={fetchHistory}
          />
        </CardContent>
      </Card>
      
      {/* 视图切换 */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "table" | "group")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="table">表格视图</TabsTrigger>
          <TabsTrigger value="group">分组视图</TabsTrigger>
        </TabsList>
        
        <Card className="mt-4">
          <CardContent className="p-6">
            <TabsContent value="table" className="mt-0">
              <HistoryTableView
                records={records as ExtendedHistoryRecord[]}
                loading={loading}
                total={total}
                page={page}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onViewRecord={handleViewRecord}
                onWithdrawalRequest={handleViewRecord}
                formatCurrency={formatCurrency}
                hideOperations={true}
              />
            </TabsContent>
            
            <TabsContent value="group" className="mt-0">
              <HistoryGroupedView
                groupedHistory={groupedHistory}
                loading={loading}
                formatCurrency={formatCurrency}
                monthColumns={monthColumns}
                total={total}
                page={page}
                pageSize={pageSize}
                onPageChange={handlePageChange}
              />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
      
      {/* 记录详情对话框 */}
      {isDesktop ? (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>记录详情</DialogTitle>
              <DialogDescription>
                查看填报记录的详细信息
              </DialogDescription>
            </DialogHeader>
            {selectedRecord && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">组织机构</div>
                    <div>{selectedRecord.organization}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">部门</div>
                    <div>{selectedRecord.department}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">项目分类</div>
                    <div>{selectedRecord.category}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">项目</div>
                    <div>{selectedRecord.project}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">子项目</div>
                    <div>{selectedRecord.subProject}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">资金类型</div>
                    <div>{selectedRecord.fundType}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">年份</div>
                    <div>{selectedRecord.year}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">月份</div>
                    <div>{selectedRecord.month}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">金额</div>
                    <div>{formatCurrency(selectedRecord.amount)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">状态</div>
                    <div>
                      <Badge variant={getStatusVariant(selectedRecord.rawStatus || selectedRecord.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(selectedRecord.rawStatus || selectedRecord.status)}
                          {selectedRecord.status}
                        </span>
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">提交时间</div>
                    <div>{new Date(selectedRecord.submittedAt).toLocaleString()}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">备注</div>
                  <div className="p-4 bg-muted rounded-md min-h-[100px]">{selectedRecord.remark || "无"}</div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                关闭
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer open={dialogOpen} onOpenChange={setDialogOpen}>
          <DrawerContent>
            <DrawerHeader className="text-left">
              <DrawerTitle>记录详情</DrawerTitle>
            </DrawerHeader>
            {selectedRecord && (
              <div className="px-4 pb-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">组织机构</div>
                    <div>{selectedRecord.organization}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">部门</div>
                    <div>{selectedRecord.department}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">项目分类</div>
                    <div>{selectedRecord.category}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">项目</div>
                    <div>{selectedRecord.project}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">子项目</div>
                    <div>{selectedRecord.subProject}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">资金类型</div>
                    <div>{selectedRecord.fundType}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">年份</div>
                    <div>{selectedRecord.year}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">月份</div>
                    <div>{selectedRecord.month}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">金额</div>
                    <div>{formatCurrency(selectedRecord.amount)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">状态</div>
                    <div>
                      <Badge variant={getStatusVariant(selectedRecord.rawStatus || selectedRecord.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(selectedRecord.rawStatus || selectedRecord.status)}
                          {selectedRecord.status}
                        </span>
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">提交时间</div>
                    <div>{new Date(selectedRecord.submittedAt).toLocaleString()}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">备注</div>
                  <div className="p-4 bg-muted rounded-md min-h-[100px]">{selectedRecord.remark || "无"}</div>
                </div>
              </div>
            )}
            <DrawerFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                关闭
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  )
} 