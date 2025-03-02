"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { useCurrentUser } from "@/hooks/use-current-user"

const roleNames = {
  ADMIN: "系统管理员",
  FINANCE: "财务人员",
  REPORTER: "填报人",
  AUDITOR: "审核人员",
  OBSERVER: "观察者"
}

// 获取拼音首字母的函数
function getInitials(name: string): string {
  // 这里应该使用拼音转换库，但为了演示，我们先使用简单的逻辑
  return name?.slice(0, 2).toUpperCase() || "用户"
}

export function UserNav() {
  const router = useRouter()
  const { user, isLoading } = useCurrentUser()

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push("/auth/login")
  }

  if (isLoading || !user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatars/01.png" alt={user.name || ""} />
            <AvatarFallback>{getInitials(user.name || "")}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            <p className="text-xs leading-none text-muted-foreground">{roleNames[user.role as keyof typeof roleNames]}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            个人信息
          </DropdownMenuItem>
          <DropdownMenuItem>
            修改密码
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

