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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Organization } from "@prisma/client"
import { User } from "./page"
import { apiClient } from "@/lib/api-client"
import { Checkbox } from "@/components/ui/checkbox"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X } from 'lucide-react'
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
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrganizations, setSelectedOrganizations] = useState<Organization[]>([])
  
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
    setSelectedOrganizations([])
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
      
      // 加载选中的组织
      if (initialData.organizationIds && initialData.organizationIds.length > 0) {
        const selectedOrgs = organizations.filter(org => 
          initialData.organizationIds?.includes(org.id)
        )
        setSelectedOrganizations(selectedOrgs)
      } else {
        setSelectedOrganizations([])
      }
    }
  }, [initialData, editMode, organizations])
  
  // 加载组织列表
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const response = await apiClient.organizations.list();
        console.log("API返回的组织数据:", response);
        const organizationsData = response && response.items ? response.items : 
                                 (response && Array.isArray(response) ? response : []);
        
        console.log("处理后的组织数据:", organizationsData);
        
        const validatedOrgs = organizationsData.filter((org: any) => org && typeof org === 'object');
        console.log("有效的组织数据:", validatedOrgs);
        setOrganizations(validatedOrgs);
      } catch (error) {
        console.error("加载组织失败", error);
      }
    };

    if (open) {
      loadOrganizations();
    }
  }, [open]);
  
  // 筛选组织 - 确保搜索功能正常工作
  const filteredOrganizations = searchTerm.trim() === "" 
    ? organizations 
    : organizations.filter((org: Organization) => {
        if (!org || typeof org !== 'object') return false;
        
        const term = searchTerm.trim().toLowerCase();
        const name = (org.name || "").toLowerCase();
        const code = (org.code || "").toLowerCase();
        
        const nameMatch = name.includes(term);
        const codeMatch = code.includes(term);
        
        console.log(`组织 ${org.name} (${org.code}): 名称匹配=${nameMatch}, 编码匹配=${codeMatch}`);
        
        return nameMatch || codeMatch;
      });
  
  // 添加调试日志
  useEffect(() => {
    console.log("过滤后的组织:", filteredOrganizations);
    if (searchTerm.trim() !== "") {
      console.log("搜索词:", searchTerm);
      console.log("组织总数:", organizations.length);
      console.log("过滤后组织数:", filteredOrganizations.length);
    }
  }, [searchTerm, organizations, filteredOrganizations]);
  
  // 处理组织选择
  const handleOrganizationSelect = (organizationId: string) => {
    console.log(`选择组织ID: ${organizationId}`); // 添加调试信息
    if (organizationId === "none") {
      setSelectedOrganizations([]);
      if (editMode) {
        editForm.setValue("organizationIds", []);
      } else {
        createForm.setValue("organizationIds", []);
      }
      return;
    }
    
    const organization = organizations.find(org => org.id === organizationId);
    if (!organization) return;
    
    // 检查是否已选择该组织
    if (!selectedOrganizations.some(org => org.id === organizationId)) {
      const newSelectedOrgs = [...selectedOrganizations, organization];
      setSelectedOrganizations(newSelectedOrgs);
      
      // 更新表单值 - 确保没有空值
      const orgIds = newSelectedOrgs.map(org => org.id).filter(id => id !== null && id !== undefined && id !== '');
      if (editMode) {
        editForm.setValue("organizationIds", orgIds);
      } else {
        createForm.setValue("organizationIds", orgIds);
      }
    }
  };
  
  // 移除选中的组织
  const removeOrganization = (organizationId: string) => {
    const newSelectedOrgs = selectedOrganizations.filter(org => org.id !== organizationId)
    setSelectedOrganizations(newSelectedOrgs)
    
    // 更新表单值
    const orgIds = newSelectedOrgs.map(org => org.id)
    if (editMode) {
      editForm.setValue("organizationIds", orgIds)
    } else {
      createForm.setValue("organizationIds", orgIds)
    }
  }
  
  // 提交表单
  const onFormSubmit = (data: CreateUserFormValues | EditUserFormValues) => {
    // 确保organizationIds中没有null或空值
    if ('organizationIds' in data && Array.isArray(data.organizationIds)) {
      data.organizationIds = data.organizationIds.filter(id => id !== null && id !== undefined && id !== '');
    }
    
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
                
                {/* 已选组织标签 */}
                {selectedOrganizations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedOrganizations.map((org) => (
                      <Badge key={org.id} variant="secondary" className="flex items-center gap-1">
                        {org.name}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => removeOrganization(org.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* 使用Command组件实现实时搜索 */}
                <div className="relative">
                  <Command className="rounded-lg border shadow-md">
                    <CommandInput 
                      placeholder="搜索组织..." 
                      value={searchTerm}
                      onValueChange={(value) => {
                        console.log("用户输入搜索词:", value);
                        setSearchTerm(value);
                      }}
                      autoFocus
                    />
                    <CommandList>
                      <CommandEmpty>未找到匹配组织</CommandEmpty>
                      <CommandGroup heading="可用组织">
                        <CommandItem
                          key="none"
                          value="none"
                          onSelect={() => handleOrganizationSelect("none")}
                        >
                          无组织
                        </CommandItem>
                        <ScrollArea className="h-[200px]">
                          {organizations.length === 0 ? (
                            <div className="py-2 px-2 text-sm text-muted-foreground">
                              加载组织列表中...
                            </div>
                          ) : filteredOrganizations.length > 0 ? (
                            filteredOrganizations.map((org) => {
                              console.log(`渲染组织: ${org.name} (${org.code})`);
                              console.log(`组织ID: ${org.id}`);
                              return (
                                <CommandItem
                                  key={org.id}
                                  value={org.id}
                                  onSelect={() => handleOrganizationSelect(org.id)}
                                >
                                  {org.name} {org.code && `(${org.code})`}
                                </CommandItem>
                              );
                            })
                          ) : searchTerm.trim() !== "" ? (
                            <div className="py-2 px-2 text-sm text-muted-foreground">
                              没有找到匹配 "{searchTerm}" 的组织
                            </div>
                          ) : (
                            <div className="py-2 px-2 text-sm text-muted-foreground">
                              请输入关键词搜索组织
                            </div>
                          )}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
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
                
                {/* 已选组织标签 */}
                {selectedOrganizations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedOrganizations.map((org) => (
                      <Badge key={org.id} variant="secondary" className="flex items-center gap-1">
                        {org.name}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0"
                          onClick={() => removeOrganization(org.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
                
                {/* 使用Command组件实现实时搜索 */}
                <div className="relative">
                  <Command className="rounded-lg border shadow-md">
                    <CommandInput 
                      placeholder="搜索组织..." 
                      value={searchTerm}
                      onValueChange={(value) => {
                        console.log("用户输入搜索词:", value);
                        setSearchTerm(value);
                      }}
                      autoFocus
                    />
                    <CommandList>
                      <CommandEmpty>未找到匹配组织</CommandEmpty>
                      <CommandGroup heading="可用组织">
                        <CommandItem
                          key="none"
                          value="none"
                          onSelect={() => handleOrganizationSelect("none")}
                        >
                          无组织
                        </CommandItem>
                        <ScrollArea className="h-[200px]">
                          {organizations.length === 0 ? (
                            <div className="py-2 px-2 text-sm text-muted-foreground">
                              加载组织列表中...
                            </div>
                          ) : filteredOrganizations.length > 0 ? (
                            filteredOrganizations.map((org) => {
                              console.log(`渲染组织: ${org.name} (${org.code})`);
                              console.log(`组织ID: ${org.id}`);
                              return (
                                <CommandItem
                                  key={org.id}
                                  value={org.id}
                                  onSelect={() => handleOrganizationSelect(org.id)}
                                >
                                  {org.name} {org.code && `(${org.code})`}
                                </CommandItem>
                              );
                            })
                          ) : searchTerm.trim() !== "" ? (
                            <div className="py-2 px-2 text-sm text-muted-foreground">
                              没有找到匹配 "{searchTerm}" 的组织
                            </div>
                          ) : (
                            <div className="py-2 px-2 text-sm text-muted-foreground">
                              请输入关键词搜索组织
                            </div>
                          )}
                        </ScrollArea>
                      </CommandGroup>
                    </CommandList>
                  </Command>
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

