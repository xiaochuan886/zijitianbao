"use client"

import { useState } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  TableOptions,
} from "@tanstack/react-table"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "./skeleton"
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ChevronsLeftIcon, 
  ChevronsRightIcon,
  Loader2
} from "lucide-react"

// 扩展表格选项
declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    onEdit?: (data: Partial<TData> & { id: string }) => void
    onDelete?: (id: string) => void
    onResetPassword?: (id: string, password: string) => void
    onToggleActive?: (id: string, active: boolean) => void
  }
}

interface Column {
  accessorKey?: string
  id?: string
  header: string
  cell?: (props: { row: any }) => React.ReactNode
}

export interface DataTableProps {
  columns: Column[]
  data: any[]
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  onPaginationChange?: (pagination: { page: number; pageSize: number }) => void
  loading?: boolean
}

export function DataTable({
  columns,
  data,
  pagination,
  onPaginationChange,
  loading = false
}: DataTableProps) {
  
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns: columns as ColumnDef<any>[],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    manualPagination: true,
    pageCount: pagination?.totalPages ?? -1,
  })
  
  // 通过路径获取对象属性
  const getValueByPath = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => {
      return acc && acc[part] !== undefined ? acc[part] : undefined
    }, obj)
  }
  
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.id || column.accessorKey || column.header}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex justify-center items-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {pagination && onPaginationChange && (
        <DataTablePagination
          pagination={pagination}
          onPaginationChange={onPaginationChange}
        />
      )}
    </div>
  )
}

interface DataTablePaginationProps {
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  onPaginationChange: (pagination: { page: number; pageSize: number }) => void
}

function DataTablePagination({
  pagination,
  onPaginationChange,
}: DataTablePaginationProps) {
  const { page, pageSize, total, totalPages } = pagination
  
  // 页码变更
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return
    onPaginationChange({ page: newPage, pageSize })
  }
  
  // 每页条数变更
  const handlePageSizeChange = (value: string) => {
    const newPageSize = parseInt(value)
    onPaginationChange({ page: 1, pageSize: newPageSize })
  }
  
  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        共 {total} 条记录
      </div>
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">每页条数</p>
          <Select
            value={pageSize.toString()}
            onValueChange={handlePageSizeChange}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={pageSize.toString()} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          第 {page} / {totalPages} 页
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => handlePageChange(1)}
            disabled={page === 1}
          >
            <span className="sr-only">第一页</span>
            <ChevronsLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
          >
            <span className="sr-only">上一页</span>
            <ChevronLeftIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
          >
            <span className="sr-only">下一页</span>
            <ChevronRightIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => handlePageChange(totalPages)}
            disabled={page === totalPages}
          >
            <span className="sr-only">最后一页</span>
            <ChevronsRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

