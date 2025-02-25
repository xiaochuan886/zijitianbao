"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { UserForm } from "./user-form"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { Role } from "@prisma/client"
import * as z from "zod"
import { createUserSchema, editUserSchema } from "./user-form"
import { Button } from "@/components/ui/button"

export interface User {
  id: string
  name: string
  email: string
  role: Role
  active: boolean
  createdAt: string
  updatedAt: string
  organizationId?: string
  organization?: {
    id: string
    name: string
  }
  organizations?: {
    id: string
    name: string
  }[]
}

// 添加用户类型定义应该来自schema
type CreateUserFormValues = z.infer<typeof createUserSchema>
type EditUserFormValues = z.infer<typeof editUserSchema>

export default function UsersPage() {
  const [data, setData] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // 加载用户数据
  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await apiClient.users.list({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: searchTerm,
      })
      
      setData(response.users)
      setPagination(response.pagination)
    } catch (error) {
      toast.error("加载用户列表失败")
      console.error("加载用户列表失败:", error)
    } finally {
      setLoading(false)
    }
  }

  // 首次加载和分页、搜索条件变化时重新加载数据
  useEffect(() => {
    loadUsers()
  }, [pagination.page, pagination.pageSize, searchTerm])

  // 添加事件监听器，用于捕获行操作
  useEffect(() => {
    // 监听自定义row-action事件
    const handleRowAction = (event: CustomEvent) => {
      const { action, row } = event.detail;
      if (action === "edit") {
        handleEditClick(row);
      }
    };
    
    // 添加事件监听器
    document.addEventListener('row-action', handleRowAction as EventListener);
    
    // 清理函数
    return () => {
      document.removeEventListener('row-action', handleRowAction as EventListener);
    };
  }, []);

  // 处理添加用户
  const handleAddUser = async (userData: CreateUserFormValues) => {
    try {
      setIsLoading(true)
      
      // 确保organizationIds是有效的数组
      const organizationIds = userData.organizationIds || [];
      
      // 发起请求创建用户
      const response = await apiClient.users.create({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        organizationIds: organizationIds.filter(id => id !== null && id !== undefined && id !== '')
      })

      toast.success("用户创建成功")

      // 刷新数据
      loadUsers()
      
      // 关闭对话框
      setUserDialogOpen(false)
    } catch (error) {
      console.error('创建用户失败', error)
      toast.error("创建用户失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  // 处理编辑用户
  const handleEditUser = async (editedUser: EditUserFormValues, id: string) => {
    try {
      setIsLoading(true)
      
      // 确保organizationIds是有效的数组
      const organizationIds = editedUser.organizationIds || [];
      
      // 发起请求更新用户
      await apiClient.users.update(id, {
        name: editedUser.name,
        email: editedUser.email,
        role: editedUser.role,
        active: editedUser.active,
        organizationIds: organizationIds.filter(id => id !== null && id !== undefined && id !== '')
      })

      toast.success("用户更新成功")

      // 刷新数据
      loadUsers()
      
      // 关闭对话框
      setUserDialogOpen(false)
    } catch (error) {
      console.error('更新用户失败', error)
      toast.error("更新用户失败，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  // 删除用户
  const handleDeleteUser = async (id: string) => {
    try {
      await apiClient.users.delete(id)
      toast.success("用户删除成功")
      loadUsers()
    } catch (error) {
      toast.error("删除用户失败")
      console.error("删除用户失败:", error)
    }
  }

  // 重置密码
  const handleResetPassword = async (id: string, password: string) => {
    try {
      await apiClient.users.resetPassword(id, password)
      toast.success("密码重置成功")
    } catch (error) {
      toast.error("密码重置失败")
      console.error("密码重置失败:", error)
    }
  }

  // 启用/禁用用户
  const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await apiClient.users.update(id, { active })
      toast.success(active ? "用户已启用" : "用户已禁用")
      loadUsers()
    } catch (error) {
      toast.error(active ? "启用用户失败" : "禁用用户失败")
      console.error("切换用户状态失败:", error)
    }
  }

  // 处理表单提交
  const handleUserFormSubmit = (editMode: boolean, data: CreateUserFormValues | EditUserFormValues, id?: string) => {
    if (editMode && id) {
      handleEditUser(data as EditUserFormValues, id)
    } else {
      handleAddUser(data as CreateUserFormValues)
    }
  }

  // 打开编辑用户对话框
  const handleEditClick = (user: User) => {
    setSelectedUser(user)
    setUserDialogOpen(true)
  }

  // 打开新增用户对话框
  const handleAddClick = () => {
    setSelectedUser(null)
    setUserDialogOpen(true)
  }

  return (
    <div className="container mx-auto py-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">用户管理</h1>
        <Button onClick={handleAddClick} className="bg-blue-500 hover:bg-blue-700">
          添加用户
        </Button>
      </div>

      <div className="mb-4 flex flex-col md:flex-row gap-2 justify-between">
        <Input
          placeholder="搜索用户..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <DataTable
        columns={columns}
        data={data}
        pagination={pagination}
        onPaginationChange={(paginationUpdate) => {
          setPagination(prev => ({
            ...prev,
            page: paginationUpdate.page,
            pageSize: paginationUpdate.pageSize,
          }))
        }}
        loading={loading}
        onEdit={(userData) => handleEditClick(userData as User)}
      />

      <UserForm
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        initialData={selectedUser ? {
          ...selectedUser,
          organizationIds: selectedUser.organizations?.map(org => org.id) || 
            (selectedUser.organizationId ? [selectedUser.organizationId] : [])
        } : undefined}
        onSubmit={handleUserFormSubmit}
        isLoading={isLoading}
      />
    </div>
  )
}

