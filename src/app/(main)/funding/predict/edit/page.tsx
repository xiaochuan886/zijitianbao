"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
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
import { debounce } from "lodash"

// 定义数据类型
interface FundRecord {
  id: string
  subProjectId: string
  subProjectName: string
  fundTypeId: string
  fundTypeName: string
  year: number
  month: number
  predicted: number | null
  status: string
}

interface ProjectData {
  id: string
  name: string
  organization: {
    id: string
    name: string
    code: string
  }
  subProjects: {
    id: string
    name: string
    fundTypes: {
      id: string
      name: string
      records: FundRecord[]
    }[]
  }[]
}

export default function PredictEditPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [projects, setProjects] = useState<ProjectData[]>([])
  const [records, setRecords] = useState<Record<string, number | null>>({})
  const [originalRecords, setOriginalRecords] = useState<Record<string, number | null>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [nextMonth, setNextMonth] = useState<{year: number, month: number}>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 2 // 下个月
  })
  
  // 获取当前月份的下一个月
  const getNextMonth = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 2 // +1 是下个月，+1 是因为 getMonth() 从 0 开始
    return { year, month }
  }
  
  // 格式化金额
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return ""
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
    }).format(amount)
  }
  
  // 获取项目数据
  const fetchData = async () => {
    try {
      setLoading(true)
      
      // 获取查询参数
      const id = searchParams.get("id")
      const ids = searchParams.get("ids")
      
      // 这里应该调用 API 获取项目数据
      // 模拟数据
      const nextMonth = getNextMonth()
      setNextMonth(nextMonth)
      
      // 模拟数据
      const mockProjects: ProjectData[] = [
        {
          id: "1",
          name: "智慧城市项目 (SC001)",
          organization: {
            id: "org1",
            name: "机构A",
            code: "A001"
          },
          subProjects: [
            {
              id: "sub1",
              name: "子项目1",
              fundTypes: [
                {
                  id: "ft1",
                  name: "设备采购",
                  records: [
                    { id: "r1", subProjectId: "sub1", subProjectName: "子项目1", fundTypeId: "ft1", fundTypeName: "设备采购", year: 2024, month: 1, predicted: 200000, status: "submitted" },
                    { id: "r2", subProjectId: "sub1", subProjectName: "子项目1", fundTypeId: "ft1", fundTypeName: "设备采购", year: 2024, month: 2, predicted: 300000, status: "submitted" },
                    { id: "r3", subProjectId: "sub1", subProjectName: "子项目1", fundTypeId: "ft1", fundTypeName: "设备采购", year: 2024, month: 3, predicted: 200000, status: "submitted" },
                    { id: "r4", subProjectId: "sub1", subProjectName: "子项目1", fundTypeId: "ft1", fundTypeName: "设备采购", year: nextMonth.year, month: nextMonth.month, predicted: null, status: "draft" }
                  ]
                },
                {
                  id: "ft2",
                  name: "工程款",
                  records: [
                    { id: "r5", subProjectId: "sub1", subProjectName: "子项目1", fundTypeId: "ft2", fundTypeName: "工程款", year: 2024, month: 1, predicted: 400000, status: "submitted" },
                    { id: "r6", subProjectId: "sub1", subProjectName: "子项目1", fundTypeId: "ft2", fundTypeName: "工程款", year: 2024, month: 2, predicted: 600000, status: "submitted" },
                    { id: "r7", subProjectId: "sub1", subProjectName: "子项目1", fundTypeId: "ft2", fundTypeName: "工程款", year: 2024, month: 3, predicted: 500000, status: "submitted" },
                    { id: "r8", subProjectId: "sub1", subProjectName: "子项目1", fundTypeId: "ft2", fundTypeName: "工程款", year: nextMonth.year, month: nextMonth.month, predicted: null, status: "draft" }
                  ]
                }
              ]
            },
            {
              id: "sub2",
              name: "子项目2",
              fundTypes: [
                {
                  id: "ft3",
                  name: "材料费",
                  records: [
                    { id: "r9", subProjectId: "sub2", subProjectName: "子项目2", fundTypeId: "ft3", fundTypeName: "材料费", year: 2024, month: 1, predicted: 100000, status: "submitted" },
                    { id: "r10", subProjectId: "sub2", subProjectName: "子项目2", fundTypeId: "ft3", fundTypeName: "材料费", year: 2024, month: 2, predicted: 150000, status: "submitted" },
                    { id: "r11", subProjectId: "sub2", subProjectName: "子项目2", fundTypeId: "ft3", fundTypeName: "材料费", year: 2024, month: 3, predicted: 100000, status: "submitted" },
                    { id: "r12", subProjectId: "sub2", subProjectName: "子项目2", fundTypeId: "ft3", fundTypeName: "材料费", year: nextMonth.year, month: nextMonth.month, predicted: null, status: "draft" }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: "2",
          name: "5G网络建设 (5G001)",
          organization: {
            id: "org1",
            name: "机构A",
            code: "A001"
          },
          subProjects: [
            {
              id: "sub3",
              name: "子项目1",
              fundTypes: [
                {
                  id: "ft4",
                  name: "人工费",
                  records: [
                    { id: "r13", subProjectId: "sub3", subProjectName: "子项目1", fundTypeId: "ft4", fundTypeName: "人工费", year: 2024, month: 1, predicted: 150000, status: "submitted" },
                    { id: "r14", subProjectId: "sub3", subProjectName: "子项目1", fundTypeId: "ft4", fundTypeName: "人工费", year: 2024, month: 2, predicted: 200000, status: "submitted" },
                    { id: "r15", subProjectId: "sub3", subProjectName: "子项目1", fundTypeId: "ft4", fundTypeName: "人工费", year: 2024, month: 3, predicted: 150000, status: "submitted" },
                    { id: "r16", subProjectId: "sub3", subProjectName: "子项目1", fundTypeId: "ft4", fundTypeName: "人工费", year: nextMonth.year, month: nextMonth.month, predicted: null, status: "draft" }
                  ]
                }
              ]
            }
          ]
        }
      ]
      
      setProjects(mockProjects)
      
      // 初始化记录
      const initialRecords: Record<string, number | null> = {}
      mockProjects.forEach(project => {
        project.subProjects.forEach(subProject => {
          subProject.fundTypes.forEach(fundType => {
            fundType.records.forEach(record => {
              if (record.year === nextMonth.year && record.month === nextMonth.month) {
                initialRecords[record.id] = record.predicted
              }
            })
          })
        })
      })
      
      setRecords(initialRecords)
      setOriginalRecords({...initialRecords})
      setLoading(false)
    } catch (error) {
      console.error("获取数据失败", error)
      toast({
        title: "错误",
        description: "获取数据失败",
        variant: "destructive"
      })
      setLoading(false)
    }
  }
  
  // 计算年度汇总
  const calculateYearTotal = (subProjectId: string, fundTypeId: string) => {
    let total = 0
    
    projects.forEach(project => {
      project.subProjects.forEach(subProject => {
        if (subProject.id === subProjectId) {
          subProject.fundTypes.forEach(fundType => {
            if (fundType.id === fundTypeId) {
              fundType.records.forEach(record => {
                if (record.predicted !== null) {
                  total += record.predicted
                } else if (records[record.id] !== null && records[record.id] !== undefined) {
                  total += records[record.id] as number
                }
              })
            }
          })
        }
      })
    })
    
    return total
  }
  
  // 处理输入变化
  const handleInputChange = (recordId: string, value: string) => {
    const numValue = value === "" ? null : parseFloat(value)
    setRecords(prev => ({
      ...prev,
      [recordId]: numValue
    }))
    
    // 检查是否有变更
    const hasChanges = Object.keys(records).some(key => {
      const original = originalRecords[key] === null ? null : originalRecords[key]
      const current = records[key] === null ? null : records[key]
      return original !== current
    })
    
    setHasChanges(hasChanges)
    
    // 自动保存草稿
    debouncedSaveDraft()
  }
  
  // 自动保存草稿（防抖）
  const saveDraft = async () => {
    if (!hasChanges) return
    
    try {
      setSaving(true)
      
      // 这里应该调用 API 保存草稿
      console.log("保存草稿", records)
      
      // 更新原始记录
      setOriginalRecords({...records})
      setHasChanges(false)
      
      toast({
        title: "已保存",
        description: "草稿已自动保存",
      })
    } catch (error) {
      console.error("保存草稿失败", error)
      toast({
        title: "错误",
        description: "保存草稿失败",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }
  
  // 防抖处理
  const debouncedSaveDraft = useCallback(debounce(saveDraft, 2000), [records, hasChanges])
  
  // 手动保存
  const handleSave = async () => {
    try {
      setSaving(true)
      
      // 这里应该调用 API 保存
      console.log("保存", records)
      
      // 更新原始记录
      setOriginalRecords({...records})
      setHasChanges(false)
      
      toast({
        title: "成功",
        description: "数据已保存",
      })
    } catch (error) {
      console.error("保存失败", error)
      toast({
        title: "错误",
        description: "保存失败",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }
  
  // 提交
  const handleSubmit = async () => {
    try {
      setSubmitting(true)
      
      // 数据校验
      const hasEmptyValues = Object.values(records).some(value => value === null)
      if (hasEmptyValues) {
        toast({
          title: "警告",
          description: "存在未填写的数据，请填写完整后提交",
          variant: "destructive"
        })
        setSubmitting(false)
        return
      }
      
      // 这里应该调用 API 提交
      console.log("提交", records)
      
      toast({
        title: "成功",
        description: "数据已提交",
      })
      
      // 提交成功后返回列表页
      router.push("/funding/predict")
    } catch (error) {
      console.error("提交失败", error)
      toast({
        title: "错误",
        description: "提交失败",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }
  
  // 初始化
  useEffect(() => {
    fetchData()
    
    // 组件卸载时保存草稿
    return () => {
      if (hasChanges) {
        saveDraft()
      }
    }
  }, [])
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/funding/predict")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">资金需求预测填报</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            <Save className="mr-2 h-4 w-4" />
            保存
            {saving && "..."}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={submitting}>
                <Upload className="mr-2 h-4 w-4" />
                提交
                {submitting && "..."}
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
      
      <div className="space-y-8">
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
                        <TableHead className="w-[150px]">子项目</TableHead>
                        <TableHead className="w-[150px]">资金需求类型</TableHead>
                        <TableHead className="w-[150px]">2024年汇总</TableHead>
                        <TableHead className="w-[150px]">2024-01 (已提交)</TableHead>
                        <TableHead className="w-[150px]">2024-02 (已提交)</TableHead>
                        <TableHead className="w-[150px]">2024-03 (已提交)</TableHead>
                        <TableHead className="w-[150px]">{`${nextMonth.year}-${nextMonth.month.toString().padStart(2, '0')} (可填报)`}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {project.subProjects.map(subProject => (
                        subProject.fundTypes.map(fundType => (
                          <TableRow key={`${subProject.id}-${fundType.id}`}>
                            <TableCell>{subProject.name}</TableCell>
                            <TableCell>{fundType.name}</TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(calculateYearTotal(subProject.id, fundType.id))}
                            </TableCell>
                            {/* 历史月份数据（不可编辑） */}
                            {[1, 2, 3].map(month => {
                              const record = fundType.records.find(r => r.month === month)
                              return (
                                <TableCell key={month}>
                                  {record ? formatCurrency(record.predicted) : ""}
                                </TableCell>
                              )
                            })}
                            {/* 下月数据（可填报） */}
                            <TableCell>
                              {fundType.records
                                .filter(record => record.year === nextMonth.year && record.month === nextMonth.month)
                                .map(record => (
                                  <Input
                                    key={record.id}
                                    type="number"
                                    value={records[record.id] === null ? "" : String(records[record.id])}
                                    onChange={(e) => handleInputChange(record.id, e.target.value)}
                                    placeholder="请输入金额"
                                    className="w-full"
                                  />
                                ))}
                            </TableCell>
                          </TableRow>
                        ))
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
} 