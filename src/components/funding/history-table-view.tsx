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
import { RotateCcw } from "lucide-react"
import { RecordStatus } from "@/lib/enums"
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

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
  formatCurrency
}: HistoryTableProps) {
  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  
  // 生成分页数字
  const getPaginationItems = useCallback(() => {
    const items = []
    const maxVisiblePages = 5 // 最多显示的页码数量
    
    // 确保页码在有效范围内
    let currentPage = Math.max(1, Math.min(page, totalPages))
    
    // 计算起始页和结束页
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    
    // 调整起始页
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }
    
    // 添加第一页
    if (startPage > 1) {
      items.push(
        <PaginationItem key="first">
          <PaginationLink onClick={() => onPageChange(1)}>1</PaginationLink>
        </PaginationItem>
      )
      
      // 添加省略号
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }
    }
    
    // 添加中间页码
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            isActive={i === currentPage}
            onClick={() => onPageChange(i)}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      )
    }
    
    // 添加最后页
    if (endPage < totalPages) {
      // 添加省略号
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        )
      }
      
      items.push(
        <PaginationItem key="last">
          <PaginationLink onClick={() => onPageChange(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }
    
    return items
  }, [page, totalPages, pageSize, onPageChange])

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
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center">
                  正在加载...
                </TableCell>
              </TableRow>
            ) : records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="h-24 text-center">
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
                      {record.status === RecordStatus.SUBMITTED ? "已提交" : record.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(record.submittedAt).toLocaleString()}</TableCell>
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
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => onPageChange(Math.max(1, page - 1))}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {getPaginationItems()}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => onPageChange(Math.min(totalPages, page + 1))}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
} 