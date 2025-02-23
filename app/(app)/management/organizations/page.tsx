"use client"

import { DataTable } from "@/components/ui/data-table"
import { createColumns } from "./columns"
import { TableToolbar } from "@/components/ui/table-toolbar"
import { useOrgData } from "./hooks/useOrgData"
import { Skeleton } from "@/components/ui/skeleton"
import { useEffect, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CreateOrgDialog } from "./components/CreateOrgDialog"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useAuth } from "@/hooks/use-auth"
import { withAdminPermission } from "@/lib/auth/hocs"

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-[150px]" />
        <Skeleton className="h-9 w-[100px]" />
      </div>
      <Skeleton className="h-10 w-[250px]" />
      <div className="rounded-lg border">
        <div className="h-10 border-b px-4 py-2">
          <Skeleton className="h-5 w-[150px]" />
        </div>
        <div className="p-4 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="text-center py-10">
      <h3 className="text-lg font-semibold">暂无机构数据</h3>
      <p className="text-sm text-muted-foreground">点击"新增机构"按钮创建新的机构。</p>
    </div>
  )
}

function TablePagination({
  currentPage,
  pageSize,
  totalCount,
  onPageChange,
}: {
  currentPage: number
  pageSize: number
  totalCount: number
  onPageChange: (page: number) => void
}) {
  const totalPages = Math.ceil(totalCount / pageSize)
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  const maxVisiblePages = 5
  const halfVisible = Math.floor(maxVisiblePages / 2)
  
  let visiblePages = pages
  if (totalPages > maxVisiblePages) {
    if (currentPage <= halfVisible) {
      visiblePages = [...pages.slice(0, maxVisiblePages - 1), totalPages]
    } else if (currentPage > totalPages - halfVisible) {
      visiblePages = [1, ...pages.slice(totalPages - maxVisiblePages + 1)]
    } else {
      visiblePages = [
        1,
        ...pages.slice(
          currentPage - halfVisible,
          currentPage + halfVisible - 1
        ),
        totalPages,
      ]
    }
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (currentPage > 1) onPageChange(currentPage - 1)
            }}
          />
        </PaginationItem>
        {visiblePages.map((page, index) => {
          if (
            index > 0 &&
            page > visiblePages[index - 1] + 1
          ) {
            return (
              <PaginationItem key={`ellipsis-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            )
          }
          return (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                isActive={page === currentPage}
                onClick={(e) => {
                  e.preventDefault()
                  onPageChange(page)
                }}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          )
        })}
        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (currentPage < totalPages) onPageChange(currentPage + 1)
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

function OrganizationsPage() {
  const { data, isLoading, error, fetchData, currentPage, pageSize, totalCount } = useOrgData()
  const searchParams = useSearchParams()
  const router = useRouter()
  const search = searchParams.get("search") || ""
  const { user } = useAuth()
  const isAdmin = user?.role === "ADMIN"

  useEffect(() => {
    fetchData(1, search)
  }, [fetchData, search])

  const handleSuccess = () => {
    fetchData(currentPage, search)
  }

  const handlePageChange = (page: number) => {
    fetchData(page, search)
  }

  const columns = useMemo(
    () => createColumns({ data, onSuccess: handleSuccess, isAdmin, router }),
    [data, isAdmin, router, handleSuccess]
  )

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (error) {
    return <div className="text-red-500">加载失败: {error.message}</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">机构管理</h1>
        {isAdmin && <CreateOrgDialog onSuccess={handleSuccess} />}
      </div>
      
      <TableToolbar onSearch={(value) => fetchData(1, value)} />
      
      {data.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="rounded-md border">
          <div className="relative w-full overflow-auto">
            <div className="min-w-[800px]">
              <DataTable columns={columns} data={data} />
            </div>
          </div>
          <div className="flex justify-center py-4 border-t">
            <TablePagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default withAdminPermission(OrganizationsPage)

