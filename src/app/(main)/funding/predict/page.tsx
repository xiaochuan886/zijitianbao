"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { HistoryIcon, PlusIcon, Filter, RefreshCw } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { FilterCard } from "@/components/funding/filter-card"
import { ActionButtons } from "@/components/funding/action-buttons"
import { columns, Prediction } from "./columns"
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
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [pendingProjects, setPendingProjects] = useState<Prediction[]>([])
  const [withdrawnProjects, setWithdrawnProjects] = useState<Prediction[]>([])

  // 使用通用的资金管理钩子
  const {
    loading,
    debouncedFetch,
    projects,
    filters,
    handleFilterChange,
    organizations,
    departments,
    currentMonth,
    fetchProjects
  } = useFundingCommon<Prediction>({
    apiEndpoint: 'predict'
  })

  // 分离待提交和已撤回的项目
  useEffect(() => {
    if (!projects.length) return

    // 待提交项目(包括未填写、草稿状态)
    const pending = projects.filter(p => 
      p.predictUserStatus === "UNFILLED" || 
      p.predictUserStatus === "DRAFT" || 
      !p.predictUserStatus
    )
    
    // 已撤回项目(包括审核通过撤回、审核拒绝、待审核状态)
    const withdrawn = projects.filter(p => 
      p.predictUserStatus === "APPROVED" || 
      p.predictUserStatus === "REJECTED" || 
      p.predictUserStatus === "PENDING_WITHDRAWAL"
    )
    
    setPendingProjects(pending)
    setWithdrawnProjects(withdrawn)
  }, [projects])

  // 将获取到的项目数据按机构和项目分组
  const groupedPendingProjects = useMemo(() => {
    return groupProjects(pendingProjects)
  }, [pendingProjects])

  const groupedWithdrawnProjects = useMemo(() => {
    return groupProjects(withdrawnProjects)
  }, [withdrawnProjects])

  // 处理选中项目变化
  const handleSelectedRowsChange = useCallback((selectedRowIds: string[]) => {
    // 过滤出非分组标题行的ID
    const projectList = activeTab === "pending" ? pendingProjects : withdrawnProjects
    const nonGroupRowIds = selectedRowIds.filter(id => {
      const item = projectList.find(p => p.id === id)
      return item && !('isGroupHeader' in item && item.isGroupHeader)
    })
    
    setSelectedProjects(nonGroupRowIds)
  }, [activeTab, pendingProjects, withdrawnProjects])

  // 获取选中的项目信息
  const getSelectedItems = useCallback(() => {
    const projectList = activeTab === "pending" ? pendingProjects : withdrawnProjects
    return selectedProjects.map(id => {
      const originalItem = projectList.find(p => p.id === id)
      if (!originalItem) return null
      
      return {
        projectId: originalItem.projectId,
        subProjectId: originalItem.subProjectId,
        status: originalItem.predictUserStatus
      }
    }).filter(Boolean)
  }, [selectedProjects, activeTab, pendingProjects, withdrawnProjects])

  // 处理批量填报
  const handleBatchEdit = useCallback(() => {
    if (selectedProjects.length === 0) {
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
    if (selectedProjects.length === 0) {
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
      item && item.status === "UNFILLED"
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
      setSubmitting(true)
      
      // 显示正在提交提示
      const submittingToast = toast({
        title: "提交中",
        description: `正在提交 ${selectedProjects.length} 个子项目，请稍候...`,
      })
      
      // 调用API批量提交
      const response = await fetch("/api/funding/predict/batch-submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: selectedItems,
          year: currentMonth.year,
          month: currentMonth.month,
        }),
      })
      
      // 关闭提交中的提示
      submittingToast.dismiss()
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "批量提交失败")
      }
      
      const result = await response.json()
      
      // 显示成功提示
      toast({
        title: "提交成功",
        description: `已成功提交 ${result.count} 个项目`,
      })
      
      // 刷新项目列表
      fetchProjects(true)
    } catch (error) {
      console.error("批量提交失败", error)
      toast({
        title: "提交失败",
        description: error instanceof Error ? error.message : "批量提交失败",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }, [selectedProjects, currentMonth, fetchProjects, toast, getSelectedItems])

  // 重置筛选条件
  const handleResetFilters = useCallback(() => {
    const resetFilters = {
      organization: "all",
      department: "all",
      project: "",
      status: "all"
    }
    handleFilterChange(resetFilters)
  }, [handleFilterChange])

  // 检查是否可以编辑选中的项目
  const canEditSelected = useMemo(() => {
    const projectList = activeTab === "pending" ? pendingProjects : withdrawnProjects
    return !selectedProjects.some(id => {
      const project = projectList.find(p => p.id === id)
      return project && !isProjectEditable(project.predictUserStatus)
    })
  }, [selectedProjects, activeTab, pendingProjects, withdrawnProjects])

  // 检查是否可以提交选中的项目
  const canSubmitSelected = useMemo(() => {
    const projectList = activeTab === "pending" ? pendingProjects : withdrawnProjects
    return !selectedProjects.some(id => {
      const project = projectList.find(p => p.id === id)
      return project && !isProjectSubmittable(project.predictUserStatus)
    })
  }, [selectedProjects, activeTab, pendingProjects, withdrawnProjects])

  // 当切换tab时，清空选中的项目
  useEffect(() => {
    setSelectedProjects([])
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
            <Button variant="outline" size="sm" onClick={() => fetchProjects(true)}>
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
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          onSearch={() => fetchProjects(true)}
          loading={loading}
          debouncedFetch={debouncedFetch}
        />
        
        <div className="mt-4">
          <DataTable
            columns={columns}
            data={groupedPendingProjects}
            loading={loading}
            onSelectedRowsChange={handleSelectedRowsChange}
            isGroupRow={(row) => row.isGroupHeader === true}
            groupId={(row) => row.groupId}
          />
        </div>
        
        <ActionButtons
          selectedCount={selectedProjects.length}
          loading={loading}
          submitting={submitting}
          canEdit={canEditSelected}
          canSubmit={canSubmitSelected}
          onEdit={handleBatchEdit}
          onSubmit={handleBatchSubmit}
        />
      </>
    )
  }, [
    groupedPendingProjects, 
    loading, 
    selectedProjects, 
    canEditSelected, 
    canSubmitSelected, 
    submitting, 
    fetchProjects,
    filters,
    organizations,
    departments,
    handleFilterChange,
    handleResetFilters,
    debouncedFetch,
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
            <Button variant="outline" size="sm" onClick={() => fetchProjects(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
          </div>
        </div>
        
        <FilterCard
          filters={filters}
          organizations={organizations}
          departments={departments}
          onFilterChange={handleFilterChange}
          onReset={handleResetFilters}
          onSearch={() => fetchProjects(true)}
          loading={loading}
          debouncedFetch={debouncedFetch}
        />
        
        <div className="mt-4">
          <DataTable
            columns={columns}
            data={groupedWithdrawnProjects}
            loading={loading}
            onSelectedRowsChange={handleSelectedRowsChange}
            isGroupRow={(row) => row.isGroupHeader === true}
            groupId={(row) => row.groupId}
          />
        </div>
        
        <ActionButtons
          selectedCount={selectedProjects.length}
          loading={loading}
          submitting={submitting}
          canEdit={canEditSelected}
          canSubmit={canSubmitSelected}
          onEdit={handleBatchEdit}
          onSubmit={handleBatchSubmit}
          showSubmitButton={false}
        />
      </>
    )
  }, [
    groupedWithdrawnProjects, 
    loading, 
    selectedProjects, 
    canEditSelected, 
    canSubmitSelected, 
    submitting, 
    fetchProjects,
    filters,
    organizations,
    departments,
    handleFilterChange,
    handleResetFilters,
    debouncedFetch,
    handleSelectedRowsChange,
    handleBatchEdit,
    handleBatchSubmit
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

