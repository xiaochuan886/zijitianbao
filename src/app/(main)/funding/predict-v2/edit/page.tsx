"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
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
import { useFundingPredictV2, PredictRecord } from "@/hooks/use-funding-predict-v2"

export default function PredictV2EditPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [records, setRecords] = useState<PredictRecord[]>([])
  const [formData, setFormData] = useState<Record<string, { amount: string; remark: string }>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  
  // 获取记录ID列表
  const recordIds = searchParams?.getAll('recordIds[]') || []
  
  // 使用预测填报钩子
  const { saveRecords } = useFundingPredictV2()
  
  // 加载记录数据
  useEffect(() => {
    const fetchRecordDetails = async () => {
      if (recordIds.length === 0) {
        toast({
          title: "错误",
          description: "未指定记录ID",
          variant: "destructive"
        })
        router.push('/funding/predict-v2')
        return
      }
      
      setLoading(true)
      
      try {
        // 这里应该调用API获取记录详情
        // 由于我们还没有实现获取单个记录的API，这里模拟一些数据
        const mockRecords: PredictRecord[] = recordIds.map(id => ({
          id,
          subProjectId: `subproject-${id}`,
          fundTypeId: `fundtype-${id}`,
          year: 2025,
          month: 4,
          amount: 10000,
          status: "draft" as any,
          remark: "",
          submittedBy: "user-1",
          submittedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          subProject: {
            id: `subproject-${id}`,
            name: `子项目 ${id.substring(0, 5)}`,
            projectId: `project-${id}`,
            project: {
              id: `project-${id}`,
              name: `项目 ${id.substring(0, 5)}`,
              organizations: [
                {
                  id: "org-1",
                  name: "测试机构",
                  code: "TEST"
                }
              ],
              departments: [
                {
                  id: "dept-1",
                  name: "测试部门"
                }
              ]
            },
            fundTypes: [
              {
                id: `fundtype-${id}`,
                name: "测试资金类型"
              }
            ]
          },
          fundType: {
            id: `fundtype-${id}`,
            name: "测试资金类型"
          }
        }))
        
        setRecords(mockRecords)
        
        // 初始化表单数据
        const initialFormData: Record<string, { amount: string; remark: string }> = {}
        mockRecords.forEach(record => {
          initialFormData[record.id] = {
            amount: record.amount !== null ? record.amount.toString() : '',
            remark: record.remark || ''
          }
        })
        
        setFormData(initialFormData)
      } catch (error) {
        console.error("获取记录详情失败", error)
        toast({
          title: "错误",
          description: "获取记录详情失败",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }
    
    fetchRecordDetails()
  }, [recordIds, router, toast])
  
  // 处理表单变化
  const handleFormChange = useCallback((recordId: string, field: 'amount' | 'remark', value: string) => {
    setFormData(prev => ({
      ...prev,
      [recordId]: {
        ...prev[recordId],
        [field]: value
      }
    }))
    
    setHasChanges(true)
  }, [])
  
  // 处理保存
  const handleSave = useCallback(async () => {
    if (!hasChanges) return
    
    setSaving(true)
    
    try {
      // 准备要保存的记录数据
      const recordsToSave = records.map(record => ({
        id: record.id,
        subProjectId: record.subProjectId,
        fundTypeId: record.fundTypeId,
        year: record.year,
        month: record.month,
        amount: formData[record.id].amount ? parseFloat(formData[record.id].amount) : null,
        remark: formData[record.id].remark
      }))
      
      // 调用保存API
      const result = await saveRecords(recordsToSave)
      
      if (result) {
        setHasChanges(false)
        toast({
          title: "保存成功",
          description: "记录已保存"
        })
      }
    } catch (error) {
      console.error("保存失败", error)
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "保存记录失败",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }, [hasChanges, records, formData, saveRecords, toast])
  
  // 处理提交
  const handleSubmit = useCallback(() => {
    // 先保存，然后再提交
    if (hasChanges) {
      setShowConfirmDialog(true)
    } else {
      // 直接提交
      performSubmit()
    }
  }, [hasChanges])
  
  // 执行提交
  const performSubmit = useCallback(async () => {
    setSubmitting(true)
    
    try {
      // 先保存
      if (hasChanges) {
        await handleSave()
      }
      
      // TODO: 实现提交功能
      toast({
        title: "功能开发中",
        description: "提交功能正在开发中"
      })
    } catch (error) {
      console.error("提交失败", error)
      toast({
        title: "提交失败",
        description: error instanceof Error ? error.message : "提交记录失败",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
      setShowConfirmDialog(false)
    }
  }, [hasChanges, handleSave, toast])
  
  // 处理返回
  const handleBack = useCallback(() => {
    if (hasChanges) {
      setShowConfirmDialog(true)
    } else {
      router.push('/funding/predict-v2')
    }
  }, [hasChanges, router])
  
  // 格式化金额输入
  const formatAmount = useCallback((value: string) => {
    // 移除非数字字符，保留小数点
    return value.replace(/[^\d.]/g, '')
  }, [])
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">编辑预测记录</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "保存中..." : "保存"}
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={submitting}
          >
            <Upload className="h-4 w-4 mr-2" />
            {submitting ? "提交中..." : "提交"}
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>编辑记录</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <p>加载中...</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>项目</TableHead>
                    <TableHead>子项目</TableHead>
                    <TableHead>资金类型</TableHead>
                    <TableHead>年月</TableHead>
                    <TableHead>金额 (元)</TableHead>
                    <TableHead>备注</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map(record => (
                    <TableRow key={record.id}>
                      <TableCell>{record.subProject.project.name}</TableCell>
                      <TableCell>{record.subProject.name}</TableCell>
                      <TableCell>{record.fundType.name}</TableCell>
                      <TableCell>{`${record.year}年${record.month}月`}</TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={formData[record.id]?.amount || ''}
                          onChange={(e) => handleFormChange(
                            record.id, 
                            'amount', 
                            formatAmount(e.target.value)
                          )}
                          placeholder="请输入金额"
                        />
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={formData[record.id]?.remark || ''}
                          onChange={(e) => handleFormChange(
                            record.id, 
                            'remark', 
                            e.target.value
                          )}
                          placeholder="请输入备注"
                          rows={2}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <p className="text-sm text-muted-foreground">
            提示: 填写完成后，点击"保存"按钮保存为草稿，点击"提交"按钮提交记录。
          </p>
        </CardFooter>
      </Card>
      
      {/* 确认对话框 */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>未保存的更改</AlertDialogTitle>
            <AlertDialogDescription>
              您有未保存的更改，是否要保存这些更改？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction onClick={performSubmit}>
              保存并继续
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 