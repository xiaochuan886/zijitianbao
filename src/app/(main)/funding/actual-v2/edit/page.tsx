"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SimplePageHeader } from "@/components/funding/simple-page-header"
import { Loader2, Save, Send, AlertTriangle } from "lucide-react"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ActualRecord {
  id: string
  projectId: string
  subProjectId: string
  projectName: string
  subProjectName: string
  organizationName: string
  departmentName: string
  amount: number
  status: string
  year: number
  month: number
  remark?: string
  createdAt: string
  updatedAt: string
}

export default function ActualV2EditPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  // 获取查询参数
  const recordIds = searchParams.getAll("recordIds[]")
  const year = searchParams.get("year")
  const month = searchParams.get("month")
  
  // 状态管理
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [records, setRecords] = useState<ActualRecord[]>([])
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [nextAction, setNextAction] = useState<"back" | "submit" | null>(null)
  
  // 获取记录详情
  const fetchRecords = useCallback(async () => {
    if (!recordIds.length || !year || !month) {
      toast({
        title: "参数错误",
        description: "缺少必要的参数",
        variant: "destructive"
      })
      router.push("/funding/actual-v2")
      return
    }
    
    try {
      setLoading(true)
      
      // 模拟从API获取数据
      // 实际项目中应该调用真实的API
      const mockData: ActualRecord[] = recordIds.map((id, index) => ({
        id,
        projectId: `project-${index}`,
        subProjectId: `subproject-${index}`,
        projectName: `项目 ${index + 1}`,
        subProjectName: `子项目 ${index + 1}`,
        organizationName: "测试机构",
        departmentName: "测试部门",
        amount: 0,
        status: "DRAFT",
        year: parseInt(year),
        month: parseInt(month),
        remark: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }))
      
      setRecords(mockData)
    } catch (error) {
      console.error("获取记录详情失败", error)
      toast({
        title: "获取记录详情失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [recordIds, year, month, toast, router])
  
  // 初始化时获取记录详情
  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])
  
  // 处理金额变化
  const handleAmountChange = useCallback((id: string, value: string) => {
    setRecords(prev => prev.map(record => {
      if (record.id === id) {
        // 移除非数字字符，保留数字和小数点
        const cleanedValue = value.replace(/[^\d.]/g, "")
        // 确保只有一个小数点
        const parts = cleanedValue.split(".")
        const formattedValue = parts[0] + (parts.length > 1 ? "." + parts[1] : "")
        
        return {
          ...record,
          amount: formattedValue === "" ? 0 : parseFloat(formattedValue)
        }
      }
      return record
    }))
    setHasChanges(true)
  }, [])
  
  // 处理备注变化
  const handleRemarkChange = useCallback((id: string, value: string) => {
    setRecords(prev => prev.map(record => {
      if (record.id === id) {
        return {
          ...record,
          remark: value
        }
      }
      return record
    }))
    setHasChanges(true)
  }, [])
  
  // 保存记录
  const saveRecords = useCallback(async () => {
    try {
      setSaving(true)
      
      // 模拟API调用
      // 实际项目中应该调用真实的API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "保存成功",
        description: `已成功保存 ${records.length} 条记录`
      })
      
      setHasChanges(false)
    } catch (error) {
      console.error("保存记录失败", error)
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }, [records, toast])
  
  // 提交记录
  const submitRecords = useCallback(async () => {
    try {
      setSubmitting(true)
      
      // 先保存记录
      await saveRecords()
      
      // 模拟API调用
      // 实际项目中应该调用真实的API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "提交成功",
        description: `已成功提交 ${records.length} 条记录`
      })
      
      // 提交成功后返回列表页
      router.push("/funding/actual-v2")
    } catch (error) {
      console.error("提交记录失败", error)
      toast({
        title: "提交失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }, [records, saveRecords, toast, router])
  
  // 处理返回
  const handleBack = useCallback(() => {
    if (hasChanges) {
      setNextAction("back")
      setShowUnsavedDialog(true)
    } else {
      router.push("/funding/actual-v2")
    }
  }, [hasChanges, router])
  
  // 处理提交
  const handleSubmit = useCallback(() => {
    if (hasChanges) {
      setNextAction("submit")
      setShowUnsavedDialog(true)
    } else {
      submitRecords()
    }
  }, [hasChanges, submitRecords])
  
  // 处理对话框确认
  const handleDialogConfirm = useCallback(() => {
    setShowUnsavedDialog(false)
    
    if (nextAction === "back") {
      router.push("/funding/actual-v2")
    } else if (nextAction === "submit") {
      submitRecords()
    }
  }, [nextAction, router, submitRecords])
  
  return (
    <div className="space-y-6">
      <SimplePageHeader 
        title="编辑实际支付 (V2)"
        loading={loading}
      />
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">加载中...</span>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {records.map(record => (
              <Card key={record.id}>
                <CardHeader>
                  <CardTitle>{record.projectName} - {record.subProjectName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`organization-${record.id}`}>机构</Label>
                        <Input
                          id={`organization-${record.id}`}
                          value={record.organizationName}
                          disabled
                        />
                      </div>
                      <div>
                        <Label htmlFor={`department-${record.id}`}>部门</Label>
                        <Input
                          id={`department-${record.id}`}
                          value={record.departmentName}
                          disabled
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`project-${record.id}`}>项目</Label>
                        <Input
                          id={`project-${record.id}`}
                          value={record.projectName}
                          disabled
                        />
                      </div>
                      <div>
                        <Label htmlFor={`subproject-${record.id}`}>子项目</Label>
                        <Input
                          id={`subproject-${record.id}`}
                          value={record.subProjectName}
                          disabled
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`amount-${record.id}`}>金额</Label>
                        <Input
                          id={`amount-${record.id}`}
                          value={record.amount.toString()}
                          onChange={(e) => handleAmountChange(record.id, e.target.value)}
                          placeholder="请输入金额"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`period-${record.id}`}>期间</Label>
                        <Input
                          id={`period-${record.id}`}
                          value={`${record.year}年${record.month}月`}
                          disabled
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor={`remark-${record.id}`}>备注</Label>
                      <Textarea
                        id={`remark-${record.id}`}
                        value={record.remark || ""}
                        onChange={(e) => handleRemarkChange(record.id, e.target.value)}
                        placeholder="请输入备注"
                        rows={3}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={loading || saving || submitting}
            >
              返回
            </Button>
            <Button
              variant="secondary"
              onClick={saveRecords}
              disabled={loading || saving || submitting || !hasChanges}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  保存
                </>
              )}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || saving || submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  提交
                </>
              )}
            </Button>
          </div>
        </>
      )}
      
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>未保存的更改</AlertDialogTitle>
            <AlertDialogDescription>
              您有未保存的更改，确定要离开吗？未保存的更改将会丢失。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDialogConfirm}>
              <AlertTriangle className="mr-2 h-4 w-4" />
              继续并丢弃更改
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 