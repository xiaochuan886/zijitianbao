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
import { Save, Upload, ArrowLeft, Loader2, ChevronDown, ChevronRight, ChevronUp } from "lucide-react"
import { useFundingActual, ActualRecord } from "@/hooks/use-funding-actual"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// 表格组件的属性接口
interface RecordsTableProps {
  records: ActualRecord[]; 
  formData: Record<string, { amount: string; remark: string }>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, { amount: string; remark: string }>>>;
  loading: boolean;
}

// 分组记录的类型
interface GroupedRecords {
  key: string;
  organizationName: string;
  departmentName: string;
  projectCategoryName: string;
  projectName: string;
  records: ActualRecord[];
}

export default function ActualEditPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [records, setRecords] = useState<ActualRecord[]>([])
  const [formData, setFormData] = useState<Record<string, { amount: string; remark: string }>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  
  // 获取记录ID列表
  const recordIds = searchParams?.getAll('recordIds[]') || []
  
  // 使用预测填报钩子
  const { saveRecords } = useFundingActual()
  
  // 添加请求状态标志，防止重复请求
  const requestInProgress = useRef(false)
  
  // 加载记录数据
  useEffect(() => {
    const fetchRecordDetails = async () => {
      // 如果已经在请求中或已有记录数据，则不再重复请求
      if (requestInProgress.current || records.length > 0) {
        return
      }
      
      if (recordIds.length === 0) {
        toast({
          title: "错误",
          description: "未指定记录ID",
          variant: "destructive"
        })
        router.push('/funding/actual')
        return
      }
      
      setLoading(true)
      requestInProgress.current = true
      
      try {
        console.log(`开始获取记录详情，ID列表: ${recordIds.join(', ')}`)
        
        // 获取记录类型（用户或财务）
        const recordType = searchParams?.get('recordType') || 'user';
        
        // 直接从API获取所有记录（包括真实ID和临时ID）
        const response = await fetch(`/api/funding/actual/records?${recordIds.map(id => `ids[]=${id}`).join('&')}&recordType=${recordType}`)
        
        if (!response.ok) {
          throw new Error(`获取记录失败: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json()
        
        if (!data.records || data.records.length === 0) {
          toast({
            title: "警告",
            description: "未找到指定的记录",
            variant: "destructive"
          })
          router.push('/funding/actual')
          return
        }
        
        console.log(`获取到${data.records.length}条记录`)
        setRecords(data.records)
        
        // 初始化表单数据
        const initialFormData: Record<string, { amount: string; remark: string }> = {}
        
        // 获取当前年月和上个月
        const { currentYear, currentMonth, lastMonth, lastMonthYear } = getCurrentYearAndPreviousMonths();
        
        data.records.forEach((record: ActualRecord) => {
          // 查找上个月的记录，用于默认填充备注
          const lastMonthRecord = data.records.find((r: ActualRecord) => 
            r.detailedFundNeedId === record.detailedFundNeedId && 
            r.year === lastMonthYear && 
            r.month === lastMonth
          );
          
          initialFormData[record.id] = {
            amount: record.amount !== null ? record.amount.toString() : '',
            remark: record.remark || (lastMonthRecord?.remark || '')
          }
        })
        
        setFormData(initialFormData)
        
        // 默认展开所有分组
        const groups = groupRecords(data.records);
        setExpandedGroups(new Set(groups.map(g => g.key)))
      } catch (error) {
        console.error("获取记录详情失败", error)
        toast({
          title: "错误",
          description: "获取记录详情失败",
          variant: "destructive"
        })
        router.push('/funding/actual')
      } finally {
        setLoading(false)
        // 请求完成后重置标志
        requestInProgress.current = false
      }
    }
    
    fetchRecordDetails()
  }, [recordIds, router, toast, records.length])
  
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
  
  // 保存记录
  const handleSave = async () => {
    if (loading || saving) return
    
    setSaving(true)
    
    try {
      // 准备要保存的记录数据
      const recordsToSave = records.map(record => ({
        id: record.id,
        amount: formData[record.id]?.amount || '',
        remark: formData[record.id]?.remark || ''
      }))
      
      // 获取记录类型（用户或财务）
      const recordType = searchParams?.get('recordType') || 'user';
      
      // 发送保存请求
      const response = await fetch('/api/funding/actual/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ records: recordsToSave, recordType })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '保存失败');
      }
      
      const result = await response.json();
      
      toast({
        title: "保存成功",
        description: result.message,
        variant: "default"
      });
      
      // 如果有失败的记录，显示详细信息
      if (result.results?.failed > 0) {
        console.error('部分记录保存失败:', result.results.errors);
        toast({
          title: "部分记录保存失败",
          description: `${result.results.failed}条记录保存失败，请查看控制台了解详情`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('保存记录失败:', error);
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  // 提交记录
  const handleSubmitClick = () => {
    setIsSubmitDialogOpen(true);
  };
  
  const handleSubmit = async () => {
    if (loading || saving || submitting) return;
    
    setSubmitting(true);
    
    try {
      // 准备要提交的记录数据
      const recordsToSubmit = records.map(record => ({
        id: record.id,
        amount: formData[record.id]?.amount || '',
        remark: formData[record.id]?.remark || ''
      }));
      
      // 获取记录类型（用户或财务）
      const recordType = searchParams?.get('recordType') || 'user';
      
      // 发送提交请求
      const response = await fetch('/api/funding/actual/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ records: recordsToSubmit, recordType })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '提交失败');
      }
      
      const result = await response.json();
      
      toast({
        title: "提交成功",
        description: result.message,
        variant: "default"
      });
      
      // 提交成功后返回列表页
      router.push('/funding/actual');
    } catch (error) {
      console.error('提交记录失败:', error);
      toast({
        title: "提交失败",
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  // 处理返回
  const handleBack = useCallback(() => {
    if (hasChanges) {
      setShowConfirmDialog(true)
    } else {
      router.push('/funding/actual')
    }
  }, [hasChanges, router])
  
  // 格式化金额输入
  const formatAmount = useCallback((value: string) => {
    // 移除非数字字符，保留小数点
    return value.replace(/[^\d.]/g, '')
  }, [])
  
  // 切换分组展开/折叠状态
  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  }, []);
  
  // 全部展开/折叠
  const toggleAllGroups = useCallback((expand: boolean) => {
    if (expand) {
      const groups = groupRecords(records);
      setExpandedGroups(new Set(groups.map(g => g.key)));
    } else {
      setExpandedGroups(new Set());
    }
  }, [records]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">实际支付填报</h1>
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
            onClick={handleSubmitClick}
            disabled={submitting}
          >
            <Upload className="h-4 w-4 mr-2" />
            {submitting ? "提交中..." : "提交"}
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>编辑填报内容</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => toggleAllGroups(true)}>
                展开全部
              </Button>
              <Button variant="outline" size="sm" onClick={() => toggleAllGroups(false)}>
                折叠全部
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <p>加载中...</p>
            </div>
          ) : (
            <GroupedRecordsTable 
              records={records} 
              formData={formData} 
              setFormData={setFormData} 
              loading={loading}
              expandedGroups={expandedGroups}
              toggleGroup={toggleGroup}
              setHasChanges={setHasChanges}
            />
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
            <AlertDialogCancel onClick={() => {
              setShowConfirmDialog(false);
              router.push('/funding/actual');
            }}>
              不保存并返回
            </AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              await handleSave();
              setShowConfirmDialog(false);
              router.push('/funding/actual');
            }}>
              保存并返回
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 提交确认对话框 */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认提交</DialogTitle>
            <DialogDescription>
              提交后记录将不能再修改。确定要提交吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={() => {
                setIsSubmitDialogOpen(false);
                handleSubmit();
              }}
            >
              确认提交
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 按机构+部门+项目分类+项目分组记录
function groupRecords(records: ActualRecord[]): GroupedRecords[] {
  const groupsMap = new Map<string, GroupedRecords>();
  
  records.forEach(record => {
    const organization = record.detailedFundNeed?.organization?.name || '未知机构';
    const department = record.detailedFundNeed?.department?.name || '未知部门';
    const projectCategory = record.detailedFundNeed?.subProject?.project?.category?.name || '未分类';
    const project = record.detailedFundNeed?.subProject?.project?.name || '未知项目';
    
    const groupKey = `${organization}-${department}-${projectCategory}-${project}`;
    
    if (!groupsMap.has(groupKey)) {
      groupsMap.set(groupKey, {
        key: groupKey,
        organizationName: organization,
        departmentName: department,
        projectCategoryName: projectCategory,
        projectName: project,
        records: []
      });
    }
    
    groupsMap.get(groupKey)?.records.push(record);
  });
  
  // 将Map转换为数组并按机构名称、部门名称、项目分类、项目名称排序
  return Array.from(groupsMap.values()).sort((a, b) => {
    if (a.organizationName !== b.organizationName) {
      return a.organizationName.localeCompare(b.organizationName);
    }
    if (a.departmentName !== b.departmentName) {
      return a.departmentName.localeCompare(b.departmentName);
    }
    if (a.projectCategoryName !== b.projectCategoryName) {
      return a.projectCategoryName.localeCompare(b.projectCategoryName);
    }
    return a.projectName.localeCompare(b.projectName);
  });
}

// 获取当前年份和月份以及上个月
function getCurrentYearAndPreviousMonths() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 上个月份（0-11）
  
  // 如果是1月，则上个月是上一年的12月
  let reportMonth = currentMonth;
  let reportYear = currentYear;
  
  if (reportMonth === 0) {
    reportMonth = 12;
    reportYear -= 1;
  }
  
  // 计算前三个月（相对于填报月份）
  const previousMonths = [];
  for (let i = 1; i <= 3; i++) {
    let month = reportMonth - i;
    let year = reportYear;
    
    if (month <= 0) {
      month += 12;
      year -= 1;
    }
    
    previousMonths.push({ year, month });
  }
  
  // 按时间顺序排序（从早到晚）
  previousMonths.reverse();
  
  // 上个月（相对于填报月份）
  const lastMonth = reportMonth - 1 <= 0 ? 12 : reportMonth - 1;
  const lastMonthYear = reportMonth - 1 <= 0 ? reportYear - 1 : reportYear;
  
  return { 
    currentYear: reportYear, 
    currentMonth: reportMonth, 
    previousMonths, 
    lastMonth, 
    lastMonthYear 
  };
}

// 计算记录的年度汇总金额
function calculateYearlyTotal(records: ActualRecord[], year: number): number {
  return records
    .filter(record => record.year === year)
    .reduce((sum, record) => sum + (record.amount || 0), 0);
}

// 查找特定年月的记录
function findRecordByYearMonth(records: ActualRecord[], detailedFundNeedId: string, year: number, month: number): ActualRecord | undefined {
  return records.find(record => 
    record.detailedFundNeedId === detailedFundNeedId && 
    record.year === year && 
    record.month === month
  );
}

// 分组记录表格组件
interface GroupedRecordsTableProps extends RecordsTableProps {
  expandedGroups: Set<string>;
  toggleGroup: (groupKey: string) => void;
  setHasChanges: React.Dispatch<React.SetStateAction<boolean>>;
}

function GroupedRecordsTable({ 
  records, 
  formData, 
  setFormData, 
  loading,
  expandedGroups,
  toggleGroup,
  setHasChanges
}: GroupedRecordsTableProps) {
  // 获取当前年份和前三个月
  const { currentYear, currentMonth, previousMonths, lastMonth, lastMonthYear } = getCurrentYearAndPreviousMonths();
  
  // 过滤出当前填报月份的记录（当前月+1）
  const currentMonthRecords = records.filter(record => 
    record.year === currentYear && record.month === currentMonth
  );
  
  // 按机构+部门+项目分类+项目分组记录（只使用当前月的记录）
  const groupedRecords = groupRecords(currentMonthRecords);
  
  // 处理输入变化
  const handleInputChange = (recordId: string, field: 'amount' | 'remark', value: string) => {
    setFormData(prev => ({
      ...prev,
      [recordId]: {
        ...prev[recordId],
        [field]: value
      }
    }));
    
    // 设置表单已变更状态
    setHasChanges(true);
  };
  
  if (groupedRecords.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">暂无记录</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {groupedRecords.map(group => (
        <Collapsible
          key={group.key}
          open={expandedGroups.has(group.key)}
          onOpenChange={() => toggleGroup(group.key)}
          className="border rounded-md"
        >
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 bg-muted/80 dark:bg-muted/30">
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  {expandedGroups.has(group.key) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <h3 className="text-lg font-semibold">
                    {group.organizationName} - {group.departmentName}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground ml-6">
                  {group.projectCategoryName} - {group.projectName}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {group.records.length} 条记录
                </Badge>
              </div>
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 pt-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">子项目</TableHead>
                      <TableHead className="w-[150px]">资金需求类型</TableHead>
                      <TableHead className="w-[120px]">{currentYear}年汇总</TableHead>
                      {previousMonths.map(({ year, month }) => (
                        <TableHead key={`${year}-${month}`} className="w-[120px]">
                          {year}年{month}月
                        </TableHead>
                      ))}
                      <TableHead className="w-[120px]">{currentYear}年{currentMonth}月</TableHead>
                      <TableHead className="w-[250px]">备注</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.records.map(record => {
                      // 查找前三个月的记录
                      const previousRecords = previousMonths.map(({ year, month }) => 
                        findRecordByYearMonth(records, record.detailedFundNeedId, year, month)
                      );
                      
                      // 计算年度汇总
                      const yearlyTotal = calculateYearlyTotal(records.filter(r => 
                        r.detailedFundNeedId === record.detailedFundNeedId
                      ), currentYear);
                      
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {record.detailedFundNeed?.subProject?.name || '未知子项目'}
                          </TableCell>
                          <TableCell>
                            {record.detailedFundNeed?.fundType?.name || '未知类型'}
                          </TableCell>
                          <TableCell>
                            {new Intl.NumberFormat('zh-CN', { 
                              style: 'currency', 
                              currency: 'CNY',
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            }).format(yearlyTotal)}
                          </TableCell>
                          {previousRecords.map((prevRecord, index) => (
                            <TableCell key={index}>
                              {prevRecord?.amount !== null && prevRecord?.amount !== undefined
                                ? new Intl.NumberFormat('zh-CN', { 
                                    style: 'currency', 
                                    currency: 'CNY',
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  }).format(prevRecord.amount)
                                : '-'}
                            </TableCell>
                          ))}
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData[record.id]?.amount || ''}
                                onChange={(e) => handleInputChange(record.id, 'amount', e.target.value)}
                                placeholder="金额"
                                className="w-full"
                                disabled={loading}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Textarea
                              value={formData[record.id]?.remark || ''}
                              onChange={(e) => handleInputChange(record.id, 'remark', e.target.value)}
                              placeholder="备注"
                              className="w-full h-10 min-h-0 resize-none"
                              disabled={loading}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
} 