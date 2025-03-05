"use client"

import { useState, useCallback } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { RotateCcw, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { RecordStatus } from "@/lib/enums"
import { Pagination } from "@/components/ui/pagination"

// 历史记录类型
export interface HistoryRecord {
  id: string
  organization: string
  department: string
  category: string
  project: string
  subProject: string
  fundType: string
  year: number
  month: number
  amount: number | null
  status: string
  rawStatus?: string
  submittedAt: string
  remark: string
  canWithdraw: boolean
}

// 历史记录表格属性
export interface HistoryTableProps {
  records: HistoryRecord[]
  loading: boolean
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onViewRecord: (record: HistoryRecord) => void
  onWithdrawalRequest: (record: HistoryRecord) => void
  formatCurrency: (amount: number | null) => string
  hideOperations?: boolean // 添加隐藏操作列的选项
}

export function HistoryTableView({
  records,
  loading,
  total,
  page,
  pageSize,
  onPageChange,
  onViewRecord,
  onWithdrawalRequest,
  formatCurrency,
  hideOperations = false // 默认不隐藏
}: HistoryTableProps) {
  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  
  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>机构</TableHead>
              <TableHead>部门</TableHead>
              <TableHead>项目分类</TableHead>
              <TableHead>项目</TableHead>
              <TableHead>子项目</TableHead>
              <TableHead>资金类型</TableHead>
              <TableHead>金额 (¥)</TableHead>
              <TableHead>月份</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>提交时间</TableHead>
              {!hideOperations && <TableHead>操作</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={hideOperations ? 10 : 11} className="h-24 text-center">
                  正在加载...
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={hideOperations ? 10 : 11} className="h-24 text-center">
                  没有找到历史记录
                </TableCell>
              </TableRow>
            ) : (
              records.map((record) => (
                <TableRow key={record.id} className="cursor-pointer hover:bg-muted/50" onClick={() => onViewRecord(record)}>
                  <TableCell>{record.organization}</TableCell>
                  <TableCell>{record.department}</TableCell>
                  <TableCell>{record.category}</TableCell>
                  <TableCell>{record.project}</TableCell>
                  <TableCell>{record.subProject}</TableCell>
                  <TableCell>{record.fundType}</TableCell>
                  <TableCell>{record.amount !== null ? formatCurrency(record.amount) : "-"}</TableCell>
                  <TableCell>{`${record.year}-${record.month.toString().padStart(2, '0')}`}</TableCell>
                  <TableCell>
                    <Badge variant={record.status === RecordStatus.SUBMITTED ? "secondary" : "outline"}>
                      {record.status === RecordStatus.SUBMITTED 
                        ? "已提交" 
                        : record.status === RecordStatus.DRAFT 
                          ? "草稿" 
                          : record.status === RecordStatus.PENDING_WITHDRAWAL 
                            ? "待撤回" 
                            : record.status === "UNFILLED" 
                              ? "未填报" 
                              : record.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(record.submittedAt).toLocaleString()}</TableCell>
                  {!hideOperations && (
                    <TableCell>
                      {record.canWithdraw && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            onWithdrawalRequest(record)
                          }}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          申请撤回
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* 分页控件 */}
      {!loading && records.length > 0 && (
        <div className="flex justify-between items-center py-4">
          <div className="text-sm text-muted-foreground">
            共 {total} 条记录，第 {page} / {totalPages} 页
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  )
} 