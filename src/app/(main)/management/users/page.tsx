"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { UserForm } from "./user-form"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { Role } from "@/lib/enums"
import * as z from "zod"
import { createUserSchema, editUserSchema } from "./user-form"
import { Button } from "@/components/ui/button"
import { PlusCircle, Users, Filter, X, Search } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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

// API响应接口
interface UserListResponse {
  message: string
  data: {
    users: User[]
    pagination: {
      page: number
      pageSize: number
      total: number
      totalPages: number
    }
  }
  timestamp: number
}

// 添加用户类型定义应该来自schema
type CreateUserFormValues = z.infer<typeof createUserSchema>
type EditUserFormValues = z.infer<typeof editUserSchema>

// 角色名称映射
const roleLabels: Record<Role, string> = {
  ADMIN: "系统管理员",
  REPORTER: "填报人",
  FINANCE: "财务人员",
  AUDITOR: "审核人员",
  OBSERVER: "观察者"
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<Role | "ALL">("ALL")
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL")
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0
  })
  const [showFilters, setShowFilters] = useState(false)

  // 加载用户数据
  const loadUsers = async () => {
    try {
      setLoading(true)
      setStatsLoading(true)
      
      const response = await apiClient.users.list({
        page: pagination.page,
        pageSize: pagination.pageSize,
        search: searchTerm,
      }) as UserListResponse
      
      console.log('API返回的用户数据:', response)
      
      if (response && response.data && response.data.users) {
        const items = response.data.users
        
        // 应用前端筛选
        let filteredItems = [...items]
        
        // 按角色筛选
        if (roleFilter !== "ALL") {
          filteredItems = filteredItems.filter(user => user.role === roleFilter)
        }
        
        // 按状态筛选
        if (activeFilter === "ACTIVE") {
          filteredItems = filteredItems.filter(user => user.active)
        } else if (activeFilter === "INACTIVE") {
          filteredItems = filteredItems.filter(user => !user.active)
        }
        
        setUsers(filteredItems)
        setPagination(response.data.pagination)
        
        // 计算基础统计数据
        const activeUsers = items.filter(user => user.active).length
        const adminUsers = items.filter(user => user.role === Role.ADMIN).length
        
        setStats({
          totalUsers: items.length,
          activeUsers,
          adminUsers
        })
      } else {
        console.error('API返回的用户数据格式不正确:', response)
        toast.error("获取数据格式错误")
        setUsers([])
      }
    } catch (error) {
      console.error('获取用户列表失败:', error)
      toast.error(error instanceof Error ? error.message : "获取用户列表失败")
      setUsers([])
    } finally {
      setLoading(false)
      setStatsLoading(false)
    }
  }

  // 首次加载和分页、搜索条件变化时重新加载数据
  useEffect(() => {
    loadUsers()
  }, [pagination.page, pagination.pageSize, searchTerm])
  
  // 当筛选条件变化时，重新应用筛选
  useEffect(() => {
    loadUsers()
  }, [roleFilter, activeFilter])

  // 处理添加用户
  const handleAddUser = async (userData: CreateUserFormValues) => {
    try {
      setIsLoading(true)
      
      // 确保organizationIds是有效的数组
      const organizationIds = userData.organizationIds || [];
      
      // 发起请求创建用户
      await apiClient.users.create({
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
  const handleDelete = (user: User) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  // 确认删除
  const confirmDelete = async () => {
    if (!userToDelete) return
    
    try {
      await apiClient.users.delete(userToDelete.id)
      toast.success("用户删除成功")
      loadUsers()
    } catch (error: any) {
      console.error('删除用户失败:', error)
      toast.error(error.message || "删除失败")
    } finally {
      setDeleteDialogOpen(false)
      setUserToDelete(null)
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
  
  // 清除所有筛选条件
  const clearFilters = () => {
    setRoleFilter("ALL")
    setActiveFilter("ALL")
    setSearchTerm("")
  }

  // 检查是否有活跃的筛选条件
  const hasActiveFilters = roleFilter !== "ALL" || activeFilter !== "ALL" || searchTerm.trim() !== ""

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">用户管理</h1>
        <Button onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" />
          添加用户
        </Button>
      </div>
      
      {/* 统计卡片区域 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              用户总数
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Spinner className="h-6 w-6" /> : stats.totalUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              系统中所有用户的数量
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              活跃用户
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Spinner className="h-6 w-6" /> : stats.activeUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              当前已启用的用户数量
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              管理员用户
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2a10 10 0 1 0 10 10H12V2Z" />
              <path d="M12 12 2.2 9.1a10 10 0 0 0 2.8 6.9L12 12Z" />
              <path d="m12 12 7.5 3a10 10 0 0 0 .5-7" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Spinner className="h-6 w-6" /> : stats.adminUsers}
            </div>
            <p className="text-xs text-muted-foreground">
              具有管理员权限的用户数量
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索区域 */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索用户..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-accent" : ""}
          >
            <Filter className="h-4 w-4" />
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 gap-1 text-xs"
            >
              <X className="h-3 w-3" /> 清除筛选
            </Button>
          )}
        </div>

        {showFilters && (
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm">角色:</span>
              <Select
                value={roleFilter}
                onValueChange={(value) => setRoleFilter(value as Role | "ALL")}
              >
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">全部角色</SelectItem>
                  {Object.entries(roleLabels).map(([role, label]) => (
                    <SelectItem key={role} value={role}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm">状态:</span>
              <Select
                value={activeFilter}
                onValueChange={(value) => 
                  setActiveFilter(value as "ALL" | "ACTIVE" | "INACTIVE")
                }
              >
                <SelectTrigger className="w-[120px] h-8">
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">全部</SelectItem>
                  <SelectItem value="ACTIVE">启用</SelectItem>
                  <SelectItem value="INACTIVE">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* 数据表格 */}
      <Card>
        <CardHeader>
          <CardTitle>用户列表</CardTitle>
          <CardDescription>
            管理系统中的所有用户账号
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns({
              onEdit: handleEditClick,
              onDelete: handleDelete,
              onToggleActive: handleToggleActive
            })}
            data={users}
            pagination={pagination}
            onPaginationChange={(paginationUpdate) => {
              setPagination(prev => ({
                ...prev,
                page: paginationUpdate.page,
                pageSize: paginationUpdate.pageSize,
              }))
            }}
            loading={loading}
          />
        </CardContent>
      </Card>

      {/* 用户表单对话框 */}
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

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除用户 "{userToDelete?.name}" ({userToDelete?.email}) 吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

