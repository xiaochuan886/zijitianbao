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

// 扩展表格选项
declare module "@tanstack/react-table" {
  interface TableMeta<TData> {
    onEdit?: (data: Partial<TData> & { id: string }) => void
    onDelete?: (id: string) => void
    onResetPassword?: (id: string, password: string) => void
    onToggleActive?: (id: string, active: boolean) => void
  }
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[]
  data: TData[]
  loading?: boolean
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  onPaginationChange?: (pagination: { page: number; pageSize: number; total?: number; totalPages?: number }) => void
  onEdit?: (data: Partial<TData> & { id: string }) => void
  onDelete?: (id: string) => void
  onResetPassword?: (id: string, password: string) => void
  onToggleActive?: (id: string, active: boolean) => void
}

export function DataTable<TData>({
  columns,
  data,
  loading = false,
  pagination,
  onPaginationChange,
  onEdit,
  onDelete,
  onResetPassword,
  onToggleActive,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      pagination: pagination && pagination.page !== undefined && pagination.pageSize !== undefined ? {
        pageIndex: pagination.page - 1,
        pageSize: pagination.pageSize,
      } : {
        pageIndex: 0,
        pageSize: 10,
      },
    },
    meta: {
      onEdit,
      onDelete,
      onResetPassword,
      onToggleActive,
    },
    manualPagination: !!pagination,
    pageCount: pagination?.totalPages || 1,
  })

  if (loading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                {Array.from({ length: columns.length }).map((_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  加载中...
                </TableCell>
              </TableRow>
            ) : (table.getRowModel() && table.getRowModel().rows && table.getRowModel().rows.length > 0) ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  暂无数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between space-x-2 py-4">
        {pagination && pagination.pageSize !== undefined && (
          <div className="flex items-center space-x-2">
            <p className="text-sm">每页显示</p>
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(value) => {
                onPaginationChange?.({
                  page: 1,
                  pageSize: Number(value),
                })
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="30">30</SelectItem>
                <SelectItem value="40">40</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm">
              共 {pagination.total || 0} 条数据，{pagination.totalPages || 1} 页
            </p>
          </div>
        )}
        <div className="flex items-center space-x-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (onPaginationChange && pagination && pagination.page !== undefined && pagination.pageSize !== undefined) {
                onPaginationChange({
                  page: pagination.page - 1,
                  pageSize: pagination.pageSize,
                })
              } else {
                table.previousPage()
              }
            }}
            disabled={pagination ? (pagination.page !== undefined && pagination.page <= 1) : !table.getState().pagination ? true : !table.getCanPreviousPage()}
          >
            上一页
          </Button>
          <span className="text-sm">
            第 {pagination?.page !== undefined ? pagination.page : (table.getState().pagination ? table.getState().pagination.pageIndex + 1 : 1)} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (onPaginationChange && pagination && pagination.page !== undefined && pagination.pageSize !== undefined) {
                onPaginationChange({
                  page: pagination.page + 1,
                  pageSize: pagination.pageSize,
                })
              } else {
                table.nextPage()
              }
            }}
            disabled={pagination ? (pagination.page !== undefined && pagination.totalPages !== undefined && pagination.page >= pagination.totalPages) : !table.getState().pagination ? true : !table.getCanNextPage()}
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  )
}

