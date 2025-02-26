"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { AlertCircle, Loader2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

// 资金需求类型数据接口
interface FundType {
  id: string
  name: string
  _count?: {
    subProjects: number
  }
  createdAt: string
}

// API响应接口
interface FundTypeListResponse {
  code: number
  message: string
  data: {
    items: FundType[]
    total: number
    totalPages: number
    page: number
    pageSize: number
  }
}

// API调用函数
const apiFundType = {
  getList: async (page = 1, pageSize = 10, search = "", sortBy = "createdAt", sortOrder = "desc"): Promise<FundTypeListResponse> => {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
      sortBy,
      sortOrder,
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
    
    return res.json()
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
function TableActions({ row, onSuccess }: { row: FundType; onSuccess?: () => void }) {
  const [openEdit, setOpenEdit] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [name, setName] = useState(row.name)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  // 更新资金需求类型
  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          variant: "destructive",
          title: "错误",
          description: "未找到认证token"
        });
        throw new Error("未找到认证token");
      }

      const response = await fetch(`/api/fund-types/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          // 尝试解析错误响应为JSON
          const errorJson = JSON.parse(errorText);
          toast({
            variant: "destructive",
            title: "更新失败",
            description: errorJson.message || "未知错误"
          });
          throw new Error(errorJson.message || `更新资金需求类型失败: ${response.status}`);
        } catch (parseError) {
          // 如果解析失败，使用原始错误文本
          toast({
            variant: "destructive",
            title: "更新失败",
            description: errorText || `状态码: ${response.status}`
          });
          throw new Error(`更新资金需求类型失败: ${response.status} ${errorText}`);
        }
      }

      try {
        // 尝试解析响应为JSON
        return await response.json();
      } catch (parseError) {
        // 如果响应不是有效的JSON，返回一个默认成功对象
        console.log('更新成功，但响应不是有效的JSON');
        return { success: true };
      }
    },
    onSuccess: () => {
      toast({
        title: "更新成功",
        description: "资金需求类型更新成功"
      });
      setOpenEdit(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error("更新资金需求类型失败:", error);
      toast({
        variant: "destructive",
        title: "更新失败",
        description: error instanceof Error ? error.message : "未知错误"
      });
    }
  })
  
  // 删除资金需求类型
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          variant: "destructive",
          title: "错误",
          description: "未找到认证token"
        });
        throw new Error("未找到认证token");
      }

      const response = await fetch(`/api/fund-types/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          // 尝试解析错误响应为JSON
          const errorJson = JSON.parse(errorText);
          toast({
            variant: "destructive",
            title: "删除失败",
            description: errorJson.message || "未知错误"
          });
          throw new Error(errorJson.message || `删除资金需求类型失败: ${response.status}`);
        } catch (parseError) {
          // 如果解析失败，使用原始错误文本
          toast({
            variant: "destructive",
            title: "删除失败",
            description: errorText || `状态码: ${response.status}`
          });
          throw new Error(`删除资金需求类型失败: ${response.status} ${errorText}`);
        }
      }

      try {
        // 尝试解析响应为JSON
        return await response.json();
      } catch (parseError) {
        // 如果响应不是有效的JSON，返回一个默认成功对象
        console.log('删除成功，但响应不是有效的JSON');
        return { success: true };
      }
    },
    onSuccess: () => {
      toast({
        title: "删除成功",
        description: "资金需求类型删除成功"
      });
      setOpenDelete(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      console.error("删除资金需求类型失败:", error);
      toast({
        variant: "destructive",
        title: "删除失败",
        description: error instanceof Error ? error.message : "未知错误"
      });
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
    
    updateMutation.mutate({ id: row.id, name: name.trim() })
  }
  
  const handleDelete = () => {
    deleteMutation.mutate(row.id)
  }
  
  // 安全地访问可能为undefined的属性
  const associatedProjectsCount = row._count?.subProjects || 0
  const canDelete = associatedProjectsCount === 0
  
  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={() => setOpenEdit(true)}>
        编辑
      </Button>
      <Button variant="destructive" size="sm" onClick={() => setOpenDelete(true)}>
        删除
      </Button>
      
      {/* 编辑对话框 */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
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
              <Button type="button" variant="outline" onClick={() => setOpenEdit(false)}>
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
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
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
function AddFundTypeDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          variant: "destructive",
          title: "错误",
          description: "未找到认证token"
        });
        throw new Error("未找到认证token");
      }

      const response = await fetch("/api/fund-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ name })
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          // 尝试解析错误响应为JSON
          const errorJson = JSON.parse(errorText);
          toast({
            variant: "destructive",
            title: "创建失败",
            description: errorJson.message || "未知错误"
          });
          throw new Error(errorJson.message || `创建资金需求类型失败: ${response.status}`);
        } catch (parseError) {
          // 如果解析失败，使用原始错误文本
          toast({
            variant: "destructive",
            title: "创建失败",
            description: errorText || `状态码: ${response.status}`
          });
          throw new Error(`创建资金需求类型失败: ${response.status} ${errorText}`);
        }
      }

      try {
        // 尝试解析响应为JSON
        return await response.json();
      } catch (parseError) {
        // 如果响应不是有效的JSON，返回一个默认成功对象
        console.log('创建成功，但响应不是有效的JSON');
        return { success: true };
      }
    },
    onSuccess: () => {
      toast({
        title: "创建成功",
        description: "资金需求类型创建成功"
      });
      setOpen(false);
      onSuccess();
    },
    onError: (error) => {
      console.error("创建资金需求类型失败:", error);
      toast({
        variant: "destructive",
        title: "创建失败",
        description: error instanceof Error ? error.message : "未知错误"
      });
    }
  });
  
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
    
    createMutation.mutate(name.trim())
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
  const router = useRouter()
  const { toast } = useToast()
  
  // 获取资金需求类型列表
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["fundTypes", pagination.page, pagination.pageSize, searchTerm],
    queryFn: async () => {
      try {
        // 获取token
        const token = localStorage.getItem("token");
        if (!token) {
          console.error('未找到认证token');
          toast({
            variant: "destructive",
            title: "错误",
            description: '您尚未登录或登录已过期，请重新登录'
          });
          // 重定向到登录页
          router.push('/login');
          throw new Error('未找到认证token');
        }
        
        // 构建请求参数
        const params = new URLSearchParams({
          page: pagination.page.toString(),
          pageSize: pagination.pageSize.toString(),
          sortBy: "createdAt",
          sortOrder: "desc",
          ...(searchTerm ? { search: searchTerm } : {})
        });
        
        // 直接使用fetch而不是apiFundType.getList
        const response = await fetch(`/api/fund-types?${params.toString()}`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API响应错误:', response.status, errorText);
          
          // 处理401未授权错误
          if (response.status === 401) {
            toast({
              variant: "destructive",
              title: "错误",
              description: '您的登录已过期，请重新登录'
            });
            // 清除token
            localStorage.removeItem("token");
            // 重定向到登录页
            router.push('/login');
            throw new Error('未授权，请重新登录');
          }
          
          try {
            // 尝试解析错误响应为JSON
            const errorJson = JSON.parse(errorText);
            toast({
              variant: "destructive",
              title: "获取失败",
              description: errorJson.message || `获取资金需求类型列表失败: ${response.status}`
            });
            throw new Error(errorJson.message || `获取资金需求类型列表失败: ${response.status}`);
          } catch (parseError) {
            // 如果解析失败，使用原始错误文本
            toast({
              variant: "destructive",
              title: "获取失败",
              description: `获取资金需求类型列表失败: ${response.status} ${errorText}`
            });
            throw new Error(`获取资金需求类型列表失败: ${response.status} ${errorText}`);
          }
        }
        
        let responseData;
        try {
          responseData = await response.json();
          console.log('API原始响应数据:', responseData);
        } catch (parseError) {
          console.error('解析API响应失败:', parseError);
          toast({
            variant: "destructive",
            title: "错误",
            description: '解析API响应数据失败'
          });
          throw new Error('解析API响应数据失败');
        }
        
        // 检查响应格式
        if (responseData.items) {
          // 直接返回分页数据
          setPagination(prev => ({
            ...prev,
            total: responseData.total || 0,
            totalPages: responseData.totalPages || 0
          }));
          return responseData;
        } else if (Array.isArray(responseData)) {
          // 如果是数组，构造分页数据
          console.log('API返回了数组格式的数据');
          const result = {
            items: responseData,
            total: responseData.length,
            page: pagination.page,
            pageSize: pagination.pageSize,
            totalPages: Math.ceil(responseData.length / pagination.pageSize)
          };
          setPagination(prev => ({
            ...prev,
            total: result.total,
            totalPages: result.totalPages
          }));
          return result;
        } else {
          // 其他格式，尝试适配
          console.log('API返回了其他格式的数据，尝试适配');
          const items = responseData.data?.items || responseData.items || [];
          const result = {
            items,
            total: responseData.data?.total || responseData.total || items.length,
            page: pagination.page,
            pageSize: pagination.pageSize,
            totalPages: responseData.data?.totalPages || responseData.totalPages || Math.ceil(items.length / pagination.pageSize)
          };
          setPagination(prev => ({
            ...prev,
            total: result.total,
            totalPages: result.totalPages
          }));
          return result;
        }
      } catch (err) {
        console.error('获取资金需求类型列表失败:', err);
        toast({
          variant: "destructive",
          title: "错误",
          description: `获取资金需求类型列表失败: ${err instanceof Error ? err.message : String(err)}`
        });
        throw err;
      }
    }
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
  
  // 获取要显示的数据
  const fundTypes = data?.items || [];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">资金需求类型管理</h1>
        <AddFundTypeDialog onSuccess={() => refetch()} />
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
        <div className="rounded-md bg-destructive/15 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-destructive">加载失败: 获取资金需求类型列表失败</h3>
            </div>
          </div>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>使用次数</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fundTypes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      没有找到资金需求类型
                    </TableCell>
                  </TableRow>
                ) : (
                  fundTypes.map((fundType: FundType) => (
                    <TableRow key={fundType.id}>
                      <TableCell className="font-medium">{fundType.name}</TableCell>
                      <TableCell>{fundType._count?.subProjects || 0}</TableCell>
                      <TableCell>{new Date(fundType.createdAt).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <TableActions row={fundType} onSuccess={() => refetch()} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              共 {pagination.total} 条记录
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePaginationChange({ page: pagination.page - 1, pageSize: pagination.pageSize })}
                disabled={pagination.page <= 1}
              >
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePaginationChange({ page: pagination.page + 1, pageSize: pagination.pageSize })}
                disabled={pagination.page >= pagination.totalPages}
              >
                下一页
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}