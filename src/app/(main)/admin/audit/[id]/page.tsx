"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle, ArrowLeft, Save, Filter, ArrowUpDown } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";

interface Organization {
  id: string;
  name: string;
  code: string;
}

interface AuditRecord {
  id: string;
  detailedFundNeedId: string;
  year: number;
  month: number;
  departmentName: string;
  projectName: string;
  subProjectName: string;
  fundTypeName: string;
  userAmount: number;
  userStatus: string;
  userSubmittedBy: string;
  userSubmittedAt: string;
  financeRecordId: string;
  financeAmount: number;
  financeStatus: string;
  financeSubmittedBy: string;
  financeSubmittedAt: string;
  auditRecordId?: string;
  auditAmount?: number;
  auditStatus?: string;
  auditRemark?: string;
  needsAudit: boolean;
  canEdit: boolean;
  hasDifference?: boolean;
  auditResult?: string;
}

interface AuditData {
  organization: Organization;
  records: AuditRecord[];
  currentPeriod: {
    year: number;
    month: number;
  };
  stats: {
    total: number;
    pending: number;
    audited: number;
    inconsistent: number;
    notAuditable?: number;
  };
}

type SortField = 'departmentName' | 'projectName' | 'subProjectName' | 'fundTypeName' | 'userAmount' | 'financeAmount' | 'difference';
type SortDirection = 'asc' | 'desc';

export default function OrganizationAuditPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [auditResults, setAuditResults] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(false);
  
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    const fetchOrganizationRecords = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/audit/organizations/${params.id}/records`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "获取机构审核记录失败");
        }

        const processedRecords = data.data.records.map((record: AuditRecord) => {
          const hasDifference = record.userAmount !== record.financeAmount;
          const auditResult = hasDifference ? "" : record.financeAmount?.toString();
          
          return {
            ...record,
            hasDifference,
            auditResult
          };
        });

        // 计算不一致记录数量
        const inconsistentCount = processedRecords.filter((record: AuditRecord) => record.hasDifference).length;

        setAuditData({
          ...data.data,
          records: processedRecords,
          stats: {
            ...data.data.stats,
            inconsistent: inconsistentCount
          }
        });

        const initialResults: Record<string, string> = {};
        processedRecords.forEach((record: AuditRecord) => {
          if (!record.hasDifference) {
            initialResults[record.id] = record.financeAmount?.toString() || '';
          }
        });
        setAuditResults(initialResults);
      } catch (err) {
        console.error("获取机构审核记录失败:", err);
        setError(err instanceof Error ? err.message : "获取机构审核记录失败");
        toast.error("获取机构审核记录失败");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationRecords();
  }, [params.id]);

  useEffect(() => {
    if (auditData?.records) {
      if (selectAll) {
        const newSelected = new Set<string>();
        auditData.records.forEach(record => {
          if (record.needsAudit) {
            newSelected.add(record.id);
          }
        });
        setSelectedRecords(newSelected);
      } else if (selectedRecords.size === auditData.records.filter(r => r.needsAudit).length) {
        setSelectedRecords(new Set());
      }
    }
  }, [selectAll, auditData]);

  const handleSelectRecord = (recordId: string, checked: boolean) => {
    const newSelected = new Set(selectedRecords);
    if (checked) {
      newSelected.add(recordId);
    } else {
      newSelected.delete(recordId);
    }
    setSelectedRecords(newSelected);
    
    if (auditData?.records) {
      const needsAuditCount = auditData.records.filter(r => r.needsAudit).length;
      setSelectAll(newSelected.size === needsAuditCount && needsAuditCount > 0);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
  };

  const handleAuditResultChange = (recordId: string, value: string) => {
    setAuditResults({
      ...auditResults,
      [recordId]: value
    });
  };

  const handleSaveAuditResults = async () => {
    if (Object.keys(auditResults).length === 0) {
      toast.error("请至少填写一条审核结果");
      return;
    }

    try {
      setIsSaving(true);
      
      const recordsToSave = Object.entries(auditResults).map(([id, auditResult]) => {
        // 如果审核结果为空，则设置为null
        const trimmedResult = auditResult.trim();
        // 转换为数字或null
        const numericResult = trimmedResult ? parseFloat(trimmedResult) : null;
        
        return {
          id,
          auditResult: trimmedResult || null,
          amount: numericResult
        };
      });

      // 记录日志，帮助调试
      console.log("准备保存的审核结果:", recordsToSave);

      const response = await fetch(`/api/audit/organizations/${params.id}/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: recordsToSave
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "保存审核结果失败");
      }

      toast.success(data.message || "审核结果已保存");
      
      // 更新本地状态
      if (auditData) {
        const updatedRecords = auditData.records.map(record => {
          if (auditResults[record.id]) {
            const numericValue = parseFloat(auditResults[record.id]) || record.financeAmount;
            return {
              ...record,
              auditResult: auditResults[record.id],
              auditRemark: auditResults[record.id],
              auditAmount: numericValue
            };
          }
          return record;
        });
        
        setAuditData({
          ...auditData,
          records: updatedRecords
        });
      }
    } catch (err) {
      console.error("保存审核结果失败:", err);
      toast.error(err instanceof Error ? err.message : "保存审核结果失败");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReviewSubmit = async () => {
    if (selectedRecords.size === 0) {
      toast.error("请至少选择一条记录进行审核");
      return;
    }

    const missingResults = Array.from(selectedRecords).filter(id => !auditResults[id]);
    if (missingResults.length > 0) {
      toast.error(`有 ${missingResults.length} 条记录未填写审核结果`);
      return;
    }

    try {
      setSubmitting(true);
      
      const recordsToSubmit = auditData?.records
        .filter(record => selectedRecords.has(record.id))
        .map(record => ({
          id: record.id,
          financeRecordId: record.financeRecordId,
          detailedFundNeedId: record.detailedFundNeedId,
          amount: parseFloat(auditResults[record.id]) || 0,
        }));

      const response = await fetch(`/api/audit/organizations/${params.id}/audit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: recordsToSubmit,
          remark: remark,
          year: auditData?.currentPeriod.year,
          month: auditData?.currentPeriod.month,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "审核提交失败");
      }

      toast.success(data.message || "审核提交成功");
      setIsReviewDialogOpen(false);
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error("审核提交失败:", err);
      toast.error(err instanceof Error ? err.message : "审核提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackClick = () => {
    router.push("/admin/audit");
  };

  const handleFilter = (field: string, value: string) => {
    setFilters({
      ...filters,
      [field]: value
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedRecords = useMemo(() => {
    if (!auditData?.records) return [];

    let result = auditData.records.filter(record => {
      return Object.entries(filters).every(([field, value]) => {
        if (!value) return true;
        
        if (field === 'difference') {
          // 特殊处理差异列的筛选
          if (value === 'inconsistent') {
            return record.hasDifference === true;
          } else if (value === 'consistent') {
            return record.hasDifference === false;
          }
          return true;
        }
        
        const recordValue = record[field as keyof AuditRecord];
        return String(recordValue).toLowerCase().includes(value.toLowerCase());
      });
    });

    if (sortField) {
      result = [...result].sort((a, b) => {
        // 特殊处理差异列的排序
        if (sortField === 'difference') {
          const aValue = a.hasDifference ? 1 : 0;
          const bValue = b.hasDifference ? 1 : 0;
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        const aString = String(aValue).toLowerCase();
        const bString = String(bValue).toLowerCase();
        
        if (sortDirection === 'asc') {
          return aString.localeCompare(bString);
        } else {
          return bString.localeCompare(aString);
        }
      });
    }

    return result;
  }, [auditData?.records, filters, sortField, sortDirection]);

  // 在渲染页面前计算实际要显示的记录
  const recordsToDisplay = useMemo(() => {
    if (!auditData?.records) return [];
    
    // 初始筛选后的记录
    let filtered = filteredAndSortedRecords;
    
    // 如果不是显示所有记录模式，只显示需要审核的记录
    if (!showAllRecords) {
      filtered = filtered.filter(record => record.needsAudit);
    }
    
    return filtered;
  }, [filteredAndSortedRecords, showAllRecords, auditData]);

  // 计算不同类型记录的数量，用于显示
  const recordCounts = useMemo(() => {
    if (!auditData?.records) return { total: 0, auditable: 0, submitted: 0, needsAudit: 0 };
    
    const total = auditData.records.length;
    const auditable = auditData.records.filter(r => r.financeRecordId).length;
    const submitted = auditData.records.filter(r => r.auditStatus === "APPROVED").length;
    const needsAudit = auditData.records.filter(r => r.needsAudit).length;
    
    return { total, auditable, submitted, needsAudit };
  }, [auditData]);

  if (loading) {
    return (
      <div className="container max-w-full px-2 py-6">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" className="mr-4" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <h1 className="text-2xl font-bold">机构审核详情</h1>
        </div>
        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-6 w-1/3 mb-2" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent>
            <div className="flex space-x-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </CardContent>
        </Card>
        <div className="rounded-md border">
          <div className="p-4">
            <Skeleton className="h-10 w-full mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-full px-2 py-6">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" className="mr-4" onClick={handleBackClick}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <h1 className="text-2xl font-bold">机构审核详情</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center text-red-700">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!auditData) {
    return null;
  }

  const { organization, records, currentPeriod, stats } = auditData;
  const hasRecordsToAudit = records.some(record => record.needsAudit);

  const renderFilterDropdown = (field: string, label: string) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <span className="sr-only">筛选 {label}</span>
          <Filter className={`h-4 w-4 ${filters[field] ? "text-primary" : ""}`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>筛选 {label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {field === 'difference' ? (
          // 针对差异列的特殊筛选选项
          <>
            <DropdownMenuItem onClick={() => handleFilter(field, '')}>
              全部
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilter(field, 'consistent')}>
              相同
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFilter(field, 'inconsistent')}>
              不一致
            </DropdownMenuItem>
          </>
        ) : (
          // 其他列的通用筛选
          <>
            <div className="p-2">
              <Input
                placeholder={`输入${label}...`}
                value={filters[field] || ''}
                onChange={(e) => handleFilter(field, e.target.value)}
                className="h-8 w-full"
              />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleFilter(field, '')}>
              清除筛选
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderSortButton = (field: SortField, label: string) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 ml-1"
      onClick={() => handleSort(field)}
    >
      <span className="sr-only">排序 {label}</span>
      <ArrowUpDown className={`h-4 w-4 ${sortField === field ? 'text-primary' : ''}`} />
    </Button>
  );

  return (
    <div className="container max-w-full px-2 py-6">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" className="mr-4" onClick={handleBackClick}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <h1 className="text-2xl font-bold">机构审核详情</h1>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <span>{organization.name}</span>
            <Badge variant="outline">{organization.code}</Badge>
          </CardTitle>
          <CardDescription>
            {currentPeriod.year}年{currentPeriod.month}月审核
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">总记录:</span>
              <Badge variant="outline">{stats.total}</Badge>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">待审核:</span>
              <Badge variant="destructive">{stats.pending}</Badge>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">已审核:</span>
              <Badge variant="secondary">{stats.audited}</Badge>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">不一致记录:</span>
              <Badge variant="destructive">{stats.inconsistent || 0}</Badge>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-0 flex justify-between">
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleSaveAuditResults}
              disabled={isSaving || Object.keys(auditResults).length === 0}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  保存审核结果
                </>
              )}
            </Button>
            
            <Button 
              variant={showAllRecords ? "default" : "outline"}
              onClick={() => setShowAllRecords(!showAllRecords)}
            >
              {showAllRecords ? '只显示待审核' : '显示所有记录'}
            </Button>
          </div>
          
          <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="ml-2"
                disabled={selectedRecords.size === 0}
              >
                批量审核 ({selectedRecords.size}/{stats.pending})
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>批量审核确认</DialogTitle>
                <DialogDescription>
                  您将审核 {selectedRecords.size} 条记录，请确认操作。
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <label htmlFor="remark" className="text-sm font-medium mb-2 block">
                  审核备注 (可选)
                </label>
                <Textarea
                  id="remark"
                  placeholder="请输入审核备注..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
                  取消
                </Button>
                <Button 
                  onClick={handleReviewSubmit}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      确认审核
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>

      {recordsToDisplay.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700">
          {showAllRecords ? '当前没有任何记录' : '当前没有需要审核的记录'}
          {!showAllRecords && recordCounts.total > 0 && (
            <Button 
              variant="link" 
              onClick={() => setShowAllRecords(true)}
              className="ml-2 p-0 h-auto text-blue-600"
            >
              显示所有记录 ({recordCounts.total})
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-md border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {hasRecordsToAudit && (
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectAll} 
                        onCheckedChange={handleSelectAll}
                        disabled={!hasRecordsToAudit}
                      />
                    </TableHead>
                  )}
                  <TableHead className="whitespace-nowrap">
                    部门
                    {renderFilterDropdown('departmentName', '部门')}
                    {renderSortButton('departmentName', '部门')}
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    项目类型
                    {renderFilterDropdown('projectName', '项目类型')}
                    {renderSortButton('projectName', '项目类型')}
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    项目
                    {renderFilterDropdown('projectName', '项目')}
                    {renderSortButton('projectName', '项目')}
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    子项目
                    {renderFilterDropdown('subProjectName', '子项目')}
                    {renderSortButton('subProjectName', '子项目')}
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    资金类型
                    {renderFilterDropdown('fundTypeName', '资金类型')}
                    {renderSortButton('fundTypeName', '资金类型')}
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    填报人金额
                    {renderSortButton('userAmount', '填报人金额')}
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    财务金额
                    {renderSortButton('financeAmount', '财务金额')}
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    差异
                    {renderFilterDropdown('difference', '差异')}
                    {renderSortButton('difference', '差异')}
                  </TableHead>
                  <TableHead className="whitespace-nowrap">审核结果</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recordsToDisplay.map((record) => {
                  const hasDifference = record.userAmount !== record.financeAmount;
                  const hasAuditResult = auditResults[record.id] !== undefined && auditResults[record.id] !== "";
                  const isSubmitted = record.auditStatus === "APPROVED";
                  const noFinanceRecord = !record.financeRecordId;
                  
                  return (
                    <TableRow 
                      key={record.id} 
                      className={
                        isSubmitted
                          ? "bg-gray-50" 
                          : hasDifference && !hasAuditResult && record.needsAudit
                            ? "border-2 border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                            : noFinanceRecord
                              ? "bg-yellow-50"
                              : ""
                      }
                    >
                      {hasRecordsToAudit && (
                        <TableCell>
                          <Checkbox 
                            checked={selectedRecords.has(record.id)}
                            onCheckedChange={(checked) => handleSelectRecord(record.id, !!checked)}
                            disabled={!record.needsAudit || isSubmitted || noFinanceRecord}
                          />
                        </TableCell>
                      )}
                      <TableCell>{record.departmentName}</TableCell>
                      <TableCell>{record.projectName}</TableCell>
                      <TableCell>{record.projectName}</TableCell>
                      <TableCell>{record.subProjectName}</TableCell>
                      <TableCell>{record.fundTypeName}</TableCell>
                      <TableCell className="text-right">
                        <div className="font-mono">{formatCurrency(record.userAmount)}</div>
                        <div className="text-xs text-gray-500">{record.userSubmittedBy}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-mono">{formatCurrency(record.financeAmount)}</div>
                        <div className="text-xs text-gray-500">{record.financeSubmittedBy}</div>
                      </TableCell>
                      <TableCell>
                        {hasDifference ? (
                          <Badge variant="destructive">不一致</Badge>
                        ) : (
                          <Badge variant="secondary">相同</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isSubmitted ? (
                          <div className="font-mono">{formatCurrency(record.auditAmount || 0)}</div>
                        ) : record.needsAudit ? (
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-32"
                            value={auditResults[record.id] || ''}
                            onChange={(e) => handleAuditResultChange(record.id, e.target.value)}
                            placeholder={hasDifference ? "请输入" : record.financeAmount?.toString()}
                            disabled={isSubmitted || noFinanceRecord} // 已提交或没有财务记录的禁用输入框
                          />
                        ) : (
                          <Badge variant="outline">
                            {noFinanceRecord ? "无财务记录" : "无需审核"}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
} 