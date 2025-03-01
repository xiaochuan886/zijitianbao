"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
import { Save, Upload, ArrowLeft } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useFundingActual } from "@/hooks/use-funding-actual"

export default function ActualEditPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // 获取角色参数，默认为user
  const role = searchParams.get('role') || 'user'
  const isUserRole = role === 'user'
  
  // 使用自定义Hook管理状态和逻辑
  const {
    loading,
    saving,
    submitting,
    projects,
    records,
    remarks,
    hasChanges,
    nextMonth,
    handleInputChange,
    handleRemarkChange,
    calculateYearTotal,
    saveChanges,
    submitProject,
    fetchProjectData,
    formatCurrency
  } = useFundingActual(isUserRole)
  
  // 获取项目数据
  const fetchData = useCallback(async () => {
    // 获取查询参数
    const ids = searchParams.get("ids")
    const id = searchParams.get("id")
    const year = searchParams.get("year") || new Date().getFullYear().toString()
    const month = searchParams.get("month") || (new Date().getMonth() + 2).toString()
    
    // 使用Hook中的方法获取数据
    const result = await fetchProjectData({
      id,
      ids,
      year,
      month,
      role
    })
    
    if (!result) {
      router.push("/funding/actual")
    }
  }, [searchParams, fetchProjectData, router, role])
  
  // 提交处理
  const handleSubmit = useCallback(async () => {
    try {
      const result = await submitProject()
      if (result) {
        // 返回列表页
        router.push("/funding/actual")
      }
    } catch (error) {
      // 错误已在Hook中处理
      console.error("提交失败", error)
    }
  }, [submitProject, router])
  
  // 初始化
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/funding/actual")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">实际支付填报 ({isUserRole ? "填报人视图" : "财务视图"})</h1>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={saveChanges}
            disabled={saving || !hasChanges}
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "保存中..." : "保存"}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={submitting}>
                <Upload className="mr-2 h-4 w-4" />
                {submitting ? "提交中..." : "提交"}
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
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-8">加载中...</div>
      ) : (
        projects.map(project => (
          <Card key={project.id} className="overflow-hidden">
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
                      <TableHead>子项目</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead className="text-right">预测金额</TableHead>
                      <TableHead className="text-right">{isUserRole ? "实际金额" : "财务金额"}</TableHead>
                      <TableHead className="text-right">年度累计</TableHead>
                      <TableHead>备注</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.subProjects.map((subProject) => (
                      subProject.fundTypes.map((fundType) => {
                        // 获取当前月所有记录
                        const currentMonthRecords = fundType.records.filter(
                          r => r.year === nextMonth.year && r.month === nextMonth.month
                        )
                        
                        // 如果没有当月记录，使用临时ID
                        const recordId = currentMonthRecords.length > 0 
                          ? currentMonthRecords[0].id 
                          : `temp-${subProject.id}-${fundType.id}-${nextMonth.year}-${nextMonth.month}`
                        
                        return (
                          <TableRow key={`${subProject.id}-${fundType.id}`}>
                            <TableCell>{subProject.name}</TableCell>
                            <TableCell>{fundType.name}</TableCell>
                            <TableCell className="text-right">
                              {currentMonthRecords.length > 0 && currentMonthRecords[0].predicted !== null
                                ? formatCurrency(currentMonthRecords[0].predicted)
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                value={records[recordId] === null ? "" : records[recordId]}
                                onChange={(e) => handleInputChange(recordId, e.target.value)}
                                placeholder="输入金额"
                                className="text-right"
                              />
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(calculateYearTotal(subProject.id, fundType.id, nextMonth.year))}
                            </TableCell>
                            <TableCell>
                              <Textarea
                                value={remarks[recordId] || ""}
                                onChange={(e) => handleRemarkChange(recordId, e.target.value)}
                                placeholder="输入备注"
                                className="min-h-[60px]"
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}