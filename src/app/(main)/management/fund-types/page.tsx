"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, Banknote } from "lucide-react"
import { createColumns, FundType } from "./components/columns"
import { FundTypeDialog } from "./components/fund-type-dialog"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import { DataTable } from "@/components/ui/data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

// API响应接口
interface FundTypeListResponse {
  code: number
  message: string
  data: {
    items: FundType[]
    total: number
    totalPages: number
    page: number
    pageSize: number
  }
}

export default function FundTypesPage() {
  const [fundTypes, setFundTypes] = useState<FundType[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedFundType, setSelectedFundType] = useState<FundType | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [fundTypeToDelete, setFundTypeToDelete] = useState<FundType | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalFundTypes: 0,
    totalAssociatedNeeds: 0
  })

  // 获取资金需求类型列表
  const fetchFundTypes = async () => {
    try {
      setLoading(true)
      setStatsLoading(true)
      
      // 通过API客户端获取数据
      const response = await apiClient.fundTypes.list() as FundTypeListResponse
      
      if (response && response.data && Array.isArray(response.data.items)) {
        const items = response.data.items
        setFundTypes(items)
        
        // 计算基础统计数据
        const totalAssociatedNeeds = items.reduce((sum: number, type: FundType) => 
          sum + (type._count?.detailedFundNeeds || 0), 0
        )
        
        setStats({
          totalFundTypes: items.length,
          totalAssociatedNeeds
        })
      } else {
        console.error('API返回的资金需求类型数据格式不正确:', response)
        toast.error("获取数据格式错误")
        setFundTypes([])
      }
    } catch (error) {
      console.error('获取资金需求类型列表失败:', error)
      toast.error(error instanceof Error ? error.message : "获取资金需求类型列表失败")
      setFundTypes([])
    } finally {
      setLoading(false)
      setStatsLoading(false)
    }
  }

  // 删除资金需求类型
  const handleDelete = (fundType: FundType) => {
    setFundTypeToDelete(fundType)
    setDeleteDialogOpen(true)
  }

  // 确认删除
  const confirmDelete = async () => {
    if (!fundTypeToDelete) return
    
    try {
      await apiClient.fundTypes.delete(fundTypeToDelete.id)
      toast.success("资金需求类型已删除")
      fetchFundTypes()
    } catch (error: any) {
      console.error('删除资金需求类型失败:', error)
      toast.error(error.message || "删除失败")
    } finally {
      setDeleteDialogOpen(false)
      setFundTypeToDelete(null)
    }
  }

  // 编辑资金需求类型
  const handleEdit = (fundType: FundType) => {
    setSelectedFundType(fundType)
    setDialogOpen(true)
  }

  // 提交资金需求类型表单
  const handleSubmit = async (data: { name: string }) => {
    try {
      if (selectedFundType) {
        await apiClient.fundTypes.update(selectedFundType.id, data)
        toast.success("资金需求类型信息已更新")
      } else {
        await apiClient.fundTypes.create(data)
        toast.success("新资金需求类型已创建")
      }
      setDialogOpen(false)
      setSelectedFundType(null)
      fetchFundTypes()
    } catch (error: any) {
      console.error('提交资金需求类型信息失败:', error)
      toast.error(error.message || (selectedFundType ? "更新失败" : "创建失败"))
      throw error // 向上传递错误，让表单组件处理
    }
  }

  useEffect(() => {
    fetchFundTypes()
  }, [])

  const tableColumns = createColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  })

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">资金需求类型管理</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          新增类型
        </Button>
      </div>
      
      {/* 统计卡片区域 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              类型总数
            </CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Spinner className="h-6 w-6" /> : stats.totalFundTypes}
            </div>
            <p className="text-xs text-muted-foreground">
              系统中所有资金需求类型的数量
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              关联资金需求数
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Spinner className="h-6 w-6" /> : stats.totalAssociatedNeeds}
            </div>
            <p className="text-xs text-muted-foreground">
              所有资金需求类型关联的资金需求数量
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 数据表格 */}
      <Card>
        <CardHeader>
          <CardTitle>资金需求类型列表</CardTitle>
          <CardDescription>
            管理系统中的所有资金需求类型
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={tableColumns}
            data={fundTypes}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* 编辑/创建对话框 */}
      <FundTypeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        fundType={selectedFundType}
        onSubmit={handleSubmit}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除资金需求类型 "{fundTypeToDelete?.name}" 吗？此操作不可撤销。
              {fundTypeToDelete && fundTypeToDelete._count && fundTypeToDelete._count.detailedFundNeeds > 0 && (
                <p className="mt-2 text-destructive font-semibold">
                  警告：该类型已关联 {fundTypeToDelete._count.detailedFundNeeds} 个资金需求，删除可能会影响相关数据。
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}