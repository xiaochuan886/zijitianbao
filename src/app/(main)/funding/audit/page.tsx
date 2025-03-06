"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useCurrentUser } from "@/hooks/use-current-user"
import { RecordStatus, Role } from "@/lib/enums"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { 
  Filter, 
  RefreshCw, 
  FileEdit,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from "lucide-react"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"

// 审核记录类型定义
interface AuditableRecord {
  id: string;
  detailedFundNeedId: string;
  year: number;
  month: number;
  userAmount: number | null;
  financeAmount: number | null;
  projectName: string;
  subProjectName: string;
  fundTypeName: string;
  departmentName: string;
  organizationName: string;
  hasDifference: boolean;
  userRecordId: string;
  financeRecordId: string;
  userStatus: string;
  financeStatus: string;
}

// 审核表单验证模式
const auditFormSchema = z.object({
  amount: z.coerce.number().min(0, "金额不能为负数"),
  remark: z.string().optional(),
});

export default function AuditPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isLoading: userLoading } = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<AuditableRecord[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentRecord, setCurrentRecord] = useState<AuditableRecord | null>(null)
  const [isAuditDialogOpen, setIsAuditDialogOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState<{year: number, month: number}>(() => {
    const now = new Date()
    // 获取上个月的年月
    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    return { year, month: prevMonth + 1 } // 月份从1开始
  })

  // 检查用户权限
  const isAuditor = user?.role === Role.AUDITOR || user?.role === Role.ADMIN

  // 获取可审核的记录
  const fetchAuditableRecords = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/audit/records?year=${currentMonth.year}&month=${currentMonth.month}`)
      
      if (!response.ok) {
        throw new Error('获取审核记录失败')
      }
      
      const data = await response.json()
      setRecords(data.items || [])
    } catch (error) {
      console.error('获取审核记录失败:', error)
      toast({
        title: "错误",
        description: "获取审核记录失败，请稍后重试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [currentMonth, toast])

  // 初始加载数据
  useEffect(() => {
    if (!userLoading && user) {
      fetchAuditableRecords()
    }
  }, [fetchAuditableRecords, user, userLoading])

  // 过滤记录
  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records
    
    return records.filter(record => 
      record.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.subProjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.fundTypeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.departmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.organizationName.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [records, searchTerm])

  // 审核表单
  const AuditForm = ({ record }: { record: AuditableRecord }) => {
    const form = useForm<z.infer<typeof auditFormSchema>>({
      resolver: zodResolver(auditFormSchema),
      defaultValues: {
        amount: record.hasDifference ? 0 : (record.userAmount || 0),
        remark: "",
      },
    })

    const onSubmit = async (values: z.infer<typeof auditFormSchema>) => {
      try {
        const response = await fetch('/api/audit/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userRecordId: record.userRecordId,
            financeRecordId: record.financeRecordId,
            amount: values.amount,
            remark: values.remark,
            year: record.year,
            month: record.month,
            detailedFundNeedId: record.detailedFundNeedId,
          }),
        })

        if (!response.ok) {
          throw new Error('提交审核失败')
        }

        toast({
          title: "成功",
          description: "审核结果已提交",
        })
        
        setIsAuditDialogOpen(false)
        fetchAuditableRecords() // 刷新数据
      } catch (error) {
        console.error('提交审核失败:', error)
        toast({
          title: "错误",
          description: "提交审核失败，请稍后重试",
          variant: "destructive",
        })
      }
    }

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>审核金额</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="remark"
            render={({ field }) => (
              <FormItem>
                <FormLabel>审核备注</FormLabel>
                <FormControl>
                  <Textarea placeholder="请输入审核备注" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button type="submit">提交审核</Button>
          </DialogFooter>
        </form>
      </Form>
    )
  }

  // 打开审核对话框
  const handleAudit = (record: AuditableRecord) => {
    setCurrentRecord(record)
    setIsAuditDialogOpen(true)
  }

  // 刷新数据
  const handleRefresh = () => {
    fetchAuditableRecords()
  }

  // 格式化金额显示
  const formatAmount = (amount: number | null) => {
    if (amount === null) return '-'
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // 渲染页面
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">实际支付审核</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {currentMonth.year}年{currentMonth.month}月 实际支付审核
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Input
              placeholder="搜索项目、子项目、部门..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : records.length === 0 ? (
            <div className="flex flex-col justify-center items-center h-64">
              <p className="text-muted-foreground">暂无需要审核的记录</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>项目</TableHead>
                    <TableHead>子项目</TableHead>
                    <TableHead>资金需求类型</TableHead>
                    <TableHead>部门</TableHead>
                    <TableHead>填报人金额</TableHead>
                    <TableHead>财务金额</TableHead>
                    <TableHead>差异</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.projectName}</TableCell>
                      <TableCell>{record.subProjectName}</TableCell>
                      <TableCell>{record.fundTypeName}</TableCell>
                      <TableCell>{record.departmentName}</TableCell>
                      <TableCell>{formatAmount(record.userAmount)}</TableCell>
                      <TableCell>{formatAmount(record.financeAmount)}</TableCell>
                      <TableCell>
                        {record.hasDifference ? (
                          <div className="flex items-center text-amber-500">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            有差异
                          </div>
                        ) : (
                          <div className="flex items-center text-green-500">
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            一致
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleAudit(record)}
                          disabled={!isAuditor}
                        >
                          <FileEdit className="h-4 w-4 mr-1" />
                          审核
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 审核对话框 */}
      <Dialog open={isAuditDialogOpen} onOpenChange={setIsAuditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>审核实际支付记录</DialogTitle>
            <DialogDescription>
              请审核填报人和财务填报的数据，并提交最终审核结果
            </DialogDescription>
          </DialogHeader>
          
          {currentRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">项目</p>
                  <p className="text-sm">{currentRecord.projectName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">子项目</p>
                  <p className="text-sm">{currentRecord.subProjectName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">资金需求类型</p>
                  <p className="text-sm">{currentRecord.fundTypeName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">部门</p>
                  <p className="text-sm">{currentRecord.departmentName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">填报人金额</p>
                  <p className="text-sm">{formatAmount(currentRecord.userAmount)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">财务金额</p>
                  <p className="text-sm">{formatAmount(currentRecord.financeAmount)}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <AuditForm record={currentRecord} />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

