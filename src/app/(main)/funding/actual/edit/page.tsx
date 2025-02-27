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
import { Separator } from "@/components/ui/separator"

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
  actualUser: number | null
  actualFinance: number | null
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

export default function ActualEditPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  
  // 获取角色参数，默认为user
  const role = searchParams.get('role') || 'user'
  const isUserRole = role === 'user'
  
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
      const response = await fetch("/api/funding/actual/save", {
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
  const calculateYearTotal = useCallback((subProjectId: string, fundTypeId: string, year: number) => {
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
  
  // 获取临时记录列表
  const getTempRecords = useCallback(() => {
    const tempRecords = [];
    
    for (const recordId in recordsRef.current) {
      if (recordId.startsWith('temp-')) {
        const [_, subProjectId, fundTypeId, year, month] = recordId.split('-');
        
        if (subProjectId && fundTypeId && year && month) {
          const amount = recordsRef.current[recordId];
          const remark = remarksRef.current[recordId] || "";
          
          if (amount !== null) {
            tempRecords.push({
              id: recordId,
              subProjectId,
              fundTypeId,
              year: parseInt(year),
              month: parseInt(month),
              value: amount,
              remark
            });
          }
        }
      }
    }
    
    return tempRecords;
  }, []);
  
  // 保存更改
  const saveChanges = useCallback(async () => {
    if (!hasChangesRef.current) {
      toast({
        title: "信息",
        description: "没有需要保存的更改",
      });
      return;
    }
    
    if (savingRef.current) return;
    
    try {
      setSaving(true);
      savingRef.current = true;
      
      // 获取所有已修改的记录
      const changedRecords: Record<string, number | null> = {};
      const changedRemarks: Record<string, string> = {};
      
      Object.keys(recordsRef.current).forEach((key) => {
        if (recordsRef.current[key] !== originalRecordsRef.current[key]) {
          changedRecords[key] = recordsRef.current[key];
        }
      });
      
      Object.keys(remarksRef.current).forEach((key) => {
        if (remarksRef.current[key] !== originalRemarksRef.current[key]) {
          changedRemarks[key] = remarksRef.current[key];
        }
      });
      
      // 准备要提交的项目数据
      const projectInfo = {
        projectIds: projectsRef.current.map(p => p.id),
        nextMonth: nextMonth,
        tempRecords: getTempRecords(),
      };
      
      // 调用API保存更改
      const response = await fetch("/api/funding/actual/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: changedRecords,
          remarks: changedRemarks,
          projectInfo,
          isUserReport: isUserRole
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "保存失败");
      }
      
      const result = await response.json();
      
      // 更新原始记录，以便下次比较
      setOriginalRecords({...recordsRef.current});
      setOriginalRemarks({...remarksRef.current});
      originalRecordsRef.current = {...recordsRef.current};
      originalRemarksRef.current = {...remarksRef.current};
      
      // 重置变更标记
      setHasChanges(false);
      hasChangesRef.current = false;
      
      toast({
        title: "保存成功",
        description: `已保存 ${result.created + result.updated} 条记录`,
      });
    } catch (error) {
      console.error("保存失败", error);
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "保存失败",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  }, [nextMonth, toast, isUserRole]);
  
  // 防抖保存，避免频繁调用API
  const debouncedSave = useCallback(
    debounce(() => {
      if (hasChangesRef.current) {
        saveChanges();
      }
    }, 2000),
    [saveChanges]
  );
  
  // 提交项目
  const handleSubmit = useCallback(async () => {
    // 先保存所有更改
    if (hasChangesRef.current) {
      await saveChanges();
    }
    
    try {
      setSubmitting(true);
      
      // 准备要提交的项目数据
      const projectInfo = {
        projectIds: projectsRef.current.map(p => p.id),
        nextMonth: nextMonth,
        tempRecords: getTempRecords(),
      };
      
      // 调用API提交实际支付
      const response = await fetch("/api/funding/actual/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: recordsRef.current,
          remarks: remarksRef.current,
          projectInfo,
          isUserReport: isUserRole
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "提交失败");
      }
      
      const result = await response.json();
      
      toast({
        title: "提交成功",
        description: `已提交 ${result.count} 条记录`,
      });
      
      // 返回列表页
      router.push("/funding/actual");
    } catch (error) {
      console.error("提交失败", error);
      toast({
        title: "提交失败",
        description: error instanceof Error ? error.message : "提交失败",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  }, [saveChanges, nextMonth, getTempRecords, router, toast, isUserRole]);
  
  // 获取项目数据
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // 获取查询参数
      const ids = searchParams.get("ids");
      const id = searchParams.get("id");
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
        router.push("/funding/actual");
        return;
      }
      
      // 构造API请求URL
      const url = ids 
        ? `/api/funding/actual/batch?ids=${ids}&year=${year}&month=${month}&role=${role}` 
        : `/api/funding/actual/${id}?year=${year}&month=${month}&role=${role}`;
      
      // 获取项目数据
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error("获取项目详情失败");
      }
      
      const data = await response.json();
      
      // 处理批量和单个项目的数据结构差异
      const projectsData = Array.isArray(data) ? data : [data];
      setProjects(projectsData);
      projectsRef.current = projectsData;
      
      // 初始化记录和备注
      const initialRecords: Record<string, number | null> = {};
      const initialRemarks: Record<string, string> = {};
      
      projectsData.forEach((project) => {
        project.subProjects.forEach((subProject) => {
          subProject.fundTypes.forEach((fundType) => {
            if (fundType.records.length === 0) {
              // 如果没有记录，创建临时记录
              const tempId = `temp-${subProject.id}-${fundType.id}-${year}-${month}`;
              initialRecords[tempId] = null;
              initialRemarks[tempId] = "";
            } else {
              fundType.records.forEach((record: FundRecord) => {
                // 根据角色获取对应的值
                initialRecords[record.id] = isUserRole ? record.actualUser : record.actualFinance;
                initialRemarks[record.id] = record.remark || "";
              });
            }
          });
        });
      });
      
      setRecords(initialRecords);
      setRemarks(initialRemarks);
      setOriginalRecords({...initialRecords});
      setOriginalRemarks({...initialRemarks});
      
      // 更新引用
      recordsRef.current = initialRecords;
      remarksRef.current = initialRemarks;
      originalRecordsRef.current = {...initialRecords};
      originalRemarksRef.current = {...initialRemarks};
      
      setLoading(false);
    } catch (error) {
      console.error("获取数据失败", error);
      toast({
        title: "错误",
        description: error instanceof Error ? error.message : "获取数据失败",
        variant: "destructive"
      });
      setLoading(false);
      router.push("/funding/actual");
    }
  }, [searchParams, toast, router, role, isUserRole]);
  
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
                    {project.subProjects.map((subProject: {
                      id: string;
                      name: string;
                      fundTypes: {
                        id: string;
                        name: string;
                        records: FundRecord[];
                      }[];
                    }) => (
                      subProject.fundTypes.map((fundType: {
                        id: string;
                        name: string;
                        records: FundRecord[];
                      }) => {
                        // 获取当前月所有记录
                        const currentMonthRecords = fundType.records.filter(
                          r => r.year === nextMonth.year && r.month === nextMonth.month
                        );
                        
                        // 如果没有当月记录，使用临时ID
                        const recordId = currentMonthRecords.length > 0 
                          ? currentMonthRecords[0].id 
                          : `temp-${subProject.id}-${fundType.id}-${nextMonth.year}-${nextMonth.month}`;
                        
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
                              {calculateYearTotal(subProject.id, fundType.id, nextMonth.year)}
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
                        );
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