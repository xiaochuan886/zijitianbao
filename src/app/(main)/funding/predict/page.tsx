"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { HistoryIcon, PlusIcon, Filter, RefreshCw, RotateCcw } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { FilterCard } from "@/components/funding/filter-card"
import { ActionButtons } from "@/components/funding/action-buttons"
import { columns as predictionColumns, Prediction } from "./columns"
import { useFundingCommon } from "@/hooks/use-funding-common"
import { 
  groupProjects, 
  isProjectEditable, 
  isProjectSubmittable 
} from "@/lib/funding-utils"

export default function PredictPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("pending")
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 使用通用的资金管理钩子
  const {
    loading: isLoading,
    projects,
    filters,
    setFilters,
    handleFilterChange,
    handleReset,
    organizations,
    departments,
    categories,
    currentMonth,
    fetchProjects: refreshProjects,
    batchSubmitProjects
  } = useFundingCommon<Prediction>('predict')

  // 分离待提交和已撤回的项目
  const pendingProjects = useMemo(() => {
    return projects.filter(p => 
      p.status === "未填写" || 
      p.status === "草稿" || 
      p.status === "unfilled" || 
      p.status === "draft" ||
      p.predictUserStatus === "pending" || 
      !p.predictUserStatus
    )
  }, [projects])
  
  const withdrawnProjects = useMemo(() => {
    return projects.filter(p => 
      p.status === "pending_withdrawal" || 
      p.status === "已提交" || 
      p.status === "submitted" ||
      p.predictUserStatus === "withdrawn"
    )
  }, [projects])

  // 将获取到的项目数据按机构和项目分组
  const groupedPendingProjects = useMemo(() => {
    // 直接使用API返回的扁平化列表，不需要再次分组
    return pendingProjects;
  }, [pendingProjects])

  const groupedWithdrawnProjects = useMemo(() => {
    // 直接使用API返回的扁平化列表，不需要再次分组
    return withdrawnProjects;
  }, [withdrawnProjects])

  // 处理选中项目变化
  const handleSelectedRowsChange = useCallback((selectedRowIds: Set<string>) => {
    setSelectedProjects(selectedRowIds)
  }, [])

  // 获取选中的项目信息
  const getSelectedItems = useCallback(() => {
    return Array.from(selectedProjects).map(id => {
      const project = projects.find(p => p.id === id)
      return {
        projectId: project?.projectId || project?.id || "",
        subProjectId: project?.subProjectId || project?.id,
        status: project?.status || project?.predictUserStatus
      }
    }).filter(Boolean)
  }, [selectedProjects, projects])

  // 处理批量填报
  const handleBatchEdit = useCallback(() => {
    if (selectedProjects.size === 0) {
      toast({
        title: "提示",
        description: "请先选择子项目",
      })
      return
    }
    
    // 收集选中项目的信息
    const selectedItems = getSelectedItems()
    
    // 检查是否所有选中的项目都可编辑（草稿或未填写状态）
    const hasNonEditableProjects = selectedItems.some(item => 
      item && !isProjectEditable(item.status)
    )
    
    if (hasNonEditableProjects) {
      toast({
        title: "警告",
        description: "只有草稿和未填写状态的子项目才能编辑",
        variant: "destructive"
      })
      return
    }
    
    // 构建查询参数
    const queryParams = new URLSearchParams()
    
    // 添加项目和子项目ID
    selectedItems.forEach((item) => {
      if (item && item.projectId && item.subProjectId) {
        queryParams.append(`projectIds[]`, item.projectId)
        queryParams.append(`subProjectIds[]`, item.subProjectId)
      }
    })
    
    // 添加年月参数
    queryParams.append("year", currentMonth.year.toString())
    queryParams.append("month", currentMonth.month.toString())
    
    // 跳转到批量编辑页面
    router.push(`/funding/predict/edit?${queryParams.toString()}`)
  }, [selectedProjects, router, toast, currentMonth, getSelectedItems])

  // 处理批量提交
  const handleBatchSubmit = useCallback(async () => {
    if (selectedProjects.size === 0) {
      toast({
        title: "提示",
        description: "请先选择子项目",
      })
      return
    }
    
    // 收集选中项目的信息
    const selectedItems = getSelectedItems()
    
    // 检查是否有未填写的项目
    const hasUnfilledProjects = selectedItems.some(item => 
      item && (item.status === "未填写" || item.status === "unfilled")
    )
    
    if (hasUnfilledProjects) {
      toast({
        title: "警告",
        description: "选中的子项目中包含未填写的项目，请先填报后再提交",
        variant: "destructive"
      })
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // 提取项目ID和子项目ID
      const projectIds = selectedItems.map(item => item?.projectId).filter(Boolean) as string[]
      const subProjectIds = selectedItems.map(item => item?.subProjectId).filter(Boolean) as string[]
      
      // 调用批量提交函数
      const success = await batchSubmitProjects(projectIds, subProjectIds)
      
      if (success) {
        // 清空选中项目
        setSelectedProjects(new Set())
      }
    } catch (error) {
      console.error("批量提交失败", error)
      toast({
        title: "提交失败",
        description: error instanceof Error ? error.message : "批量提交失败",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedProjects, batchSubmitProjects, toast, getSelectedItems])

  // 重置筛选条件
  const handleResetFilters = useCallback(() => {
    // 使用钩子提供的handleReset函数
    handleReset();
  }, [handleReset]);

  // 处理搜索
  const handleSearch = useCallback(() => {
    refreshProjects(true)
  }, [refreshProjects])

  // 检查是否可以编辑选中的项目
  const canSelectedProjectsBeEdited = useCallback(() => {
    const projectList = activeTab === "pending" ? pendingProjects : withdrawnProjects
    return !Array.from(selectedProjects).some(id => {
      const project = projectList.find(p => p.id === id)
      return project && !isProjectEditable(project.status || project.predictUserStatus)
    })
  }, [selectedProjects, activeTab, pendingProjects, withdrawnProjects])

  // 检查是否可以提交选中的项目
  const canSelectedProjectsBeSubmitted = useCallback(() => {
    const projectList = activeTab === "pending" ? pendingProjects : withdrawnProjects
    return !Array.from(selectedProjects).some(id => {
      const project = projectList.find(p => p.id === id)
      return project && !isProjectSubmittable(project.status || project.predictUserStatus)
    })
  }, [selectedProjects, activeTab, pendingProjects, withdrawnProjects])

  // 当切换tab时，清空选中的项目
  useEffect(() => {
    setSelectedProjects(new Set())
  }, [activeTab])

  // 跳转到提交历史页面
  const navigateToHistory = useCallback(() => {
    router.push("/funding/predict/history")
  }, [router])

  // 渲染待提交项目Tab内容
  const renderPendingTab = useCallback(() => {
    return (
      <>
        <div className="flex justify-between items-center mb-4">
          <CardTitle>待提交项目</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refreshProjects(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
            <Button variant="outline" size="sm" onClick={navigateToHistory}>
              <HistoryIcon className="h-4 w-4 mr-2" />
              提交历史
            </Button>
          </div>
        </div>
        
        <FilterCard
          filters={filters}
          organizations={organizations}
          departments={departments}
          categories={categories}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          onSearch={handleSearch}
          loading={isLoading}
          debouncedFetch={true}
        />
        
        <div className="mt-4">
          <DataTable
            // @ts-ignore - 忽略类型错误
            columns={predictionColumns}
            // @ts-ignore - 忽略类型错误
            data={groupedPendingProjects}
            loading={isLoading}
            onSelectedRowsChange={handleSelectedRowsChange}
            isGroupRow={(row) => row.isGroupHeader === true}
            groupId={(row) => row.groupId}
          />
        </div>
        
        <ActionButtons
          selectedCount={selectedProjects.size}
          loading={isLoading}
          submitting={isSubmitting}
          canEdit={canSelectedProjectsBeEdited()}
          canSubmit={canSelectedProjectsBeSubmitted()}
          onEdit={handleBatchEdit}
          onSubmit={handleBatchSubmit}
        />
      </>
    )
  }, [
    groupedPendingProjects, 
    isLoading, 
    selectedProjects, 
    canSelectedProjectsBeEdited, 
    canSelectedProjectsBeSubmitted, 
    isSubmitting, 
    refreshProjects,
    filters,
    organizations,
    departments,
    categories,
    handleFilterChange,
    handleResetFilters,
    handleSearch,
    handleSelectedRowsChange,
    handleBatchEdit,
    handleBatchSubmit,
    navigateToHistory
  ])

  // 渲染已撤回项目Tab内容
  const renderWithdrawnTab = useCallback(() => {
    return (
      <>
        <div className="flex justify-between items-center mb-4">
          <CardTitle>已撤回项目</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refreshProjects(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
          </div>
        </div>
        
        <FilterCard
          filters={filters}
          organizations={organizations}
          departments={departments}
          categories={categories}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          onSearch={handleSearch}
          loading={isLoading}
          debouncedFetch={true}
        />
        
        <div className="mt-4">
          <DataTable
            // @ts-ignore - 忽略类型错误
            columns={predictionColumns}
            // @ts-ignore - 忽略类型错误
            data={groupedWithdrawnProjects}
            loading={isLoading}
            onSelectedRowsChange={handleSelectedRowsChange}
            isGroupRow={(row) => row.isGroupHeader === true}
            groupId={(row) => row.groupId}
          />
        </div>
      </>
    )
  }, [
    groupedWithdrawnProjects, 
    isLoading, 
    handleSelectedRowsChange,
    refreshProjects,
    filters,
    organizations,
    departments,
    categories,
    handleFilterChange,
    handleResetFilters,
    handleSearch
  ])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">资金需求预测填报</h1>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3">
            {`预测月份: ${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}`}
          </Badge>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="pending" className="relative">
            待提交项目
            {pendingProjects.length > 0 && (
              <Badge className="ml-2 bg-primary text-primary-foreground">
                {pendingProjects.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="withdrawn" className="relative">
            已撤回项目
            {withdrawnProjects.length > 0 && (
              <Badge className="ml-2 bg-primary text-primary-foreground">
                {withdrawnProjects.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <Card className="mt-4">
          <CardContent className="p-6">
            <TabsContent value="pending" className="mt-0">
              {renderPendingTab()}
            </TabsContent>
            
            <TabsContent value="withdrawn" className="mt-0">
              {renderWithdrawnTab()}
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}

