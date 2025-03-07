"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { User } from "./page"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Role } from "@/lib/enums"

// 角色标签映射
const roleLabels: Record<Role, string> = {
  ADMIN: "系统管理员",
  REPORTER: "填报人",
  FINANCE: "财务人员",
  AUDITOR: "审核人员",
  OBSERVER: "观察者"
}

// 创建用户表单
export const createUserSchema = z.object({
  name: z.string().min(2, {
    message: "用户名至少需要2个字符。",
  }),
  email: z.string().email({
    message: "请输入有效的邮箱地址。",
  }),
  password: z.string().min(6, {
    message: "密码至少需要6个字符。",
  }),
  role: z.nativeEnum(Role, {
    required_error: "请选择用户角色。",
  }),
  organizationIds: z.array(z.string()).default([]),
})

// 编辑用户表单
export const editUserSchema = z.object({
  name: z.string().min(2, {
    message: "用户名至少需要2个字符。",
  }),
  email: z.string().email({
    message: "请输入有效的邮箱地址。",
  }),
  role: z.nativeEnum(Role, {
    required_error: "请选择用户角色。",
  }),
  organizationIds: z.array(z.string()).default([]),
  active: z.boolean().default(true),
})

// 用户表单数据类型
type CreateUserFormValues = z.infer<typeof createUserSchema>
type EditUserFormValues = z.infer<typeof editUserSchema>

interface UserFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (editMode: boolean, data: CreateUserFormValues | EditUserFormValues, id?: string) => void
  initialData?: {
    id: string
    name: string
    email: string
    role: Role
    organizationIds?: string[]
    active?: boolean
  }
  isLoading?: boolean
}

// 用户表单组件
export function UserForm({ open, onOpenChange, onSubmit, initialData, isLoading = false }: UserFormProps) {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [selectedOrganizationIds, setSelectedOrganizationIds] = useState<string[]>([])
  
  // 编辑模式
  const editMode = !!initialData
  
  // 创建用户表单
  const createForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: Role.OBSERVER,
      organizationIds: [],
    },
  })
  
  // 编辑用户表单
  const editForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      role: initialData?.role || Role.OBSERVER,
      organizationIds: initialData?.organizationIds || [],
      active: initialData?.active !== undefined ? initialData.active : true,
    },
  })
  
  // 表单重置
  const resetForm = () => {
    if (editMode) {
      editForm.reset({
        name: initialData?.name || "",
        email: initialData?.email || "",
        role: initialData?.role || Role.OBSERVER,
        organizationIds: initialData?.organizationIds || [],
        active: initialData?.active !== undefined ? initialData.active : true,
      })
    } else {
      createForm.reset({
        name: "",
        email: "",
        password: "",
        role: Role.OBSERVER,
        organizationIds: [],
      })
    }
    setSelectedOrganizationIds([])
  }
  
  // 当对话框关闭时重置表单
  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  // 当初始数据变化时，更新编辑表单
  useEffect(() => {
    if (initialData && editMode) {
      editForm.reset({
        name: initialData.name,
        email: initialData.email,
        role: initialData.role,
        organizationIds: initialData.organizationIds || [],
        active: initialData.active !== undefined ? initialData.active : true,
      })
      
      // 设置选中的组织ID
      if (initialData.organizationIds && Array.isArray(initialData.organizationIds)) {
        setSelectedOrganizationIds(initialData.organizationIds)
      } else {
        setSelectedOrganizationIds([])
      }
    }
  }, [initialData, editMode])
  
  // 加载组织列表
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const response = await fetch('/api/organizations')
        if (!response.ok) {
          throw new Error('Failed to fetch organizations')
        }
        const data = await response.json()
        setOrganizations(data)
      } catch (error) {
        console.error('加载组织失败', error)
      }
    }

    if (open) {
      fetchOrganizations()
    }
  }, [open])
  
  // 获取已选组织
  const selectedOrganizations = organizations.filter(org => 
    selectedOrganizationIds.includes(org.id)
  )
  
  // 处理组织选择变更
  const handleOrganizationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const options = event.target.options
    const selectedIds: string[] = []
    
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selectedIds.push(options[i].value)
      }
    }
    
    setSelectedOrganizationIds(selectedIds)
    
    // 更新表单值
    if (editMode) {
      editForm.setValue('organizationIds', selectedIds)
    } else {
      createForm.setValue('organizationIds', selectedIds)
    }
  }
  
  // 提交表单
  const onFormSubmit = (data: CreateUserFormValues | EditUserFormValues) => {
    onSubmit(editMode, data, initialData?.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{editMode ? "编辑用户" : "创建新用户"}</DialogTitle>
          <DialogDescription>
            {editMode ? "修改用户信息" : "填写用户信息创建新用户"}
          </DialogDescription>
        </DialogHeader>
        
        {editMode ? (
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onFormSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>姓名</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>邮箱</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>角色</FormLabel>
                    <FormControl>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择角色" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={Role.ADMIN}>管理员</SelectItem>
                          <SelectItem value={Role.REPORTER}>填报员</SelectItem>
                          <SelectItem value={Role.FINANCE}>财务</SelectItem>
                          <SelectItem value={Role.AUDITOR}>审计</SelectItem>
                          <SelectItem value={Role.OBSERVER}>观察者</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <FormLabel>所属组织</FormLabel>
                  
                {/* 已选组织展示 */}
                {selectedOrganizations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedOrganizations.map((org) => (
                      <Badge key={org.id} variant="secondary" className="py-1 px-2">
                        {org.name}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* 使用简单的多选下拉替代Command组件 */}
                <div className="relative">
                  <select 
                    multiple 
                    className="w-full h-[200px] rounded-md border border-input px-3 py-2"
                    value={selectedOrganizationIds}
                    onChange={handleOrganizationChange}
                  >
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name} {org.code ? `(${org.code})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    按住 Ctrl 键(Mac 上为 Command 键)可以选择多个组织
                  </p>
                </div>
              </div>
              
              <FormField
                control={editForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>状态</FormLabel>
                      <FormDescription>
                        设置用户账号的启用状态
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "保存中..." : "保存"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(onFormSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>姓名</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>邮箱</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>密码</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>角色</FormLabel>
                    <FormControl>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="选择角色" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={Role.ADMIN}>管理员</SelectItem>
                          <SelectItem value={Role.REPORTER}>填报员</SelectItem>
                          <SelectItem value={Role.FINANCE}>财务</SelectItem>
                          <SelectItem value={Role.AUDITOR}>审计</SelectItem>
                          <SelectItem value={Role.OBSERVER}>观察者</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <FormLabel>所属组织</FormLabel>
                  
                {/* 已选组织展示 */}
                {selectedOrganizations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedOrganizations.map((org) => (
                      <Badge key={org.id} variant="secondary" className="py-1 px-2">
                        {org.name}
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* 使用简单的多选下拉替代Command组件 */}
                <div className="relative">
                  <select 
                    multiple 
                    className="w-full h-[200px] rounded-md border border-input px-3 py-2"
                    value={selectedOrganizationIds}
                    onChange={handleOrganizationChange}
                  >
                    {organizations.map(org => (
                      <option key={org.id} value={org.id}>
                        {org.name} {org.code ? `(${org.code})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    按住 Ctrl 键(Mac 上为 Command 键)可以选择多个组织
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  取消
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "创建中..." : "创建"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}

