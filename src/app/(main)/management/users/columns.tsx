"use client"

import { type ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, LucideCheck, LucideX, Pencil, Trash2, Power } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { UserForm } from "./user-form"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Role } from "@/lib/enums"
import { User } from "./page"
import { Checkbox } from "@/components/ui/checkbox"

// 角色名称映射
const roleLabels: Record<Role, string> = {
  ADMIN: "系统管理员",
  REPORTER: "填报人",
  FINANCE: "财务人员",
  AUDITOR: "审核人员",
  OBSERVER: "观察者"
}

// 角色颜色映射
const roleColors: Record<Role, string> = {
  ADMIN: "bg-red-500 hover:bg-red-600",
  REPORTER: "bg-blue-500 hover:bg-blue-600",
  FINANCE: "bg-green-500 hover:bg-green-600",
  AUDITOR: "bg-amber-500 hover:bg-amber-600",
  OBSERVER: "bg-gray-500 hover:bg-gray-600"
}

interface DataTableProps {
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  onToggleActive: (id: string, active: boolean) => void
}

export const columns = ({ onEdit, onDelete, onToggleActive }: DataTableProps): ColumnDef<User>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: "姓名",
  },
  {
    accessorKey: "email",
    header: "邮箱",
  },
  {
    accessorKey: "role",
    header: "角色",
    cell: ({ row }) => {
      const role = row.getValue("role") as Role
      return (
        <Badge className={roleColors[role]}>
          {roleLabels[role]}
        </Badge>
      )
    }
  },
  {
    id: "organizations",
    header: "所属组织",
    cell: ({ row }) => {
      const user = row.original;
      
      // 获取用户关联的组织
      const organizations = user.organizations || [];
      
      // 如果用户有organizationId但没有organizations数组，添加主要组织
      if (user.organizationId && user.organization && organizations.length === 0) {
        organizations.push(user.organization);
      }
      
      // 如果没有组织
      if (organizations.length === 0) {
        return <span className="text-gray-400">无</span>;
      }
      
      // 统一使用Badge组件显示组织，无论单个还是多个
      return (
        <div className="flex flex-wrap gap-1">
          {organizations.map((org) => (
            <Badge key={org.id} variant="outline" className="bg-gray-50">
              {org.name}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "active",
    header: "状态",
    cell: ({ row }) => {
      const isActive = row.getValue("active") as boolean
      return (
        <Badge variant={isActive ? "default" : "destructive"}>
          {isActive ? "启用" : "禁用"}
        </Badge>
      )
    }
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const user = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">打开菜单</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>操作</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onEdit(user)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onToggleActive(user.id, !user.active)}
            >
              <Power className="mr-2 h-4 w-4" />
              {user.active ? "禁用" : "启用"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(user)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

