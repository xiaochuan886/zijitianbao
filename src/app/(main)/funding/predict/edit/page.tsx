"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  remark: string
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
  const [remarks, setRemarks] = useState<Record<string, string>>({})
  const [originalRecords, setOriginalRecords] = useState<Record<string, number | null>>({})
  const [originalRemarks, setOriginalRemarks] = useState<Record<string, string>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [nextMonth, setNextMonth] = useState<{year: number, month: number}>({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 2 // 下个月
  })
  
  // 保存各种状态的引用，避免在依赖项中引起循环
  const recordsRef = useRef(records);
  const remarksRef = useRef(remarks);
  const originalRecordsRef = useRef(originalRecords);
  const originalRemarksRef = useRef(originalRemarks);
  const hasChangesRef = useRef(hasChanges);
  const projectsRef = useRef(projects);
  const savingRef = useRef(saving);
  
  // 更新引用
  useEffect(() => {
    recordsRef.current = records;
  }, [records]);
  
  useEffect(() => {
    remarksRef.current = remarks;
  }, [remarks]);
  
  useEffect(() => {
    originalRecordsRef.current = originalRecords;
  }, [originalRecords]);
  
  useEffect(() => {
    originalRemarksRef.current = originalRemarks;
  }, [originalRemarks]);
  
  useEffect(() => {
    hasChangesRef.current = hasChanges;
  }, [hasChanges]);
  
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);
  
  useEffect(() => {
    savingRef.current = saving;
  }, [saving]);
  
  // 获取当前月份的下一个月
  const getNextMonth = useCallback(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 2 // +1 是下个月，+1 是因为 getMonth() 从 0 开始
    return { year, month }
  }, []);
  
  // 格式化金额
  const formatCurrency = useCallback((amount: number | null) => {
    if (amount === null) return ""
    return new Intl.NumberFormat("zh-CN", {
      style: "currency",
      currency: "CNY",
    }).format(amount)
  }, []);
  
  // 检查是否有变更
  const checkForChanges = useCallback(() => {
    // 使用引用访问最新状态，避免依赖项更新导致的循环
    const currentRecords = recordsRef.current;
    const currentRemarks = remarksRef.current;
    const currentOriginalRecords = originalRecordsRef.current;
    const currentOriginalRemarks = originalRemarksRef.current;
    
    const hasRecordChanges = Object.keys(currentRecords).some(key => {
      const original = currentOriginalRecords[key] === null ? null : currentOriginalRecords[key];
      const current = currentRecords[key] === null ? null : currentRecords[key];
      return original !== current;
    });
    
    const hasRemarkChanges = Object.keys(currentRemarks).some(key => {
      return currentOriginalRemarks[key] !== currentRemarks[key];
    });
    
    return hasRecordChanges || hasRemarkChanges;
  }, []);
  
  // 保存草稿函数
  const saveDraft = useCallback(async () => {
    // 先检查是否有变更
    const shouldSave = checkForChanges();
    if (!shouldSave || savingRef.current) return;
    
    try {
      setSaving(true);
      
      // 收集临时记录信息，提供更多上下文
      const tempRecords = Object.entries(recordsRef.current)
        .filter(([id]) => id.startsWith('temp-'))
        .map(([id, value]) => {
          const parts = id.split('-');
          if (parts.length >= 5) {
            return {
              id,
              subProjectId: parts[1],
              fundTypeId: parts[2],
              year: parseInt(parts[3]),
              month: parseInt(parts[4]),
              value,
              remark: remarksRef.current[id] || ""
            };
          }
          return null;
        })
        .filter(Boolean);
      
      // 减少不必要的日志输出
      console.log(`保存草稿: ${Object.keys(recordsRef.current).length}条记录，${tempRecords.length}条临时记录`);
      
      // 调用API保存，使用完整的记录对象
      const response = await fetch("/api/funding/predict/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: recordsRef.current,
          remarks: remarksRef.current,
          projectInfo: {
            tempRecords,
            nextMonth: nextMonth
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "保存草稿失败");
      }
      
      // 更新原始记录
      setOriginalRecords({...recordsRef.current});
      setOriginalRemarks({...remarksRef.current});
      setHasChanges(false);
      
      toast({
        title: "已保存",
        description: "草稿已自动保存",
      });
    } catch (error) {
      console.error("保存草稿失败", error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "保存草稿失败",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }, [toast, checkForChanges, nextMonth]);
  
  // 创建防抖函数
  const debouncedSaveDraft = useRef(
    debounce(() => {
      saveDraft();
    }, 2000)
  ).current;
  
  // 处理输入变化
  const handleInputChange = useCallback((recordId: string, value: string) => {
    const numValue = value === "" ? null : parseFloat(value);
    setRecords(prev => {
      // 避免不必要的更新
      if (prev[recordId] === numValue) return prev;
      return { ...prev, [recordId]: numValue };
    });
  }, []);
  
  // 处理备注变化
  const handleRemarkChange = useCallback((recordId: string, value: string) => {
    setRemarks(prev => {
      // 避免不必要的更新
      if (prev[recordId] === value) return prev;
      return { ...prev, [recordId]: value };
    });
  }, []);
  
  // 计算年度汇总
  const calculateYearTotal = useCallback((subProjectId: string, fundTypeId: string) => {
    let total = 0;
    const currentProjects = projectsRef.current;
    const currentRecords = recordsRef.current;
    
    currentProjects.forEach(project => {
      project.subProjects.forEach(subProject => {
        if (subProject.id === subProjectId) {
          subProject.fundTypes.forEach(fundType => {
            if (fundType.id === fundTypeId) {
              fundType.records.forEach(record => {
                // 只计算有效的记录
                if (record.predicted !== null) {
                  total += record.predicted;
                } else {
                  // 对于当前月份的临时记录，从currentRecords中获取值
                  const recordKey = record.id;
                  if (currentRecords[recordKey] !== null && currentRecords[recordKey] !== undefined) {
                    total += currentRecords[recordKey] as number;
                  }
                }
              });
            }
          });
        }
      });
    });
    
    return total;
  }, []);
  
  // 手动保存
  const handleSave = useCallback(async () => {
    if (!hasChangesRef.current) return;
    
    try {
      setSaving(true);
      
      // 收集临时记录信息，提供更多上下文
      const tempRecords = Object.entries(recordsRef.current)
        .filter(([id]) => id.startsWith('temp-'))
        .map(([id, value]) => {
          const parts = id.split('-');
          if (parts.length >= 5) {
            return {
              id,
              subProjectId: parts[1],
              fundTypeId: parts[2],
              year: parseInt(parts[3]),
              month: parseInt(parts[4]),
              value,
              remark: remarksRef.current[id] || ""
            };
          }
          return null;
        })
        .filter(Boolean);
      
      // 减少不必要的日志输出
      console.log(`手动保存: ${Object.keys(recordsRef.current).length}条记录，${tempRecords.length}条临时记录`);
      
      // 调用API保存，使用完整的记录对象
      const response = await fetch("/api/funding/predict/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: recordsRef.current,
          remarks: remarksRef.current,
          projectInfo: {
            tempRecords,
            nextMonth: nextMonth
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "保存失败");
      }
      
      // 更新原始记录
      setOriginalRecords({...recordsRef.current});
      setOriginalRemarks({...remarksRef.current});
      setHasChanges(false);
      
      // 显示自动消失的成功提示
      const { dismiss } = toast({
        title: "成功",
        description: "数据已保存",
        duration: 2000, // 2秒后自动消失
      });
      
      // 为确保提示消失，无论duration是否生效
      setTimeout(() => {
        dismiss();
      }, 2000);
      
    } catch (error) {
      console.error("保存失败", error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "保存失败",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  }, [toast]);
  
  // 提交
  const handleSubmit = useCallback(async () => {
    try {
      setSubmitting(true);
      
      let hasEmptyValues = false;
      
      Object.entries(recordsRef.current).forEach(([recordId, value]) => {
        if (value === null) {
          hasEmptyValues = true;
        }
      });
      
      // 收集临时记录信息
      const tempRecords = Object.entries(recordsRef.current)
        .filter(([id]) => id.startsWith('temp-'))
        .map(([id, value]) => {
          const parts = id.split('-');
          if (parts.length >= 5) {
            return {
              id,
              subProjectId: parts[1],
              fundTypeId: parts[2],
              year: parseInt(parts[3]),
              month: parseInt(parts[4]),
              value,
              remark: remarksRef.current[id] || ""
            };
          }
          return null;
        })
        .filter(Boolean);
      
      // 数据校验
      if (hasEmptyValues) {
        toast({
          title: "警告",
          description: "存在未填写的数据，请填写完整后提交",
          variant: "destructive"
        });
        setSubmitting(false);
        return;
      }
      
      // 调用API提交
      const response = await fetch("/api/funding/predict/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: recordsRef.current,
          remarks: remarksRef.current,
          projectInfo: {
            tempRecords,
            nextMonth: nextMonth
          }
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "提交失败");
      }
      
      toast({
        title: "成功",
        description: "数据已提交",
      });
      
      // 提交成功后返回列表页
      router.push("/funding/predict");
    } catch (error) {
      console.error("提交失败", error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "提交失败",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  }, [router, toast, nextMonth]);
  
  // 获取项目数据
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 获取查询参数
      const id = searchParams.get("id");
      const ids = searchParams.get("ids");
      const year = searchParams.get("year") || new Date().getFullYear().toString();
      const month = searchParams.get("month") || (new Date().getMonth() + 2).toString();
      
      setNextMonth({
        year: parseInt(year),
        month: parseInt(month)
      });
      
      if (!ids && !id) {
        toast({
          title: "错误",
          description: "缺少必要的项目ID参数",
          variant: "destructive"
        });
        router.push("/funding/predict");
        return;
      }
      
      // 构建API请求
      const fetchPromises = [];
      
      if (id) {
        // 单个项目
        fetchPromises.push(
          fetch(`/api/funding/predict/${id}?year=${year}&month=${month}`)
            .then(response => {
              if (!response.ok) {
                throw new Error("获取项目详情失败");
              }
              return response.json();
            })
        );
      } else if (ids) {
        // 多个项目
        const idArray = ids.split(',');
        for (const projectId of idArray) {
          fetchPromises.push(
            fetch(`/api/funding/predict/${projectId}?year=${year}&month=${month}`)
              .then(response => {
                if (!response.ok) {
                  throw new Error(`获取项目 ${projectId} 详情失败`);
                }
                return response.json();
              })
          );
        }
      }
      
      const projectsData = await Promise.all(fetchPromises);
      
      // 移除过多的日志输出，保留最关键的
      console.log(`成功获取到${projectsData.length}个项目的数据`);
      
      setProjects(projectsData);
      
      // 初始化记录和备注
      const initialRecords: Record<string, number | null> = {};
      const initialRemarks: Record<string, string> = {};
      
      projectsData.forEach(project => {
        project.subProjects.forEach((subProject: any) => {
          subProject.fundTypes.forEach((fundType: any) => {
            // 检查是否存在当前月份的记录
            const currentMonthRecords = fundType.records.filter(
              (record: FundRecord) => record.year === parseInt(year) && record.month === parseInt(month)
            );
            
            // 如果没有当前月份的记录，需要确保有相关记录显示
            if (currentMonthRecords.length === 0) {
              // 创建一个前端临时记录对象用于显示
              const tempRecord: FundRecord = {
                id: `temp-${subProject.id}-${fundType.id}-${year}-${month}`,
                subProjectId: subProject.id,
                subProjectName: subProject.name,
                fundTypeId: fundType.id,
                fundTypeName: fundType.name,
                year: parseInt(year),
                month: parseInt(month),
                predicted: null,
                status: "draft",
                remark: ""
              };
              
              // 添加到fundType.records中
              fundType.records.push(tempRecord);
              
              // 同时添加到初始记录和备注中
              initialRecords[tempRecord.id] = null;
              initialRemarks[tempRecord.id] = "";
            }
            
            // 正常处理所有记录
            fundType.records.forEach((record: FundRecord) => {
              if (record.year === parseInt(year) && record.month === parseInt(month)) {
                initialRecords[record.id] = record.predicted;
                initialRemarks[record.id] = record.remark || "";
              }
            });
          });
        });
      });
      
      // 移除过多的日志输出
      console.log(`初始化了${Object.keys(initialRecords).length}条记录`);
      
      setRecords(initialRecords);
      setRemarks(initialRemarks);
      setOriginalRecords({...initialRecords});
      setOriginalRemarks({...initialRemarks});
      setLoading(false);
    } catch (error) {
      console.error("获取数据失败", error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "获取数据失败",
        variant: "destructive"
      });
      setLoading(false);
      router.push("/funding/predict");
    }
  }, [searchParams, toast, router]);
  
  // 监听记录和备注变化，检查是否有变更并更新hasChanges状态
  useEffect(() => {
    const hasChange = checkForChanges();
    
    // 只有在变化状态与当前不同时才更新状态
    if (hasChange !== hasChanges) {
      setHasChanges(hasChange);
    }
  }, [records, remarks, checkForChanges, hasChanges]);
  
  // 初始化，移除组件卸载时自动保存的逻辑
  useEffect(() => {
    fetchData();
    
    // 组件卸载时不再自动保存
    // return () => {
    //   if (hasChangesRef.current) {
    //     saveDraft();
    //   }
    // };
  }, [fetchData]);
  
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
                        <TableHead className="w-[150px]">年度汇总</TableHead>
                        {/* 历史月份 */}
                        {[1, 2, 3].filter(month => month < nextMonth.month).map(month => (
                          <TableHead key={month} className="w-[150px]">
                            {`${nextMonth.year}-${month.toString().padStart(2, '0')} (已提交)`}
                          </TableHead>
                        ))}
                        {/* 当前月份 */}
                        <TableHead className="w-[150px]">
                          {`${nextMonth.year}-${nextMonth.month.toString().padStart(2, '0')} (可填报)`}
                        </TableHead>
                        <TableHead className="w-[200px]">备注</TableHead>
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
                            {[1, 2, 3].filter(month => month < nextMonth.month).map(month => {
                              const record = fundType.records.find(r => r.month === month && r.year === nextMonth.year);
                              return (
                                <TableCell key={month}>
                                  {record ? formatCurrency(record.predicted) : ""}
                                </TableCell>
                              );
                            })}
                            {/* 当前月份数据（可填报） */}
                            <TableCell>
                              {fundType.records
                                .filter(record => {
                                  // 确保只显示当前填报月份的记录，移除console.log
                                  return record.year === nextMonth.year && record.month === nextMonth.month;
                                })
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
                            {/* 备注 */}
                            <TableCell>
                              {fundType.records
                                .filter(record => record.year === nextMonth.year && record.month === nextMonth.month)
                                .map(record => (
                                  <Textarea
                                    key={record.id}
                                    value={remarks[record.id] || ""}
                                    onChange={(e) => handleRemarkChange(record.id, e.target.value)}
                                    placeholder="请输入备注"
                                    className="w-full resize-none"
                                    rows={2}
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