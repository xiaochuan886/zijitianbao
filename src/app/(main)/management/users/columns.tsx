"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"
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

export type User = {
  id: string
  name: string
  email: string
  role: "admin" | "manager" | "user"
}

export const columns: ColumnDef<User>[] = [
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
  },
  {
    id: "actions",
    cell: ({ row, onEdit }) => {
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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>复制用户ID</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <UserForm initialData={user} onSubmit={(data) => onEdit({ ...data, id: user.id })} />
            </DropdownMenuItem>
            <DropdownMenuItem>重置密码</DropdownMenuItem>
            <DropdownMenuItem>删除用户</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

