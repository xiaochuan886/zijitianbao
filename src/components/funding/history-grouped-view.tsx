"use client"

import { useState, useCallback } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { HistoryRecord } from "./history-table-view"
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"

// 分组历史记录类型
export interface GroupedHistory {
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

// 分组视图属性
export interface GroupedViewProps {
  groupedHistory: GroupedHistory[]
  loading: boolean
  formatCurrency: (amount: number | null) => string
  monthColumns: {key: string, label: string}[]
  total: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function HistoryGroupedView({
  groupedHistory,
  loading,
  formatCurrency,
  monthColumns,
  total,
  page,
  pageSize,
  onPageChange
}: GroupedViewProps) {
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
      
      {/* 分页控件 */}
      {!loading && groupedHistory.length > 0 && (
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

// 将历史记录转换为分组视图数据
export function processGroupedData(records: HistoryRecord[]): GroupedHistory[] {
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
  
  return result
}

// 根据日期范围生成月份列表
export function getMonthColumns(startYear: number, startMonth: number, endYear: number, endMonth: number) {
  const columns = []
  
  // 在同一年
  if (startYear === endYear) {
    for (let month = startMonth; month <= endMonth; month++) {
      columns.push({
        key: `${startYear}-${month.toString().padStart(2, '0')}`,
        label: `${startYear}-${month.toString().padStart(2, '0')}`
      })
    }
  } else {
    // 跨年情况
    // 第一年剩余月份
    for (let month = startMonth; month <= 12; month++) {
      columns.push({
        key: `${startYear}-${month.toString().padStart(2, '0')}`,
        label: `${startYear}-${month.toString().padStart(2, '0')}`
      })
    }
    
    // 中间整年
    for (let year = startYear + 1; year < endYear; year++) {
      for (let month = 1; month <= 12; month++) {
        columns.push({
          key: `${year}-${month.toString().padStart(2, '0')}`,
          label: `${year}-${month.toString().padStart(2, '0')}`
        })
      }
    }
    
    // 最后年份的月份
    for (let month = 1; month <= endMonth; month++) {
      columns.push({
        key: `${endYear}-${month.toString().padStart(2, '0')}`,
        label: `${endYear}-${month.toString().padStart(2, '0')}`
      })
    }
  }
  
  return columns
} 