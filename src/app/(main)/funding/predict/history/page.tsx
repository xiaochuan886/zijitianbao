"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { ArrowLeft, RotateCcw } from "lucide-react"
import { FilterCard } from "@/components/funding/filter-card"
import { submitWithdrawalRequest } from "../client-api"

// 历史记录类型
interface HistoryRecord {
  id: string
  organization: string
  department: string
  project: string
  subProject: string
  fundType: string
  year: number
  month: number
  amount: number | null
  status: string
  submittedAt: string
  remark: string
  canWithdraw: boolean
}

// 组织的历史记录
interface GroupedHistory {
  organization: string
  departments: {
    name: string
    projects: {
      name: string
      subProjects: {
        name: string
        fundTypes: {
          name: string
          records: {
            [key: string]: number | null // 月份: 金额
          }[]
        }[]
      }[]
    }[]
  }[]
}

export default function PredictHistoryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    organization: "all",
    department: "all",
    project: "",
    subProject: "",
    fundType: "",
    year: new Date().getFullYear(),
    monthRange: 12 // 默认查看最近12个月
  })
  const [organizations, setOrganizations] = useState<{id: string, name: string}[]>([])
  const [departments, setDepartments] = useState<{id: string, name: string}[]>([])
  const [historyRecords, setHistoryRecords] = useState<HistoryRecord[]>([])
  const [groupedHistory, setGroupedHistory] = useState<GroupedHistory[]>([])
  const [activeTab, setActiveTab] = useState("table")
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false)
  const [withdrawalReason, setWithdrawalReason] = useState("")
  const [submitting, setSubmitting] = useState(false)
  
  // 获取历史记录
  const fetchHistory = useCallback(async (force = false) => {
    try {
      setLoading(true)
      
      // 构建查询参数
      const params = new URLSearchParams()
      if (filters.organization !== "all") params.append("organizationId", filters.organization)
      if (filters.department !== "all") params.append("departmentId", filters.department)
      if (filters.project) params.append("project", filters.project)
      if (filters.subProject) params.append("subProject", filters.subProject)
      if (filters.fundType) params.append("fundType", filters.fundType)
      params.append("year", filters.year.toString())
      params.append("months", filters.monthRange.toString())
      
      // 添加强制刷新参数
      if (force) params.append("_t", Date.now().toString())
      
      const response = await fetch(`/api/funding/predict/history?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error("获取历史记录失败")
      }
      
      const data = await response.json()
      
      setHistoryRecords(data.records || [])
      setOrganizations(data.organizations || [])
      setDepartments(data.departments || [])
      
      // 处理分组数据
      processGroupedData(data.records || [])
    } catch (error) {
      console.error("获取历史记录失败", error)
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "获取历史记录失败",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [filters, toast])
  
  // 处理分组数据
  const processGroupedData = useCallback((records: HistoryRecord[]) => {
    // 按组织、部门、项目、子项目、资金类型分组
    const grouped: Record<string, any> = {}
    
    records.forEach(record => {
      // 初始化组织结构
      if (!grouped[record.organization]) {
        grouped[record.organization] = {
          name: record.organization,
          departments: {}
        }
      }
      
      // 初始化部门结构
      if (!grouped[record.organization].departments[record.department]) {
        grouped[record.organization].departments[record.department] = {
          name: record.department,
          projects: {}
        }
      }
      
      // 初始化项目结构
      if (!grouped[record.organization].departments[record.department].projects[record.project]) {
        grouped[record.organization].departments[record.department].projects[record.project] = {
          name: record.project,
          subProjects: {}
        }
      }
      
      // 初始化子项目结构
      if (!grouped[record.organization].departments[record.department].projects[record.project].subProjects[record.subProject]) {
        grouped[record.organization].departments[record.department].projects[record.project].subProjects[record.subProject] = {
          name: record.subProject,
          fundTypes: {}
        }
      }
      
      // 初始化资金类型结构
      if (!grouped[record.organization].departments[record.department].projects[record.project].subProjects[record.subProject].fundTypes[record.fundType]) {
        grouped[record.organization].departments[record.department].projects[record.project].subProjects[record.subProject].fundTypes[record.fundType] = {
          name: record.fundType,
          records: []
        }
        
        // 初始化记录对象
        const recordObj: {[key: string]: number | null} = {}
        grouped[record.organization].departments[record.department].projects[record.project].subProjects[record.subProject].fundTypes[record.fundType].records.push(recordObj)
      }
      
      // 添加月份记录
      const monthKey = `${record.year}-${record.month.toString().padStart(2, '0')}`
      grouped[record.organization].departments[record.department].projects[record.project].subProjects[record.subProject].fundTypes[record.fundType].records[0][monthKey] = record.amount
    })
    
    // 将嵌套对象转换为数组
    const result: GroupedHistory[] = Object.values(grouped).map((org: any) => {
      return {
        organization: org.name,
        departments: Object.values(org.departments).map((dept: any) => {
          return {
            name: dept.name,
            projects: Object.values(dept.projects).map((proj: any) => {
              return {
                name: proj.name,
                subProjects: Object.values(proj.subProjects).map((subProj: any) => {
                  return {
                    name: subProj.name,
                    fundTypes: Object.values(subProj.fundTypes).map((fundType: any) => {
                      return {
                        name: fundType.name,
                        records: fundType.records
                      }
                    })
                  }
                })
              }
            })
          }
        })
      }
    })
    
    setGroupedHistory(result)
  }, [])
  
  // 筛选条件变更
  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])
  
  // 重置筛选条件
  const handleResetFilters = useCallback(() => {
    setFilters({
      organization: "all",
      department: "all",
      project: "",
      subProject: "",
      fundType: "",
      year: new Date().getFullYear(),
      monthRange: 12
    })
  }, [])
  
  // 查看记录详情
  const handleViewRecord = useCallback((record: HistoryRecord) => {
    setSelectedRecord(record)
    setDialogOpen(true)
  }, [])
  
  // 申请撤回
  const handleRequestWithdrawal = useCallback(() => {
    if (!selectedRecord) return
    setDialogOpen(false)
    setWithdrawalDialogOpen(true)
  }, [selectedRecord])
  
  // 提交撤回申请
  const handleSubmitWithdrawal = useCallback(async () => {
    if (!selectedRecord) return
    
    if (withdrawalReason.trim().length < 5) {
      toast({
        title: "错误",
        description: "撤回原因至少需要5个字符",
        variant: "destructive"
      })
      return
    }
    
    try {
      setSubmitting(true)
      
      // 使用客户端API发起撤回申请
      const result = await submitWithdrawalRequest(
        selectedRecord.id, 
        undefined, 
        withdrawalReason
      )
      
      if (result.success) {
        toast({
          title: "成功",
          description: "撤回申请已提交，等待审核",
        })
        
        // 关闭弹窗并重置状态
        setWithdrawalDialogOpen(false)
        setWithdrawalReason("")
        setSelectedRecord(null)
        
        // 刷新历史记录
        fetchHistory(true)
      } else {
        throw new Error(result.error || "提交撤回申请失败")
      }
    } catch (error) {
      console.error("提交撤回申请失败", error)
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "提交撤回申请失败",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }, [selectedRecord, withdrawalReason, toast, fetchHistory])
  
  // 获取近12个月的月份列表
  const monthColumns = useMemo(() => {
    const columns = []
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1
    
    for (let i = 0; i < filters.monthRange; i++) {
      let month = currentMonth - i
      let year = currentYear
      
      if (month <= 0) {
        month += 12
        year -= 1
      }
      
      columns.unshift({
        key: `${year}-${month.toString().padStart(2, '0')}`,
        label: `${year}-${month.toString().padStart(2, '0')}`
      })
    }
    
    return columns
  }, [filters.monthRange])
  
  // 格式化金额
  const formatCurrency = useCallback((amount: number | null) => {
    if (amount === null) return "-"
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }, [])
  
  // 初始化加载
  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/funding/predict")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">资金需求预测提交历史</h1>
        </div>
      </div>
      
      <FilterCard
        filters={filters}
        organizations={organizations}
        departments={departments}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        onSearch={() => fetchHistory(true)}
        loading={loading}
        extraFilters={[
          {
            id: "year",
            label: "年份",
            type: "select",
            value: filters.year.toString(),
            onChange: (value) => handleFilterChange("year", parseInt(value)),
            options: Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(year => ({
              label: year.toString(),
              value: year.toString()
            }))
          },
          {
            id: "monthRange",
            label: "月份范围",
            type: "select",
            value: filters.monthRange.toString(),
            onChange: (value) => handleFilterChange("monthRange", parseInt(value)),
            options: [
              { label: "最近3个月", value: "3" },
              { label: "最近6个月", value: "6" },
              { label: "最近12个月", value: "12" }
            ]
          }
        ]}
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="table">表格视图</TabsTrigger>
          <TabsTrigger value="group">分组视图</TabsTrigger>
        </TabsList>
        
        <Card className="mt-4">
          <CardContent className="p-6">
            <TabsContent value="table" className="mt-0">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>机构</TableHead>
                      <TableHead>部门</TableHead>
                      <TableHead>项目</TableHead>
                      <TableHead>子项目</TableHead>
                      <TableHead>资金类型</TableHead>
                      <TableHead>金额 (¥)</TableHead>
                      <TableHead>月份</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>提交时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center">
                          正在加载...
                        </TableCell>
                      </TableRow>
                    ) : historyRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-24 text-center">
                          没有找到历史记录
                        </TableCell>
                      </TableRow>
                    ) : (
                      historyRecords.map((record) => (
                        <TableRow key={record.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewRecord(record)}>
                          <TableCell>{record.organization}</TableCell>
                          <TableCell>{record.department}</TableCell>
                          <TableCell>{record.project}</TableCell>
                          <TableCell>{record.subProject}</TableCell>
                          <TableCell>{record.fundType}</TableCell>
                          <TableCell>{record.amount !== null ? formatCurrency(record.amount) : "-"}</TableCell>
                          <TableCell>{`${record.year}-${record.month.toString().padStart(2, '0')}`}</TableCell>
                          <TableCell>{record.status}</TableCell>
                          <TableCell>{new Date(record.submittedAt).toLocaleString()}</TableCell>
                          <TableCell>
                            {record.canWithdraw && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedRecord(record)
                                  setWithdrawalDialogOpen(true)
                                }}
                              >
                                <RotateCcw className="h-4 w-4 mr-1" />
                                申请撤回
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="group" className="mt-0">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>子项目</TableHead>
                      <TableHead>资金类型</TableHead>
                      {monthColumns.map(column => (
                        <TableHead key={column.key}>{column.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={2 + monthColumns.length} className="h-24 text-center">
                          正在加载...
                        </TableCell>
                      </TableRow>
                    ) : groupedHistory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2 + monthColumns.length} className="h-24 text-center">
                          没有找到历史记录
                        </TableCell>
                      </TableRow>
                    ) : (
                      groupedHistory.flatMap(org => (
                        org.departments.flatMap(dept => (
                          dept.projects.flatMap(proj => (
                            <>
                              <TableRow key={`header-${org.organization}-${dept.name}-${proj.name}`} className="bg-muted/50">
                                <TableCell colSpan={2 + monthColumns.length} className="font-medium">
                                  {org.organization} &gt; {dept.name} &gt; {proj.name}
                                </TableCell>
                              </TableRow>
                              {proj.subProjects.flatMap(subProj => (
                                subProj.fundTypes.map(fundType => (
                                  <TableRow key={`data-${org.organization}-${dept.name}-${proj.name}-${subProj.name}-${fundType.name}`}>
                                    <TableCell>{subProj.name}</TableCell>
                                    <TableCell>{fundType.name}</TableCell>
                                    {monthColumns.map(column => (
                                      <TableCell key={column.key}>
                                        {fundType.records[0][column.key] !== undefined
                                          ? formatCurrency(fundType.records[0][column.key])
                                          : "-"}
                                      </TableCell>
                                    ))}
                                  </TableRow>
                                ))
                              ))}
                            </>
                          ))
                        ))
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
      
      {/* 记录详情对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>资金预测详情</DialogTitle>
            <DialogDescription>
              查看填报记录的详细信息
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>机构</Label>
                  <p className="text-sm mt-1">{selectedRecord.organization}</p>
                </div>
                <div>
                  <Label>部门</Label>
                  <p className="text-sm mt-1">{selectedRecord.department}</p>
                </div>
                <div>
                  <Label>项目</Label>
                  <p className="text-sm mt-1">{selectedRecord.project}</p>
                </div>
                <div>
                  <Label>子项目</Label>
                  <p className="text-sm mt-1">{selectedRecord.subProject}</p>
                </div>
                <div>
                  <Label>资金类型</Label>
                  <p className="text-sm mt-1">{selectedRecord.fundType}</p>
                </div>
                <div>
                  <Label>年月</Label>
                  <p className="text-sm mt-1">{`${selectedRecord.year}-${selectedRecord.month.toString().padStart(2, '0')}`}</p>
                </div>
                <div>
                  <Label>金额</Label>
                  <p className="text-sm mt-1">{selectedRecord.amount !== null ? formatCurrency(selectedRecord.amount) : "-"}</p>
                </div>
                <div>
                  <Label>状态</Label>
                  <p className="text-sm mt-1">{selectedRecord.status}</p>
                </div>
                <div className="col-span-2">
                  <Label>提交时间</Label>
                  <p className="text-sm mt-1">{new Date(selectedRecord.submittedAt).toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <Label>备注</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedRecord.remark || "-"}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            {selectedRecord?.canWithdraw && (
              <Button
                variant="secondary"
                onClick={handleRequestWithdrawal}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                申请撤回
              </Button>
            )}
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 撤回申请对话框 */}
      <Dialog open={withdrawalDialogOpen} onOpenChange={setWithdrawalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>提交撤回申请</DialogTitle>
            <DialogDescription>
              {selectedRecord && (
                <>
                  项目: {selectedRecord.project}
                  <br />
                  子项目: {selectedRecord.subProject}
                  <br />
                  资金类型: {selectedRecord.fundType}
                  <br />
                  月份: {`${selectedRecord.year}-${selectedRecord.month.toString().padStart(2, '0')}`}
                </>
              )}
              <br />
              请填写撤回原因，管理员审核通过后将允许重新编辑。
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">撤回原因</Label>
              <Textarea
                id="reason"
                placeholder="请详细说明撤回原因..."
                value={withdrawalReason}
                onChange={(e) => setWithdrawalReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setWithdrawalDialogOpen(false)
                setWithdrawalReason("")
              }}
            >
              取消
            </Button>
            <Button 
              onClick={handleSubmitWithdrawal}
              disabled={submitting || withdrawalReason.trim().length < 5}
            >
              {submitting ? "提交中..." : "提交申请"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 