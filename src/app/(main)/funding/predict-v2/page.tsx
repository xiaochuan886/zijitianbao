"use client"

import { useState, useCallback, useMemo } from "react"
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
  Upload
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
import { useFundingPredictV2 } from "@/hooks/use-funding-predict-v2"
import { RecordStatus } from "@/lib/enums"
import { Combobox, ComboboxOption } from "@/components/ui/combobox"

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

export default function PredictV2Page() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("pending")
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set())
  const [withdrawalRecord, setWithdrawalRecord] = useState<string | null>(null)
  const [withdrawalReason, setWithdrawalReason] = useState("")
  const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] = useState(false)

  // 使用新的预测填报钩子
  const {
    loading,
    records,
    filters,
    pagination,
    organizations,
    departments,
    projectCategories,
    projects,
    subProjects,
    fundTypes,
    currentMonth,
    handleFilterChange,
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
  const handleBatchSubmit = useCallback(() => {
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
    
    // TODO: 实现批量提交功能
    toast({
      title: "功能开发中",
      description: "批量提交功能正在开发中",
    })
  }, [selectedRecords, records, toast])

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
    router.push("/funding/predict/history")
  }, [router])

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
              <TableHead>资金类型</TableHead>
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
                  <TableCell>{record.subProject.project.name}</TableCell>
                  <TableCell>{record.subProject.name}</TableCell>
                  <TableCell>{record.fundType.name}</TableCell>
                  <TableCell>{`${record.year}年${record.month}月`}</TableCell>
                  <TableCell>
                    {record.amount !== null 
                      ? new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(record.amount) 
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusMap[record.status]?.variant || "default"}>
                      {statusMap[record.status]?.label || record.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={record.remark || ""}>
                    {record.remark || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {record.status === RecordStatus.DRAFT || 
                     record.status === ExtendedRecordStatus.REJECTED || 
                     record.status === ExtendedRecordStatus.UNFILLED ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/funding/predict-v2/edit?recordIds[]=${record.id}`)}
                      >
                        编辑
                      </Button>
                    ) : record.status === RecordStatus.SUBMITTED ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openWithdrawalDialog(record.id)}
                      >
                        申请撤回
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push(`/funding/predict-v2/detail/${record.id}`)}
                      >
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
  }, [selectedRecords, handleRecordSelection, handleSelectAll, router, openWithdrawalDialog])

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
              // TODO: 实现每页显示数量变化
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

  return (
    <div className="space-y-4">
      <SimplePageHeader 
        title="资金需求预测填报 V2" 
        description={`当前填报月份: ${currentMonth.year}年${currentMonth.month}月`}
      />
      
      <SimpleFilterCard>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium">机构</label>
            <Combobox
              options={[
                { value: "all", label: "全部机构" },
                ...organizations.map(org => ({ value: org.id, label: org.name }))
              ]}
              value={filters.organizationId || "all"}
              onChange={(value) => handleFilterChange("organizationId", value)}
              placeholder="选择机构"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">部门</label>
            <Combobox
              options={[
                { value: "all", label: "全部部门" },
                ...departments.map(dept => ({ value: dept.id, label: dept.name }))
              ]}
              value={filters.departmentId || "all"}
              onChange={(value) => handleFilterChange("departmentId", value)}
              placeholder="选择部门"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">项目分类</label>
            <Combobox
              options={[
                { value: "all", label: "全部分类" },
                ...projectCategories.map(category => ({ value: category.id, label: category.name }))
              ]}
              value={filters.projectCategoryId || "all"}
              onChange={(value) => {
                console.log('选择项目分类:', value);
                // 当项目分类变化时，重置项目和子项目的选择
                handleFilterChange("projectCategoryId", value);
                handleFilterChange("projectId", "all");
                handleFilterChange("subProjectId", "all");
              }}
              placeholder="选择项目分类"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">项目</label>
            <Combobox
              options={(() => {
                // 检查是否有项目数据
                if (!projects || projects.length === 0) {
                  console.log('没有可用的项目数据 - 从数据库获取的项目总数: 0');
                  return [
                    { value: "all", label: "暂无项目数据" }
                  ];
                }
                
                // 如果没有选择项目分类或选择了"全部分类"，则显示所有项目
                if (!filters.projectCategoryId || filters.projectCategoryId === 'all') {
                  console.log('显示所有项目，数量:', projects.length);
                  return [
                    { value: "all", label: "全部项目" },
                    ...projects.map(project => ({ 
                      value: project.id, 
                      label: project.name 
                    }))
                  ];
                }
                
                // 尝试获取指定分类下的项目
                const filteredProjects = getProjectsByCategory(filters.projectCategoryId);
                console.log(`分类[${filters.projectCategoryId}]下的项目数量: ${filteredProjects.length}`);
                
                // 如果筛选结果为空，提供友好提示
                if (filteredProjects.length === 0) {
                  return [
                    { value: "all", label: `该分类下暂无项目` }
                  ];
                }
                
                return [
                  { value: "all", label: "全部项目" },
                  ...filteredProjects.map(project => ({ 
                    value: project.id, 
                    label: project.name 
                  }))
                ];
              })()}
              value={filters.projectId || "all"}
              onChange={(value) => {
                console.log('选择项目:', value);
                // 当项目变化时，重置子项目的选择
                handleFilterChange("projectId", value);
                handleFilterChange("subProjectId", "all");
              }}
              placeholder="选择项目"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">子项目</label>
            <Combobox
              options={(() => {
                const subProjectOptions = getSubProjectsByProject(filters.projectId);
                
                // 如果没有子项目数据，提供友好提示
                if (subProjectOptions.length === 0) {
                  return [
                    { value: "all", label: "暂无子项目数据" }
                  ];
                }
                
                return [
                  { value: "all", label: "全部子项目" },
                  ...subProjectOptions.map(subProject => ({ 
                    value: subProject.id, 
                    label: subProject.name 
                  }))
                ];
              })()}
              value={filters.subProjectId || "all"}
              onChange={(value) => handleFilterChange("subProjectId", value)}
              placeholder="选择子项目"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">资金类型</label>
            <Combobox
              options={[
                { value: "all", label: "全部资金类型" },
                ...getAllFundTypes().map(fundType => ({ value: fundType.id, label: fundType.name }))
              ]}
              value={filters.fundTypeId || "all"}
              onChange={(value) => handleFilterChange("fundTypeId", value)}
              placeholder="选择资金类型"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">状态</label>
            <Combobox
              options={[
                { value: "all", label: "全部状态" },
                { value: RecordStatus.DRAFT, label: "草稿" },
                { value: RecordStatus.SUBMITTED, label: "已提交" },
                { value: RecordStatus.PENDING_WITHDRAWAL, label: "待撤回" },
                { value: ExtendedRecordStatus.APPROVED, label: "已审核" },
                { value: ExtendedRecordStatus.REJECTED, label: "已拒绝" },
                { value: ExtendedRecordStatus.UNFILLED, label: "未填写" }
              ]}
              value={filters.status || "all"}
              onChange={(value) => {
                console.log(`选择状态: ${value}, 显示文本: ${statusMap[value]?.label || value}`);
                // 确保状态值始终是小写的
                if (value !== 'all') {
                  const statusValue = value.toLowerCase();
                  console.log(`将状态值标准化为小写: ${statusValue}`);
                  handleFilterChange("status", statusValue);
                } else {
                  handleFilterChange("status", value);
                }
              }}
              placeholder="选择状态"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            重置
          </Button>
          <Button onClick={() => fetchRecords(true)}>
            <Filter className="h-4 w-4 mr-2" />
            筛选
          </Button>
        </div>
      </SimpleFilterCard>
      
      <Card>
        <CardHeader className="p-4 pb-0">
          <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
            <div className="flex justify-between items-center">
              <TabsList>
                <TabsTrigger value="pending">待处理</TabsTrigger>
                <TabsTrigger value="processed">已处理</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => fetchRecords(true)}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  刷新
                </Button>
                <Button variant="outline" size="sm" onClick={navigateToHistory}>
                  <HistoryIcon className="h-4 w-4 mr-2" />
                  提交历史
                </Button>
              </div>
            </div>
            
            <TabsContent value="pending" className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <CardTitle>待处理记录</CardTitle>
                <ActionButtonsGroup
                  onEdit={handleBatchEdit}
                  onSubmit={handleBatchSubmit}
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
      
      {/* 撤回申请对话框 */}
      <Dialog open={isWithdrawalDialogOpen} onOpenChange={setIsWithdrawalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>申请撤回</DialogTitle>
            <DialogDescription>
              请填写撤回原因，管理员审核通过后将允许重新编辑该记录。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">撤回原因</label>
              <Textarea
                placeholder="请填写撤回原因..."
                value={withdrawalReason}
                onChange={(e) => setWithdrawalReason(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWithdrawalDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleWithdrawalRequest}>
              提交申请
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 