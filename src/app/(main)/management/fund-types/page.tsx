"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

// 资金需求类型数据接口
interface FundType {
  id: string
  name: string
  _count?: {
    subProjects: number
  }
  createdAt: string
}

// API返回结果接口
interface FundTypeListResponse {
  items: FundType[]
  total: number
  totalPages: number
  page: number
  pageSize: number
}

// API调用函数
const apiFundType = {
  getList: async (page = 1, pageSize = 10, search = ""): Promise<FundTypeListResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      ...(search ? { search } : {})
    })
    
    const res = await fetch(`/api/fund-types?${params.toString()}`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    })
    if (!res.ok) throw new Error("获取资金需求类型列表失败")
    return res.json()
  },
  
  create: async (data: { name: string }) => {
    const res = await fetch("/api/fund-types", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(data)
    })
    
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message || "创建资金需求类型失败")
    }
    
    return res.json()
  },
  
  update: async (id: string, data: { name: string }) => {
    const res = await fetch(`/api/fund-types/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(data)
    })
    
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message || "更新资金需求类型失败")
    }
    
    return res.json()
  },
  
  delete: async (id: string) => {
    const res = await fetch(`/api/fund-types/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      }
    })
    
    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message || "删除资金需求类型失败")
    }
    
    return true
  }
}

// 定义表格列
const columns = [
  {
    accessorKey: "name",
    header: "类型名称"
  },
  {
    accessorKey: "_count.subProjects",
    header: "关联项目数",
    cell: ({ row }: any) => {
      return <div>{row.original._count?.subProjects || 0}</div>
    }
  },
  {
    accessorKey: "createdAt",
    header: "创建日期",
    cell: ({ row }: any) => {
      return <div>{new Date(row.original.createdAt).toLocaleDateString()}</div>
    }
  },
  {
    id: "actions",
    header: "操作",
    cell: ({ row }: any) => {
      return <TableActions row={row.original} />
    }
  }
]

// 表格操作组件
function TableActions({ row }: { row: FundType }) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const queryClient = useQueryClient()
  
  // 更新资金需求类型
  const updateMutation = useMutation({
    mutationFn: (data: { name: string }) => apiFundType.update(row.id, data),
    onSuccess: () => {
      toast({ description: "资金需求类型更新成功" })
      queryClient.invalidateQueries({ queryKey: ["fundTypes"] })
      setEditOpen(false)
    },
    onError: (error: Error) => {
      toast({ 
        title: "更新失败", 
        description: error.message, 
        variant: "destructive" 
      })
    }
  })
  
  // 删除资金需求类型
  const deleteMutation = useMutation({
    mutationFn: () => apiFundType.delete(row.id),
    onSuccess: () => {
      toast({ description: "资金需求类型删除成功" })
      queryClient.invalidateQueries({ queryKey: ["fundTypes"] })
      setDeleteOpen(false)
    },
    onError: (error: Error) => {
      toast({ 
        title: "删除失败", 
        description: error.message, 
        variant: "destructive" 
      })
    }
  })
  
  const handleEdit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    
    if (!name || name.trim() === "") {
      toast({ 
        title: "验证失败", 
        description: "资金需求类型名称不能为空", 
        variant: "destructive" 
      })
      return
    }
    
    updateMutation.mutate({ name: name.trim() })
  }
  
  const handleDelete = () => {
    deleteMutation.mutate()
  }
  
  // 安全地访问可能为undefined的属性
  const associatedProjectsCount = row._count?.subProjects || 0
  const canDelete = associatedProjectsCount === 0
  
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
        编辑
      </Button>
      <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
        删除
      </Button>
      
      {/* 编辑对话框 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑资金需求类型</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">类型名称</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={row.name}
                  placeholder="请输入资金需求类型名称"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "保存中..." : "保存"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* 删除确认框 */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              {!canDelete 
                ? `该资金需求类型已关联${associatedProjectsCount}个项目，无法删除` 
                : `确定要删除"${row.name}"资金需求类型吗？此操作不可逆。`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            {canDelete && (
              <AlertDialogAction 
                onClick={handleDelete} 
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? "删除中..." : "删除"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// 新增资金需求类型组件
function AddFundTypeDialog() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  
  const createMutation = useMutation({
    mutationFn: (data: { name: string }) => apiFundType.create(data),
    onSuccess: () => {
      toast({ description: "资金需求类型创建成功" })
      queryClient.invalidateQueries({ queryKey: ["fundTypes"] })
      setOpen(false)
    },
    onError: (error: Error) => {
      toast({ 
        title: "创建失败", 
        description: error.message, 
        variant: "destructive" 
      })
    }
  })
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    
    if (!name || name.trim() === "") {
      toast({ 
        title: "验证失败", 
        description: "资金需求类型名称不能为空", 
        variant: "destructive" 
      })
      return
    }
    
    createMutation.mutate({ name: name.trim() })
  }
  
  return (
    <div>
      <Button onClick={() => setOpen(true)}>新增资金需求类型</Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新增资金需求类型</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">类型名称</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="请输入资金需求类型名称"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "创建中..." : "创建"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 主页面组件
export default function FundTypesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  })
  
  // 获取资金需求类型列表
  const { data, isLoading, error } = useQuery({
    queryKey: ["fundTypes", pagination.page, pagination.pageSize, searchTerm],
    queryFn: () => apiFundType.getList(pagination.page, pagination.pageSize, searchTerm)
  })
  
  // 更新分页数据
  const handlePaginationChange = (newPagination: { page: number; pageSize: number }) => {
    setPagination({
      ...pagination,
      ...newPagination
    })
  }
  
  // 处理搜索
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setPagination({
      ...pagination,
      page: 1
    })
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">资金需求类型管理</h1>
        <AddFundTypeDialog />
      </div>
      
      <div className="flex items-center justify-between">
        <Input
          placeholder="搜索资金需求类型..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
      </div>
      
      {error ? (
        <div className="text-red-500">加载失败: {(error as Error).message}</div>
      ) : (
        <DataTable
          columns={columns}
          data={data?.items || []}
          pagination={{
            ...pagination,
            total: data?.total || 0,
            totalPages: data?.totalPages || 0
          }}
          onPaginationChange={handlePaginationChange}
          loading={isLoading}
        />
      )}
    </div>
  )
}