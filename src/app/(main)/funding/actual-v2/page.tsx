"use client"

import { useState, useCallback, useMemo } from "react"
import { DataTable } from "@/components/ui/data-table"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { SimplePageHeader } from "@/components/funding/simple-page-header"
import { SimpleFilterCard } from "@/components/funding/simple-filter-card"
import { ActionButtons } from "@/components/funding/action-buttons"
import { groupProjects, isProjectEditable, isProjectSubmittable } from "@/lib/funding-utils"
import { RecordStatus } from "@/lib/enums"
import { useFundingActualV2, ActualUserRecord } from "@/hooks/use-funding-actual-v2"

// 扩展RecordStatus枚举，添加APPROVED、REJECTED和UNFILLED状态
const ExtendedRecordStatus = {
  ...RecordStatus,
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  UNFILLED: "UNFILLED"
}

// 定义状态映射
const statusMap = {
  [ExtendedRecordStatus.DRAFT]: { label: "草稿", variant: "outline" as const },
  [ExtendedRecordStatus.UNFILLED]: { label: "未填写", variant: "outline" as const },
  [ExtendedRecordStatus.SUBMITTED]: { label: "已提交", variant: "default" as const },
  [ExtendedRecordStatus.PENDING_WITHDRAWAL]: { label: "待撤回", variant: "warning" as const },
  [ExtendedRecordStatus.APPROVED]: { label: "已批准", variant: "success" as const },
  [ExtendedRecordStatus.REJECTED]: { label: "已拒绝", variant: "destructive" as const },
}

// 定义表格列
const columns = [
  {
    accessorKey: "organizationName",
    header: "机构",
  },
  {
    accessorKey: "projectName",
    header: "项目",
  },
  {
    accessorKey: "subProjectName",
    header: "子项目",
  },
  {
    accessorKey: "amount",
    header: "金额",
    cell: ({ row }: any) => {
      const amount = parseFloat(row.getValue("amount") || 0)
      return new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "CNY",
      }).format(amount)
    },
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({ row }: any) => {
      const status = row.getValue("status") as string
      const statusInfo = statusMap[status] || { label: status, variant: "outline" as const }
      
      return (
        <div className="flex items-center">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${statusInfo.variant}-100 text-${statusInfo.variant}-800`}
          >
            {statusInfo.label}
          </span>
        </div>
      )
    },
  },
]

export default function ActualV2Page() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  // 使用实际资金V2钩子
  const {
    loading,
    projects,
    filters,
    handleFilterChange,
    handleReset,
    organizations,
    departments,
    currentMonth,
    fetchProjects,
    debouncedFetch,
    batchSubmitProjects
  } = useFundingActualV2()

  // 将获取到的项目数据按机构和项目分组
  const groupedProjects = useMemo(() => {
    // 这里我们需要将ActualUserRecord转换为BaseProject格式
    const baseProjects = projects.map(project => ({
      id: project.id,
      projectId: project.projectId,
      organization: project.organizationName,
      department: project.departmentName,
      project: project.projectName,
      subProjectId: project.subProjectId,
      subProjectName: project.subProjectName,
      amount: project.amount,
      status: project.status,
      year: project.year,
      month: project.month
    }));
    
    return groupProjects(baseProjects);
  }, [projects]);

  // 处理选中项目变化
  const handleSelectedRowsChange = useCallback((selectedRowIds: Set<string>) => {
    // 过滤出非分组标题行的ID
    const nonGroupRowIds = Array.from(selectedRowIds).filter(id => {
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
        id: originalItem.id,
        projectId: originalItem.projectId,
        subProjectId: originalItem.subProjectId,
        status: originalItem.status
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
    
    // 添加记录ID
    selectedItems.forEach((item) => {
      if (item && item.id) {
        queryParams.append(`recordIds[]`, item.id);
      }
    });
    
    // 添加年月参数
    queryParams.append("year", currentMonth.year.toString());
    queryParams.append("month", currentMonth.month.toString());
    
    // 跳转到批量编辑页面
    router.push(`/funding/actual-v2/edit?${queryParams.toString()}`);
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
      item && item.status === ExtendedRecordStatus.UNFILLED
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
      
      // 调用批量提交函数
      const recordIds = selectedItems.map(item => item?.id).filter(Boolean) as string[];
      const success = await batchSubmitProjects(recordIds);
      
      if (success) {
        // 清空选中项目
        setSelectedProjects([]);
      }
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
  }, [selectedProjects, batchSubmitProjects, toast, getSelectedItems]);

  // 检查是否可以编辑选中的项目
  const canEditSelected = useMemo(() => {
    return !selectedProjects.some(id => {
      const project = projects.find(p => p.id === id)
      return project && !isProjectEditable(project.status)
    })
  }, [selectedProjects, projects])

  // 检查是否可以提交选中的项目
  const canSubmitSelected = useMemo(() => {
    return !selectedProjects.some(id => {
      const project = projects.find(p => p.id === id)
      return project && !isProjectSubmittable(project.status)
    })
  }, [selectedProjects, projects])

  return (
    <div className="space-y-6">
      <SimplePageHeader 
        title="实际支付填报 (V2)"
        loading={loading}
        onRefresh={() => fetchProjects(true)}
      />
      
      <SimpleFilterCard
        filters={filters}
        organizations={organizations}
        departments={departments}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
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