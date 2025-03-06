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
import { Pagination } from "@/components/ui/pagination"
import React from "react"

// 记录对象接口
interface MonthRecord {
  [key: string]: number | null; // 月份: 金额
}

interface RecordData {
  monthValues: MonthRecord; // 月份数据
  remark?: string; // 备注信息
}

// 分组历史记录类型
export interface GroupedHistory {
  organization: string
  departments: {
    name: string
    categories: {
      name: string
      projects: {
        name: string
        subProjects: {
          name: string
          fundTypes: {
            name: string
            records: RecordData[]
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
  
  // 渲染分组数据
  const renderGroupedData = (
    data: GroupedHistory[],
    columns: {key: string, label: string}[],
    formatAmount: (amount: number | null) => string
  ) => {
    return data.flatMap(org => (
      org.departments.flatMap(dept => (
        dept.categories.flatMap(category => (
          category.projects.flatMap((proj, projIndex) => (
            <React.Fragment key={`section-${org.organization}-${dept.name}-${category.name}-${proj.name}-${projIndex}`}>
              <TableRow className="bg-muted/50">
                <TableCell colSpan={columns.length + 2} className="font-medium">
                  {org.organization} &gt; {dept.name} &gt; {category.name} &gt; {proj.name}
                </TableCell>
              </TableRow>
              {proj.subProjects.flatMap((subProj, subProjIndex) => (
                subProj.fundTypes.map((fundType, fundTypeIndex) => (
                  <TableRow key={`data-${org.organization}-${dept.name}-${category.name}-${proj.name}-${subProj.name}-${fundType.name}-${subProjIndex}-${fundTypeIndex}`}>
                    <TableCell className="font-medium">
                      <div>{subProj.name}</div>
                      <div className="text-sm text-muted-foreground">{fundType.name}</div>
                    </TableCell>
                    {columns.map(column => (
                      <TableCell key={`cell-${column.key}`} className="text-center">
                        {fundType.records[0]?.monthValues[column.key] !== undefined ? (
                          formatAmount(fundType.records[0].monthValues[column.key])
                        ) : "-"}
                      </TableCell>
                    ))}
                    <TableCell className="text-sm text-center">
                      {fundType.records[0]?.remark || "-"}
                    </TableCell>
                  </TableRow>
                ))
              ))}
            </React.Fragment>
          ))
        ))
      ))
    ));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">项目信息</TableHead>
              {monthColumns.map((col) => (
                <TableHead key={col.key} className="text-center">
                  {col.label}
                </TableHead>
              ))}
              <TableHead className="text-center">备注</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={monthColumns.length + 2} className="h-24 text-center">
                  加载中...
                </TableCell>
              </TableRow>
            ) : groupedHistory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={monthColumns.length + 2} className="h-24 text-center">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              renderGroupedData(groupedHistory, monthColumns, formatCurrency)
            )}
          </TableBody>
        </Table>
      </div>
      
      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            siblingCount={1}
          />
        </div>
      )}
    </div>
  )
}

// 将历史记录转换为分组视图数据
export function processGroupedData(records: HistoryRecord[]): GroupedHistory[] {
  // 按组织、部门、项目类型、项目、子项目、资金类型分组
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
        categories: {}
      }
    }
    
    // 初始化项目类型结构
    if (!grouped[record.organization].departments[record.department].categories[record.category]) {
      grouped[record.organization].departments[record.department].categories[record.category] = {
        name: record.category,
        projects: {}
      }
    }
    
    // 初始化项目结构
    if (!grouped[record.organization].departments[record.department].categories[record.category].projects[record.project]) {
      grouped[record.organization].departments[record.department].categories[record.category].projects[record.project] = {
        name: record.project,
        subProjects: {}
      }
    }
    
    // 初始化子项目结构
    if (!grouped[record.organization].departments[record.department].categories[record.category].projects[record.project].subProjects[record.subProject]) {
      grouped[record.organization].departments[record.department].categories[record.category].projects[record.project].subProjects[record.subProject] = {
        name: record.subProject,
        fundTypes: {}
      }
    }
    
    // 初始化资金类型结构
    if (!grouped[record.organization].departments[record.department].categories[record.category].projects[record.project].subProjects[record.subProject].fundTypes[record.fundType]) {
      grouped[record.organization].departments[record.department].categories[record.category].projects[record.project].subProjects[record.subProject].fundTypes[record.fundType] = {
        name: record.fundType,
        records: []
      }
      
      // 初始化记录对象
      const recordObj: RecordData = {
        monthValues: {}
      }
      if (record.remark) {
        recordObj.remark = record.remark;
      }
      grouped[record.organization].departments[record.department].categories[record.category].projects[record.project].subProjects[record.subProject].fundTypes[record.fundType].records.push(recordObj)
    }
    
    // 添加月份记录
    const monthKey = `${record.year}-${record.month.toString().padStart(2, '0')}`
    grouped[record.organization].departments[record.department].categories[record.category].projects[record.project].subProjects[record.subProject].fundTypes[record.fundType].records[0].monthValues[monthKey] = record.amount
    
    // 添加备注信息
    if (record.remark) {
      grouped[record.organization].departments[record.department].categories[record.category].projects[record.project].subProjects[record.subProject].fundTypes[record.fundType].records[0].remark = record.remark
    }
  })
  
  // 将嵌套对象转换为数组
  const result: GroupedHistory[] = Object.values(grouped).map((org: any) => {
    return {
      organization: org.name,
      departments: Object.values(org.departments).map((dept: any) => {
        return {
          name: dept.name,
          categories: Object.values(dept.categories).map((category: any) => {
            return {
              name: category.name,
              projects: Object.values(category.projects).map((proj: any) => {
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