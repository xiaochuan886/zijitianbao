"use client"

import { useState, useCallback, useMemo } from "react"
import { DataTable } from "@/components/ui/data-table"
import { columns, Prediction } from "./columns"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { useFundingCommon } from "@/hooks/use-funding-common"
import { PageHeader } from "@/components/funding/page-header"
import { FilterCard } from "@/components/funding/filter-card"
import { ActionButtons } from "@/components/funding/action-buttons"
import { groupProjects, isProjectEditable, isProjectSubmittable } from "@/lib/funding-utils"

export default function ActualPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

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
    apiEndpoint: 'actual'
  })

  // 将获取到的项目数据按机构和项目分组
  const groupedProjects = useMemo(() => {
    return groupProjects(projects)
  }, [projects])

  // 处理选中项目变化
  const handleSelectedRowsChange = useCallback((selectedRowIds: string[]) => {
    // 过滤出非分组标题行的ID
    const nonGroupRowIds = selectedRowIds.filter(id => {
      const item = groupedProjects.find(p => p.id === id);
      return item && !('isGroupHeader' in item && item.isGroupHeader);
    });
    
    setSelectedProjects(nonGroupRowIds);
  }, [groupedProjects]);

  // 获取选中的项目信息
  const getSelectedItems = useCallback(() => {
    return selectedProjects.map(id => {
      const originalItem = projects.find(p => p.id === id);
      if (!originalItem) return null;
      
      return {
        projectId: originalItem.projectId,
        subProjectId: originalItem.subProjectId,
        status: originalItem.actualUserStatus
      };
    }).filter(Boolean);
  }, [selectedProjects, projects]);

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
    const selectedItems = getSelectedItems();
    
    // 检查是否所有选中的项目都可编辑（草稿或未填写状态）
    const hasNonEditableProjects = selectedItems.some(item => 
      item && !isProjectEditable(item.status)
    );
    
    if (hasNonEditableProjects) {
      toast({
        title: "警告",
        description: "只有草稿和未填写状态的子项目才能编辑",
        variant: "destructive"
      })
      return
    }
    
    // 构建查询参数
    const queryParams = new URLSearchParams();
    
    // 添加项目和子项目ID
    selectedItems.forEach((item) => {
      if (item && item.projectId && item.subProjectId) {
        queryParams.append(`projectIds[]`, item.projectId);
        queryParams.append(`subProjectIds[]`, item.subProjectId);
      }
    });
    
    // 添加年月参数
    queryParams.append("year", currentMonth.year.toString());
    queryParams.append("month", currentMonth.month.toString());
    
    // 跳转到批量编辑页面
    router.push(`/funding/actual/edit?${queryParams.toString()}`);
  }, [selectedProjects, router, toast, currentMonth, getSelectedItems]);

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
    const selectedItems = getSelectedItems();
    
    // 检查是否有未填写的项目
    const hasUnfilledProjects = selectedItems.some(item => 
      item && item.status === "未填写"
    );
    
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
      const response = await fetch("/api/funding/actual/batch-submit", {
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
    return !selectedProjects.some(id => {
      const project = projects.find(p => p.id === id)
      return project && !isProjectEditable(project.actualUserStatus)
    })
  }, [selectedProjects, projects])

  // 检查是否可以提交选中的项目
  const canSubmitSelected = useMemo(() => {
    return !selectedProjects.some(id => {
      const project = projects.find(p => p.id === id)
      return project && !isProjectSubmittable(project.actualUserStatus)
    })
  }, [selectedProjects, projects])

  return (
    <div className="space-y-6">
      <PageHeader 
        title="实际支付填报"
        loading={loading}
        onRefresh={() => fetchProjects(true)}
      />
      
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
      
      <DataTable
        columns={columns as any}
        data={groupedProjects}
        loading={loading}
        onSelectedRowsChange={handleSelectedRowsChange}
        isGroupRow={(row) => row.isGroupHeader === true}
        groupId={(row) => row.groupId}
      />
      
      <ActionButtons
        selectedCount={selectedProjects.length}
        loading={loading}
        submitting={submitting}
        canEdit={canEditSelected}
        canSubmit={canSubmitSelected}
        onEdit={handleBatchEdit}
        onSubmit={handleBatchSubmit}
      />
    </div>
  )
}

